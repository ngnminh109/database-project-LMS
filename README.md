# 📌 Library Management System

## 📄 Brief Description

This project implements a **Library Management System** that enables administrators to efficiently manage books, borrowers, and loans in a library setting. The system addresses the challenges of manual tracking by offering a web-based interface integrated with a MySQL backend. It supports entity management (books, users, loans), real-time reporting, user authentication, and access control.

## 🎯 Functional & Non-functional Requirements

### Functional Requirements:
- Manage core entities: books, borrowers, authors, and loans
- Perform CRUD operations on all entities
- Track borrowing history and overdue loans
- Generate daily/monthly/yearly reports using SQL views and aggregations
- Provide authentication with roles: Admin, Librarian, User
- Implement stored procedures (e.g., borrow/return book) and triggers (e.g., update availability)

### Non-functional Requirements:
- Database normalization up to 3NF
- Security via user roles and encrypted passwords
- Fast query execution through indexing and optimization
- Responsive, dynamic web UI
- Code reproducibility and clear documentation

## 🧱 Planned Core Entities (brief outline)

- **Book**: ID, Title, Author_ID, Genre, ISBN, Status
- **Author**: ID, Name, Nationality
- **Borrower/User**: ID, Name, Email, Role, Password
- **Loan**: ID, Book_ID, User_ID, Borrow_Date, Return_Date, Status

## 🔧 Tech Stack

- **Database**: MySQL (Workbench or CLI)
- **Backend**: PHP with MySQLi
- **Frontend**: HTML, CSS, JavaScript
- **Tools**: MySQL Workbench, GitHub, VS Code
- **Security**: MySQL encryption functions, prepared statements

## 👥 Team Members and Roles

- **Can Ha An**: Database design, Stored Procedures, Triggers
- **Le Gia Duc**: Web integration, Frontend development
- **All members**: Reporting, Analytics, Testing

## 📅 Timeline (Planned Milestones)

| Date Range         | Milestone                                                                 |
|--------------------|-------------------------------------------------------------------------- |
| May 6 – May 10     | Team formation, project scope definition, and requirements gathering      |
| May 11 – May 15    | ERD design, normalization to 3NF, and creation of DDL scripts             |
| May 16 – May 20    | Implementation of database: tables, views, procedures, triggers           |
| May 21 – May 24    | Web interface development: CRUD operations, reporting, authentication     |
| May 25 – May 26    | Final testing, performance tuning, and documentation                      |
| May 27, 2025       | Project presentation and final submission                                 |


---

> 💡 All source code will be published to GitHub with full documentation and reproducibility.
