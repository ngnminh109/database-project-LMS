# Library Management System 

## 📋 Project Overview

This Library Management System demonstrates advanced MySQL database implementation with enterprise-level security, stored procedures, triggers, and user management. 

## 🗂️ File Structure 

```
Library MS/
├── schema.sql              # Complete database schema with security
├── sample-data.sql         # Sample data with demonstrations
├── README.md              # This file - complete setup guide
├── package.json           # Node.js dependencies
├── client/                # React frontend application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Main application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and API client
├── server/                # Express backend application
│   ├── db.ts             # Database connection
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Data access layer
│   └── index.ts          # Server entry point
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema definitions
├── vite.config.ts        # Frontend build configuration
└── tsconfig.json         # TypeScript configuration
```

## 🚀 Local Setup Instructions

### Prerequisites
- MySQL 8.0 or higher installed
- MySQL Workbench (recommended) or MySQL CLI
- Administrative access to MySQL server

### Step 1: Database Setup

**Using MySQL Workbench**
1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Open and execute `schema.sql`
4. Open and execute `sample-data.sql`

### Step 2: Web Application Setup (Optional - For Interactive Demo)

To run the complete web interface:

```bash
# Install Node.js dependencies
npm install

# Configure environment variables
# Create a .env file with:
DATABASE_URL=mysql://library_admin:LibAdmin2024!@localhost:3306/library_management
SESSION_SECRET=your-secret-key
REPL_ID=local-demo
REPLIT_DOMAINS=localhost:5000

# Start the application
npm run dev
```

The web application will be available at `http://localhost:5000` and provides:
- **Interactive Entity Management**: Add/edit/delete books, authors, publishers
- **Real-time Analytics**: View library statistics and reports
- **Role-based Access**: Staff and patron interfaces
- **CRUD Operations**: Complete database interaction through web interface

### Step 3: Verify Installation

```sql
-- Check all tables are created
SHOW TABLES;

-- Verify user roles are created
SELECT User, Host FROM mysql.user WHERE User LIKE 'library_%';

-- Test sample data
SELECT COUNT(*) as book_count FROM books;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as loan_count FROM loans;

-- View library statistics
SELECT * FROM library_stats;
```

### Step 4: Test Security Features

```sql
-- Test user authentication procedure
CALL AuthenticateUser('alice.johnson@email.com', 'password123', @user_id, @role, @is_valid);
SELECT @user_id, @role, @is_valid;

-- Test loan processing
CALL ProcessLoan('user_002', 3, 14);

-- Test book return
CALL ReturnBook(1, CURDATE());

-- View audit logs
SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 5;
```

## 📊 Database Features Demonstration

### Stored Procedures
- `ProcessLoan()` - Secure loan creation with validation
- `ReturnBook()` - Book return with automatic fine calculation
- `AuthenticateUser()` - Secure user authentication with encryption

### Triggers
- `UpdateOverdueLoans` - Automatic status updates for overdue items
- `audit_users_update` - Comprehensive audit trail for user changes
- `prevent_book_deletion` - Business rule enforcement

### Views
- `book_catalog` - Complete book information with author/publisher details
- `active_loans` - Current loans with user and book information
- `library_stats` - Real-time library statistics dashboard

### Security Features
- Role-based access control with three user levels
- Password encryption using SHA2 with salt
- Prepared statements preventing SQL injection
- Audit logging for all critical operations

## 🔧 Testing the Implementation

### Business Logic Testing
```sql
-- Test loan creation with validation
CALL ProcessLoan('user_001', 1, 14);

-- Test overdue detection
UPDATE loans SET due_date = DATE_SUB(CURDATE(), INTERVAL 5 DAY) WHERE id = 1;

-- Test fine calculation
CALL ReturnBook(1, CURDATE());
```

### Security Testing
```sql
-- Test role permissions
-- Connect as library_staff user
-- Try accessing different tables to verify permissions

-- Test authentication
CALL AuthenticateUser('test@email.com', 'wrong_password', @id, @role, @valid);
-- Should return @valid = FALSE
```

### Performance Testing
```sql
-- Analyze query performance
EXPLAIN SELECT * FROM book_catalog WHERE genre = 'Fiction';

-- View partition information
SELECT PARTITION_NAME, TABLE_ROWS 
FROM INFORMATION_SCHEMA.PARTITIONS 
WHERE TABLE_NAME = 'books';
```

## 📈 Performance Optimization

The database includes several performance enhancements:

1. **Table Partitioning**: Books table partitioned by publication year
2. **Strategic Indexing**: Indexes on frequently queried columns
3. **Composite Indexes**: Multi-column indexes for complex queries
4. **Full-Text Search**: Optimized text search capabilities

## 🔒 Security Implementation

Security is implemented at multiple layers:

1. **Database Level**: User roles with appropriate privileges
2. **Application Level**: Prepared statements and input validation
3. **Data Level**: Encrypted passwords and audit trails
4. **Access Level**: Role-based permissions and failed login protection

## 📋 Sample Data Included

The database comes pre-loaded with realistic sample data:
- 10 books across various genres
- 6 authors with biographical information
- 5 publishers with contact details
- 8 users (patrons and staff) with encrypted passwords
- Multiple loan scenarios (active, returned, overdue)
- Comprehensive audit trail examples

For full functionality demonstration, the application needs to be run locally with:
1. MySQL database running
2. Node.js backend server running  
3. Environment variables configured
