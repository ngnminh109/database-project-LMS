-- =====================================================
-- Library Management System Database Schema
-- MySQL Implementation with Security and Advanced Features
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS library_management;
USE library_management;

-- =====================================================
-- USER ROLES AND SECURITY CONFIGURATION
-- =====================================================

-- Create user roles with appropriate privileges
CREATE USER IF NOT EXISTS 'library_admin'@'%' IDENTIFIED BY 'LibAdmin2024!';
CREATE USER IF NOT EXISTS 'library_staff'@'%' IDENTIFIED BY 'Staff2024!';
CREATE USER IF NOT EXISTS 'library_patron'@'%' IDENTIFIED BY 'Patron2024!';

-- Grant privileges based on roles
-- Admin: Full access to all tables and procedures
GRANT ALL PRIVILEGES ON library_management.* TO 'library_admin'@'%';

-- Staff: Read/Write access to most tables, limited user management
GRANT SELECT, INSERT, UPDATE ON library_management.books TO 'library_staff'@'%';
GRANT SELECT, INSERT, UPDATE ON library_management.authors TO 'library_staff'@'%';
GRANT SELECT, INSERT, UPDATE ON library_management.publishers TO 'library_staff'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON library_management.loans TO 'library_staff'@'%';
GRANT SELECT, UPDATE ON library_management.users TO 'library_staff'@'%';
GRANT EXECUTE ON PROCEDURE library_management.ProcessLoan TO 'library_staff'@'%';
GRANT EXECUTE ON PROCEDURE library_management.ReturnBook TO 'library_staff'@'%';

-- Patron: Limited read access and own record updates
GRANT SELECT ON library_management.books TO 'library_patron'@'%';
GRANT SELECT ON library_management.authors TO 'library_patron'@'%';
GRANT SELECT ON library_management.publishers TO 'library_patron'@'%';
GRANT SELECT ON library_management.loans TO 'library_patron'@'%';
GRANT EXECUTE ON PROCEDURE library_management.BorrowBook TO 'library_patron'@'%';

FLUSH PRIVILEGES;

-- =====================================================
-- TABLE DEFINITIONS WITH SECURITY FEATURES
-- =====================================================

-- Sessions table for authentication
CREATE TABLE sessions (
    sid VARCHAR(255) NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL,
    INDEX IDX_session_expire (expire)
) ENGINE=InnoDB;

-- Users table with encrypted passwords
CREATE TABLE users (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    profile_image_url VARCHAR(500),
    password_hash VARCHAR(255), -- For encrypted passwords
    role ENUM('patron', 'staff') DEFAULT 'patron',
    membership_type ENUM('standard', 'premium', 'student') DEFAULT 'standard',
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INT DEFAULT 0,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Security constraints
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- Authors table
CREATE TABLE authors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    nationality VARCHAR(100),
    date_of_birth DATE,
    biography TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    INDEX idx_name (name),
    INDEX idx_nationality (nationality)
) ENGINE=InnoDB;

-- Publishers table
CREATE TABLE publishers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    website VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE KEY uk_publisher_email (email),
    INDEX idx_name (name)
) ENGINE=InnoDB;

-- Books table with partitioning by publication year
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    author_id INT,
    publisher_id INT,
    genre VARCHAR(100),
    publication_year INT,
    total_copies INT DEFAULT 1 CHECK (total_copies >= 0),
    available_copies INT DEFAULT 1 CHECK (available_copies >= 0),
    price DECIMAL(10, 2),
    status ENUM('available', 'checked_out', 'missing') DEFAULT 'available',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL,
    FOREIGN KEY (publisher_id) REFERENCES publishers(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_title (title),
    INDEX idx_isbn (isbn),
    INDEX idx_genre (genre),
    INDEX idx_status (status),
    INDEX idx_publication_year (publication_year),
    
    -- Ensure available copies never exceed total copies
    CONSTRAINT chk_copies CHECK (available_copies <= total_copies)
) ENGINE=InnoDB
PARTITION BY RANGE (publication_year) (
    PARTITION p_before_1950 VALUES LESS THAN (1950),
    PARTITION p_1950_1999 VALUES LESS THAN (2000),
    PARTITION p_2000_2009 VALUES LESS THAN (2010),
    PARTITION p_2010_2019 VALUES LESS THAN (2020),
    PARTITION p_2020_future VALUES LESS THAN MAXVALUE
);

-- Loans table with audit trail
CREATE TABLE loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    book_id INT NOT NULL,
    loan_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE NULL,
    renew_count INT DEFAULT 0 CHECK (renew_count <= 2),
    status ENUM('active', 'returned', 'overdue') DEFAULT 'active',
    fine DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_book_id (book_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    INDEX idx_loan_date (loan_date)
) ENGINE=InnoDB;

-- Audit table for tracking changes
CREATE TABLE audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    operation ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    record_id VARCHAR(255) NOT NULL,
    old_values JSON,
    new_values JSON,
    user_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_table_operation (table_name, operation),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB;

-- =====================================================
-- STORED PROCEDURES FOR BUSINESS LOGIC
-- =====================================================

DELIMITER //

-- Procedure to safely create a new loan
CREATE PROCEDURE ProcessLoan(
    IN p_user_id VARCHAR(255),
    IN p_book_id INT,
    IN p_loan_days INT DEFAULT 14
)
BEGIN
    DECLARE book_available INT DEFAULT 0;
    DECLARE user_active BOOLEAN DEFAULT FALSE;
    DECLARE user_overdue_count INT DEFAULT 0;
    DECLARE new_due_date DATE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Check if book is available
    SELECT available_copies INTO book_available 
    FROM books WHERE id = p_book_id FOR UPDATE;
    
    -- Check if user is active and not overdue
    SELECT is_active INTO user_active FROM users WHERE id = p_user_id;
    SELECT COUNT(*) INTO user_overdue_count 
    FROM loans WHERE user_id = p_user_id AND status = 'overdue';
    
    -- Validate loan conditions
    IF book_available <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book not available for loan';
    END IF;
    
    IF NOT user_active THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User account is not active';
    END IF;
    
    IF user_overdue_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User has overdue items';
    END IF;
    
    -- Calculate due date
    SET new_due_date = DATE_ADD(CURDATE(), INTERVAL p_loan_days DAY);
    
    -- Create loan record
    INSERT INTO loans (user_id, book_id, loan_date, due_date)
    VALUES (p_user_id, p_book_id, CURDATE(), new_due_date);
    
    -- Update book availability
    UPDATE books 
    SET available_copies = available_copies - 1,
        status = CASE WHEN available_copies - 1 = 0 THEN 'checked_out' ELSE status END
    WHERE id = p_book_id;
    
    COMMIT;
END //

-- Procedure to return a book
CREATE PROCEDURE ReturnBook(
    IN p_loan_id INT,
    IN p_return_date DATE DEFAULT NULL
)
BEGIN
    DECLARE v_book_id INT;
    DECLARE v_due_date DATE;
    DECLARE v_fine DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_return_date DATE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Set return date to today if not provided
    SET v_return_date = IFNULL(p_return_date, CURDATE());
    
    -- Get loan details
    SELECT book_id, due_date INTO v_book_id, v_due_date
    FROM loans WHERE id = p_loan_id AND status = 'active';
    
    -- Calculate fine if overdue (assuming $0.50 per day)
    IF v_return_date > v_due_date THEN
        SET v_fine = DATEDIFF(v_return_date, v_due_date) * 0.50;
    END IF;
    
    -- Update loan record
    UPDATE loans 
    SET return_date = v_return_date,
        status = 'returned',
        fine = v_fine
    WHERE id = p_loan_id;
    
    -- Update book availability
    UPDATE books 
    SET available_copies = available_copies + 1,
        status = 'available'
    WHERE id = v_book_id;
    
    COMMIT;
END //

-- Function to encrypt passwords
CREATE FUNCTION EncryptPassword(plain_password VARCHAR(255))
RETURNS VARCHAR(255)
READS SQL DATA
DETERMINISTIC
BEGIN
    RETURN SHA2(CONCAT(plain_password, 'library_salt_2024'), 256);
END //

-- Procedure for secure user authentication
CREATE PROCEDURE AuthenticateUser(
    IN p_email VARCHAR(255),
    IN p_password VARCHAR(255),
    OUT p_user_id VARCHAR(255),
    OUT p_role VARCHAR(20),
    OUT p_is_valid BOOLEAN
)
BEGIN
    DECLARE v_stored_hash VARCHAR(255);
    DECLARE v_failed_attempts INT DEFAULT 0;
    DECLARE v_is_active BOOLEAN DEFAULT FALSE;
    
    SET p_is_valid = FALSE;
    SET p_user_id = NULL;
    SET p_role = NULL;
    
    -- Get user details
    SELECT id, password_hash, role, is_active, failed_login_attempts
    INTO p_user_id, v_stored_hash, p_role, v_is_active, v_failed_attempts
    FROM users WHERE email = p_email;
    
    -- Check if user exists and account is active
    IF p_user_id IS NOT NULL AND v_is_active AND v_failed_attempts < 5 THEN
        -- Verify password
        IF v_stored_hash = EncryptPassword(p_password) THEN
            SET p_is_valid = TRUE;
            -- Reset failed attempts and update last login
            UPDATE users 
            SET failed_login_attempts = 0, last_login = CURRENT_TIMESTAMP 
            WHERE id = p_user_id;
        ELSE
            -- Increment failed attempts
            UPDATE users 
            SET failed_login_attempts = failed_login_attempts + 1 
            WHERE id = p_user_id;
        END IF;
    END IF;
END //

DELIMITER ;

-- =====================================================
-- TRIGGERS FOR AUDIT TRAIL AND BUSINESS RULES
-- =====================================================

DELIMITER //

-- Trigger to update overdue loan status
CREATE TRIGGER UpdateOverdueLoans
BEFORE UPDATE ON loans
FOR EACH ROW
BEGIN
    IF NEW.status = 'active' AND NEW.due_date < CURDATE() THEN
        SET NEW.status = 'overdue';
    END IF;
END //

-- Audit trigger for user table
CREATE TRIGGER audit_users_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, old_values, new_values, user_id)
    VALUES (
        'users', 
        'UPDATE', 
        NEW.id,
        JSON_OBJECT('email', OLD.email, 'role', OLD.role, 'is_active', OLD.is_active),
        JSON_OBJECT('email', NEW.email, 'role', NEW.role, 'is_active', NEW.is_active),
        NEW.id
    );
END //

-- Trigger to prevent deletion of books with active loans
CREATE TRIGGER prevent_book_deletion
BEFORE DELETE ON books
FOR EACH ROW
BEGIN
    DECLARE loan_count INT DEFAULT 0;
    
    SELECT COUNT(*) INTO loan_count 
    FROM loans 
    WHERE book_id = OLD.id AND status IN ('active', 'overdue');
    
    IF loan_count > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Cannot delete book with active loans';
    END IF;
END //

DELIMITER ;

-- =====================================================
-- VIEWS FOR REPORTING AND DATA ACCESS
-- =====================================================

-- View for book availability with author/publisher details
CREATE VIEW book_catalog AS
SELECT 
    b.id,
    b.title,
    b.isbn,
    a.name AS author_name,
    p.name AS publisher_name,
    b.genre,
    b.publication_year,
    b.total_copies,
    b.available_copies,
    b.status,
    CASE 
        WHEN b.available_copies > 0 THEN 'Available'
        ELSE 'Not Available'
    END AS availability_status
FROM books b
LEFT JOIN authors a ON b.author_id = a.id
LEFT JOIN publishers p ON b.publisher_id = p.id;

-- View for current loans with user and book details
CREATE VIEW active_loans AS
SELECT 
    l.id AS loan_id,
    u.id AS user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS user_name,
    u.email,
    b.title AS book_title,
    a.name AS author_name,
    l.loan_date,
    l.due_date,
    l.status,
    DATEDIFF(CURDATE(), l.due_date) AS days_overdue,
    l.fine
FROM loans l
JOIN users u ON l.user_id = u.id
JOIN books b ON l.book_id = b.id
LEFT JOIN authors a ON b.author_id = a.id
WHERE l.status IN ('active', 'overdue');

-- View for library statistics
CREATE VIEW library_stats AS
SELECT 
    (SELECT COUNT(*) FROM books) AS total_books,
    (SELECT SUM(total_copies) FROM books) AS total_copies,
    (SELECT COUNT(*) FROM loans WHERE status = 'active') AS active_loans,
    (SELECT COUNT(*) FROM loans WHERE status = 'overdue') AS overdue_loans,
    (SELECT COUNT(*) FROM users WHERE is_active = TRUE) AS active_users,
    (SELECT COUNT(*) FROM users WHERE role = 'patron') AS total_patrons,
    (SELECT COUNT(*) FROM users WHERE role = 'staff') AS total_staff;

-- =====================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX idx_loans_user_status ON loans(user_id, status);
CREATE INDEX idx_books_genre_status ON books(genre, status);
CREATE INDEX idx_books_author_title ON books(author_id, title);

-- Full-text search indexes
ALTER TABLE books ADD FULLTEXT(title, description);
ALTER TABLE authors ADD FULLTEXT(name, biography);

-- =====================================================
-- SECURITY ENHANCEMENTS
-- =====================================================

-- Create backup user with limited privileges
CREATE USER IF NOT EXISTS 'backup_user'@'localhost' IDENTIFIED BY 'BackupUser2024!';
GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON library_management.* TO 'backup_user'@'localhost';

FLUSH PRIVILEGES;