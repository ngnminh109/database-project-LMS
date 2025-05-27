-- =====================================================
-- Library Management System Sample Data
-- Secure data insertion with encrypted passwords
-- =====================================================

USE library_management;

-- =====================================================
-- INSERT SAMPLE AUTHORS
-- =====================================================

INSERT INTO authors (name, nationality, date_of_birth, biography) VALUES
('George Orwell', 'British', '1903-06-25', 'English novelist, essayist, journalist and critic. His work is characterised by lucid prose, biting social criticism, opposition to totalitarianism, and outspoken support of democratic socialism.'),
('Harper Lee', 'American', '1926-04-28', 'American novelist widely known for To Kill a Mockingbird, published in 1960. Immediately successful, it won the 1961 Pulitzer Prize and has become a classic of modern American literature.'),
('F. Scott Fitzgerald', 'American', '1896-09-24', 'American novelist, essayist, short story writer, and screenwriter. He was best known for his novels depicting the flamboyance and excess of the Jazz Age.'),
('Jane Austen', 'British', '1775-12-16', 'English novelist known primarily for her six major novels, which interpret, critique and comment upon the British landed gentry at the end of the 18th century.'),
('Agatha Christie', 'British', '1890-09-15', 'English writer known for her detective novels, especially those featuring Hercule Poirot and Miss Jane Marple. She also wrote the world''s longest-running play, The Mousetrap.'),
('J.K. Rowling', 'British', '1965-07-31', 'British author, philanthropist, film producer, television producer, and screenwriter. She is best known for writing the Harry Potter fantasy series.');

-- =====================================================
-- INSERT SAMPLE PUBLISHERS
-- =====================================================

INSERT INTO publishers (name, address, website, email) VALUES
('Penguin Random House', '1745 Broadway, New York, NY 10019, USA', 'https://www.penguinrandomhouse.com', 'info@penguinrandomhouse.com'),
('HarperCollins Publishers', '195 Broadway, New York, NY 10007, USA', 'https://www.harpercollins.com', 'contact@harpercollins.com'),
('Bloomsbury Publishing', '50 Bedford Square, London WC1B 3DP, UK', 'https://www.bloomsbury.com', 'info@bloomsbury.com'),
('Macmillan Publishers', '120 Broadway, New York, NY 10271, USA', 'https://www.macmillan.com', 'publicity@macmillan.com'),
('Simon & Schuster', '1230 Avenue of the Americas, New York, NY 10020, USA', 'https://www.simonandschuster.com', 'info@simonandschuster.com');

-- =====================================================
-- INSERT SAMPLE BOOKS
-- =====================================================

INSERT INTO books (title, isbn, author_id, publisher_id, genre, publication_year, total_copies, available_copies, price, description) VALUES
('Animal Farm', '978-0-452-28424-1', 1, 1, 'Political Satire', 1945, 3, 1, 12.99, 'A farm is taken over by its overworked, mistreated animals. With flaming idealism and stirring slogans, they set out to create a paradise of progress, justice, and equality.'),
('1984', '978-0-452-28423-4', 1, 1, 'Dystopian Fiction', 1949, 2, 0, 14.99, 'A startling and haunting novel that creates an imaginary world that is completely convincing from start to finish, no reader can fail to be affected by this novel.'),
('To Kill a Mockingbird', '978-0-06-112008-4', 2, 2, 'Southern Gothic', 1960, 2, 1, 13.99, 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.'),
('The Great Gatsby', '978-0-7432-7356-5', 3, 1, 'Literary Fiction', 1925, 3, 2, 15.99, 'The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan, of lavish parties on Long Island.'),
('Pride and Prejudice', '978-0-14-143951-8', 4, 1, 'Romance', 1813, 2, 2, 11.99, 'The romantic clash between the opinionated Elizabeth Bennet and the haughty Mr. Darcy.'),
('Murder on the Orient Express', '978-0-06-207350-4', 5, 2, 'Mystery', 1934, 2, 1, 16.99, 'Just after midnight, the famous Orient Express is stopped in its tracks by a snowdrift. By morning, the millionaire Samuel Edward Ratchett lies dead in his compartment.'),
('Harry Potter and the Philosopher''s Stone', '978-0-7475-3269-9', 6, 3, 'Fantasy', 1997, 4, 3, 18.99, 'Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive.'),
('Sense and Sensibility', '978-0-14-143966-2', 4, 1, 'Romance', 1811, 2, 2, 12.99, 'The story of Elinor and Marianne Dashwood, sisters who respectively represent the "sense" and "sensibility" of the title.'),
('Coming Up for Air', '978-0-15-622687-5', 1, 4, 'Literary Fiction', 1939, 1, 1, 13.99, 'George Bowling, a middle-aged insurance salesman, escapes his dreary life through an unexpected windfall.'),
('Emma', '978-0-14-143958-7', 4, 1, 'Romance', 1815, 2, 1, 12.99, 'Emma Woodhouse, handsome, clever, and rich, with a comfortable home and happy disposition.');

-- =====================================================
-- INSERT SAMPLE USERS WITH ENCRYPTED PASSWORDS
-- =====================================================

-- Insert users with encrypted passwords using the EncryptPassword function
INSERT INTO users (id, email, first_name, last_name, password_hash, role, membership_type, is_active) VALUES
('user_001', 'alice.johnson@email.com', 'Alice', 'Johnson', EncryptPassword('password123'), 'patron', 'standard', TRUE),
('user_002', 'bob.smith@email.com', 'Bob', 'Smith', EncryptPassword('password123'), 'patron', 'premium', TRUE),
('user_003', 'carol.davis@email.com', 'Carol', 'Davis', EncryptPassword('password123'), 'patron', 'student', TRUE),
('user_004', 'david.wilson@email.com', 'David', 'Wilson', EncryptPassword('password123'), 'patron', 'standard', TRUE),
('user_005', 'eva.brown@email.com', 'Eva', 'Brown', EncryptPassword('password123'), 'patron', 'premium', TRUE),
('staff_001', 'sarah.librarian@library.edu', 'Sarah', 'Wilson', EncryptPassword('librarian456'), 'staff', 'standard', TRUE),
('staff_002', 'john.manager@library.edu', 'John', 'Manager', EncryptPassword('manager789'), 'staff', 'standard', TRUE),
('admin_001', 'admin@library.edu', 'Library', 'Administrator', EncryptPassword('admin_secure_2024'), 'staff', 'standard', TRUE);

-- =====================================================
-- INSERT SAMPLE LOANS USING STORED PROCEDURES
-- =====================================================

-- Create some active loans using the secure ProcessLoan procedure
CALL ProcessLoan('user_001', 2, 14); -- Alice borrows 1984 (will be overdue)
CALL ProcessLoan('user_002', 1, 14); -- Bob borrows Animal Farm
CALL ProcessLoan('user_003', 6, 14); -- Carol borrows Murder on the Orient Express
CALL ProcessLoan('user_004', 7, 21); -- David borrows Harry Potter (extended loan)
CALL ProcessLoan('user_005', 10, 14); -- Eva borrows Emma

-- Manually create some historical loans (returned books)
INSERT INTO loans (user_id, book_id, loan_date, due_date, return_date, status, fine) VALUES
('user_001', 4, DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_SUB(CURDATE(), INTERVAL 16 DAY), DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'returned', 0.00),
('user_002', 5, DATE_SUB(CURDATE(), INTERVAL 25 DAY), DATE_SUB(CURDATE(), INTERVAL 11 DAY), DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'returned', 0.00),
('user_003', 8, DATE_SUB(CURDATE(), INTERVAL 45 DAY), DATE_SUB(CURDATE(), INTERVAL 31 DAY), DATE_SUB(CURDATE(), INTERVAL 28 DAY), 'returned', 1.50);

-- Update one loan to be overdue for testing
UPDATE loans 
SET due_date = DATE_SUB(CURDATE(), INTERVAL 3 DAY), 
    status = 'overdue' 
WHERE user_id = 'user_001' AND book_id = 2 AND status = 'active';

-- =====================================================
-- CREATE DEMONSTRATION REPORTS
-- =====================================================

-- View all books in catalog
SELECT 'BOOK CATALOG REPORT' AS report_title;
SELECT * FROM book_catalog ORDER BY author_name, title;

-- View current active loans
SELECT 'ACTIVE LOANS REPORT' AS report_title;
SELECT * FROM active_loans ORDER BY due_date;

-- View library statistics
SELECT 'LIBRARY STATISTICS REPORT' AS report_title;
SELECT * FROM library_stats;

-- View overdue items
SELECT 'OVERDUE ITEMS REPORT' AS report_title;
SELECT 
    loan_id,
    user_name,
    email,
    book_title,
    author_name,
    due_date,
    days_overdue,
    CONCAT('$', FORMAT(fine, 2)) AS fine_amount
FROM active_loans 
WHERE status = 'overdue'
ORDER BY days_overdue DESC;

-- View popular books (most borrowed)
SELECT 'POPULAR BOOKS REPORT' AS report_title;
SELECT 
    b.title,
    a.name AS author_name,
    COUNT(l.id) AS total_loans,
    b.available_copies,
    b.total_copies
FROM books b
LEFT JOIN authors a ON b.author_id = a.id
LEFT JOIN loans l ON b.id = l.book_id
GROUP BY b.id, b.title, a.name, b.available_copies, b.total_copies
ORDER BY total_loans DESC
LIMIT 10;

-- =====================================================
-- DEMONSTRATION OF SECURITY FEATURES
-- =====================================================

-- Show user authentication example
SELECT 'SECURITY DEMONSTRATION' AS demo_title;

-- Example of calling authentication procedure (would be done by application)
-- CALL AuthenticateUser('alice.johnson@email.com', 'password123', @user_id, @role, @is_valid);
-- SELECT @user_id AS authenticated_user_id, @role AS user_role, @is_valid AS login_successful;

-- Show audit log entries
SELECT 'AUDIT LOG SAMPLE' AS log_title;
SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 5;

-- Show user roles and privileges
SELECT 'DATABASE USERS AND ROLES' AS security_info;
SELECT 
    User as username,
    Host as host_allowed,
    authentication_string as encrypted_password
FROM mysql.user 
WHERE User LIKE 'library_%' OR User LIKE 'backup_%';

-- =====================================================
-- PERFORMANCE OPTIMIZATION EXAMPLES
-- =====================================================

-- Show explain plan for a complex query
SELECT 'QUERY PERFORMANCE ANALYSIS' AS performance_title;
EXPLAIN SELECT 
    b.title,
    a.name AS author_name,
    p.name AS publisher_name,
    COUNT(l.id) AS loan_count
FROM books b
LEFT JOIN authors a ON b.author_id = a.id
LEFT JOIN publishers p ON b.publisher_id = p.id
LEFT JOIN loans l ON b.id = l.book_id
WHERE b.genre = 'Fiction'
GROUP BY b.id, b.title, a.name, p.name
ORDER BY loan_count DESC;

-- Show partition information
SELECT 'TABLE PARTITIONING INFO' AS partition_info;
SELECT 
    PARTITION_NAME,
    PARTITION_DESCRIPTION,
    TABLE_ROWS,
    PARTITION_METHOD
FROM INFORMATION_SCHEMA.PARTITIONS 
WHERE TABLE_SCHEMA = 'library_management' 
AND TABLE_NAME = 'books'
AND PARTITION_NAME IS NOT NULL;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'DATABASE SETUP COMPLETE!' AS status,
       'Sample data has been loaded successfully' AS message,
       'Your Library Management System is ready for testing' AS next_step;