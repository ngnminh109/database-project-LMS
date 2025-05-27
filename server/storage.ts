import {
  users,
  authors,
  publishers,
  books,
  loans,
  type User,
  type UpsertUser,
  type Author,
  type InsertAuthor,
  type Publisher,
  type InsertPublisher,
  type Book,
  type InsertBook,
  type BookWithDetails,
  type Loan,
  type InsertLoan,
  type LoanWithDetails,
  type UserWithLoans,
} from "@shared/schema";
import { db } from "./db";
import { eq, like, and, desc, sql, or, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Author operations
  getAuthors(): Promise<Author[]>;
  getAuthor(id: number): Promise<Author | undefined>;
  createAuthor(author: InsertAuthor): Promise<Author>;
  updateAuthor(id: number, author: Partial<InsertAuthor>): Promise<Author>;
  deleteAuthor(id: number): Promise<void>;
  searchAuthors(query: string): Promise<Author[]>;
  
  // Publisher operations
  getPublishers(): Promise<Publisher[]>;
  getPublisher(id: number): Promise<Publisher | undefined>;
  createPublisher(publisher: InsertPublisher): Promise<Publisher>;
  updatePublisher(id: number, publisher: Partial<InsertPublisher>): Promise<Publisher>;
  deletePublisher(id: number): Promise<void>;
  
  // Book operations
  getBooks(filters?: {
    genre?: string;
    status?: string;
    authorId?: number;
    publisherId?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ books: BookWithDetails[]; total: number }>;
  getBook(id: number): Promise<BookWithDetails | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: Partial<InsertBook>): Promise<Book>;
  deleteBook(id: number): Promise<void>;
  searchBooks(query: string): Promise<BookWithDetails[]>;
  
  // Loan operations
  getLoans(filters?: {
    status?: string;
    userId?: string;
    dueDate?: string;
    overdue?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ loans: LoanWithDetails[]; total: number }>;
  getLoan(id: number): Promise<LoanWithDetails | undefined>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  updateLoan(id: number, loan: Partial<InsertLoan>): Promise<Loan>;
  returnBook(loanId: number): Promise<Loan>;
  renewLoan(loanId: number): Promise<Loan>;
  getUserLoans(userId: string): Promise<LoanWithDetails[]>;
  getOverdueLoans(): Promise<LoanWithDetails[]>;
  
  // Member operations
  getMembers(filters?: {
    membershipType?: string;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ members: UserWithLoans[]; total: number }>;
  getMember(id: string): Promise<UserWithLoans | undefined>;
  updateMember(id: string, user: Partial<UpsertUser>): Promise<User>;
  deactivateMember(id: string): Promise<User>;
  
  // Statistics and reports
  getStats(): Promise<{
    totalBooks: number;
    activeLoans: number;
    overdueItems: number;
    activeMembers: number;
  }>;
  getPopularBooks(limit?: number): Promise<Array<BookWithDetails & { loanCount: number }>>;
  getMemberActivity(dateFrom?: string, dateTo?: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Author operations
  async getAuthors(): Promise<Author[]> {
    return await db.select().from(authors).orderBy(authors.name);
  }

  async getAuthor(id: number): Promise<Author | undefined> {
    const [author] = await db.select().from(authors).where(eq(authors.id, id));
    return author;
  }

  async createAuthor(author: InsertAuthor): Promise<Author> {
    const [newAuthor] = await db.insert(authors).values(author).returning();
    return newAuthor;
  }

  async updateAuthor(id: number, author: Partial<InsertAuthor>): Promise<Author> {
    const [updatedAuthor] = await db
      .update(authors)
      .set(author)
      .where(eq(authors.id, id))
      .returning();
    return updatedAuthor;
  }

  async deleteAuthor(id: number): Promise<void> {
    await db.delete(authors).where(eq(authors.id, id));
  }

  async searchAuthors(query: string): Promise<Author[]> {
    return await db
      .select()
      .from(authors)
      .where(like(authors.name, `%${query}%`))
      .orderBy(authors.name)
      .limit(10);
  }

  // Publisher operations
  async getPublishers(): Promise<Publisher[]> {
    return await db.select().from(publishers).orderBy(publishers.name);
  }

  async getPublisher(id: number): Promise<Publisher | undefined> {
    const [publisher] = await db.select().from(publishers).where(eq(publishers.id, id));
    return publisher;
  }

  async createPublisher(publisher: InsertPublisher): Promise<Publisher> {
    const [newPublisher] = await db.insert(publishers).values(publisher).returning();
    return newPublisher;
  }

  async updatePublisher(id: number, publisher: Partial<InsertPublisher>): Promise<Publisher> {
    const [updatedPublisher] = await db
      .update(publishers)
      .set(publisher)
      .where(eq(publishers.id, id))
      .returning();
    return updatedPublisher;
  }

  async deletePublisher(id: number): Promise<void> {
    await db.delete(publishers).where(eq(publishers.id, id));
  }

  // Book operations
  async getBooks(filters: {
    genre?: string;
    status?: string;
    authorId?: number;
    publisherId?: number;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ books: BookWithDetails[]; total: number }> {
    const { genre, status, authorId, publisherId, search, limit = 20, offset = 0 } = filters;

    let whereConditions = [];
    
    if (genre) whereConditions.push(eq(books.genre, genre));
    if (status) whereConditions.push(eq(books.status, status));
    if (authorId) whereConditions.push(eq(books.authorId, authorId));
    if (publisherId) whereConditions.push(eq(books.publisherId, publisherId));
    if (search) {
      whereConditions.push(
        or(
          like(books.title, `%${search}%`),
          like(books.isbn, `%${search}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [booksList, totalCount] = await Promise.all([
      db
        .select({
          id: books.id,
          title: books.title,
          isbn: books.isbn,
          publicationYear: books.publicationYear,
          genre: books.genre,
          status: books.status,
          authorId: books.authorId,
          publisherId: books.publisherId,
          totalCopies: books.totalCopies,
          availableCopies: books.availableCopies,
          createdAt: books.createdAt,
          updatedAt: books.updatedAt,
          author: authors,
          publisher: publishers,
        })
        .from(books)
        .leftJoin(authors, eq(books.authorId, authors.id))
        .leftJoin(publishers, eq(books.publisherId, publishers.id))
        .where(whereClause)
        .orderBy(books.title)
        .limit(limit)
        .offset(offset),
      
      db
        .select({ count: sql<number>`count(*)` })
        .from(books)
        .where(whereClause)
        .then(result => result[0].count)
    ]);

    const booksWithDetails: BookWithDetails[] = booksList.map(row => ({
      id: row.id,
      title: row.title,
      isbn: row.isbn,
      publicationYear: row.publicationYear,
      genre: row.genre,
      status: row.status,
      authorId: row.authorId,
      publisherId: row.publisherId,
      totalCopies: row.totalCopies,
      availableCopies: row.availableCopies,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.author,
      publisher: row.publisher,
    }));

    return { books: booksWithDetails, total: totalCount };
  }

  async getBook(id: number): Promise<BookWithDetails | undefined> {
    const result = await db
      .select({
        id: books.id,
        title: books.title,
        isbn: books.isbn,
        publicationYear: books.publicationYear,
        genre: books.genre,
        status: books.status,
        authorId: books.authorId,
        publisherId: books.publisherId,
        totalCopies: books.totalCopies,
        availableCopies: books.availableCopies,
        createdAt: books.createdAt,
        updatedAt: books.updatedAt,
        author: authors,
        publisher: publishers,
      })
      .from(books)
      .leftJoin(authors, eq(books.authorId, authors.id))
      .leftJoin(publishers, eq(books.publisherId, publishers.id))
      .where(eq(books.id, id));

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      id: row.id,
      title: row.title,
      isbn: row.isbn,
      publicationYear: row.publicationYear,
      genre: row.genre,
      status: row.status,
      authorId: row.authorId,
      publisherId: row.publisherId,
      totalCopies: row.totalCopies,
      availableCopies: row.availableCopies,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.author,
      publisher: row.publisher,
    };
  }

  async createBook(book: InsertBook): Promise<Book> {
    const [newBook] = await db.insert(books).values(book).returning();
    return newBook;
  }

  async updateBook(id: number, book: Partial<InsertBook>): Promise<Book> {
    const [updatedBook] = await db
      .update(books)
      .set({ ...book, updatedAt: new Date() })
      .where(eq(books.id, id))
      .returning();
    return updatedBook;
  }

  async deleteBook(id: number): Promise<void> {
    await db.delete(books).where(eq(books.id, id));
  }

  async searchBooks(query: string): Promise<BookWithDetails[]> {
    const result = await db
      .select({
        id: books.id,
        title: books.title,
        isbn: books.isbn,
        publicationYear: books.publicationYear,
        genre: books.genre,
        status: books.status,
        authorId: books.authorId,
        publisherId: books.publisherId,
        totalCopies: books.totalCopies,
        availableCopies: books.availableCopies,
        createdAt: books.createdAt,
        updatedAt: books.updatedAt,
        author: authors,
        publisher: publishers,
      })
      .from(books)
      .leftJoin(authors, eq(books.authorId, authors.id))
      .leftJoin(publishers, eq(books.publisherId, publishers.id))
      .where(
        or(
          like(books.title, `%${query}%`),
          like(books.isbn, `%${query}%`),
          like(authors.name, `%${query}%`)
        )
      )
      .orderBy(books.title)
      .limit(10);

    return result.map(row => ({
      id: row.id,
      title: row.title,
      isbn: row.isbn,
      publicationYear: row.publicationYear,
      genre: row.genre,
      status: row.status,
      authorId: row.authorId,
      publisherId: row.publisherId,
      totalCopies: row.totalCopies,
      availableCopies: row.availableCopies,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.author,
      publisher: row.publisher,
    }));
  }

  // Loan operations
  async getLoans(filters: {
    status?: string;
    userId?: string;
    dueDate?: string;
    overdue?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ loans: LoanWithDetails[]; total: number }> {
    const { status, userId, dueDate, overdue, limit = 20, offset = 0 } = filters;

    let whereConditions = [];
    
    if (status) whereConditions.push(eq(loans.status, status));
    if (userId) whereConditions.push(eq(loans.userId, userId));
    if (dueDate) whereConditions.push(eq(loans.dueDate, dueDate));
    if (overdue) {
      whereConditions.push(
        and(
          eq(loans.status, "active"),
          lte(loans.dueDate, new Date().toISOString().split('T')[0])
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [loansList, totalCount] = await Promise.all([
      db
        .select({
          loan: loans,
          book: books,
          author: authors,
          publisher: publishers,
          user: users,
        })
        .from(loans)
        .leftJoin(books, eq(loans.bookId, books.id))
        .leftJoin(authors, eq(books.authorId, authors.id))
        .leftJoin(publishers, eq(books.publisherId, publishers.id))
        .leftJoin(users, eq(loans.userId, users.id))
        .where(whereClause)
        .orderBy(desc(loans.createdAt))
        .limit(limit)
        .offset(offset),
      
      db
        .select({ count: sql<number>`count(*)` })
        .from(loans)
        .where(whereClause)
        .then(result => result[0].count)
    ]);

    const loansWithDetails: LoanWithDetails[] = loansList.map(row => ({
      ...row.loan,
      book: {
        ...row.book!,
        author: row.author,
        publisher: row.publisher,
      },
      user: row.user!,
    }));

    return { loans: loansWithDetails, total: totalCount };
  }

  async getLoan(id: number): Promise<LoanWithDetails | undefined> {
    const result = await db
      .select({
        loan: loans,
        book: books,
        author: authors,
        publisher: publishers,
        user: users,
      })
      .from(loans)
      .leftJoin(books, eq(loans.bookId, books.id))
      .leftJoin(authors, eq(books.authorId, authors.id))
      .leftJoin(publishers, eq(books.publisherId, publishers.id))
      .leftJoin(users, eq(loans.userId, users.id))
      .where(eq(loans.id, id));

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      ...row.loan,
      book: {
        ...row.book!,
        author: row.author,
        publisher: row.publisher,
      },
      user: row.user!,
    };
  }

  async createLoan(loan: InsertLoan): Promise<Loan> {
    const [newLoan] = await db.insert(loans).values(loan).returning();
    
    // Update book availability
    await db
      .update(books)
      .set({
        availableCopies: sql`${books.availableCopies} - 1`,
        status: sql`CASE WHEN ${books.availableCopies} - 1 = 0 THEN 'checked_out' ELSE 'available' END`,
        updatedAt: new Date(),
      })
      .where(eq(books.id, loan.bookId));

    return newLoan;
  }

  async updateLoan(id: number, loan: Partial<InsertLoan>): Promise<Loan> {
    const [updatedLoan] = await db
      .update(loans)
      .set({ ...loan, updatedAt: new Date() })
      .where(eq(loans.id, id))
      .returning();
    return updatedLoan;
  }

  async returnBook(loanId: number): Promise<Loan> {
    const [updatedLoan] = await db
      .update(loans)
      .set({
        status: "returned",
        returnDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date(),
      })
      .where(eq(loans.id, loanId))
      .returning();

    // Update book availability
    await db
      .update(books)
      .set({
        availableCopies: sql`${books.availableCopies} + 1`,
        status: "available",
        updatedAt: new Date(),
      })
      .where(eq(books.id, updatedLoan.bookId));

    return updatedLoan;
  }

  async renewLoan(loanId: number): Promise<Loan> {
    const [updatedLoan] = await db
      .update(loans)
      .set({
        renewalCount: sql`${loans.renewalCount} + 1`,
        dueDate: sql`${loans.dueDate} + INTERVAL '14 days'`,
        updatedAt: new Date(),
      })
      .where(eq(loans.id, loanId))
      .returning();

    return updatedLoan;
  }

  async getUserLoans(userId: string): Promise<LoanWithDetails[]> {
    const result = await db
      .select({
        loan: loans,
        book: books,
        author: authors,
        publisher: publishers,
        user: users,
      })
      .from(loans)
      .leftJoin(books, eq(loans.bookId, books.id))
      .leftJoin(authors, eq(books.authorId, authors.id))
      .leftJoin(publishers, eq(books.publisherId, publishers.id))
      .leftJoin(users, eq(loans.userId, users.id))
      .where(eq(loans.userId, userId))
      .orderBy(desc(loans.createdAt));

    return result.map(row => ({
      ...row.loan,
      book: {
        ...row.book!,
        author: row.author,
        publisher: row.publisher,
      },
      user: row.user!,
    }));
  }

  async getOverdueLoans(): Promise<LoanWithDetails[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await db
      .select({
        loan: loans,
        book: books,
        author: authors,
        publisher: publishers,
        user: users,
      })
      .from(loans)
      .leftJoin(books, eq(loans.bookId, books.id))
      .leftJoin(authors, eq(books.authorId, authors.id))
      .leftJoin(publishers, eq(books.publisherId, publishers.id))
      .leftJoin(users, eq(loans.userId, users.id))
      .where(
        and(
          eq(loans.status, "active"),
          lte(loans.dueDate, today)
        )
      )
      .orderBy(loans.dueDate);

    return result.map(row => ({
      ...row.loan,
      book: {
        ...row.book!,
        author: row.author,
        publisher: row.publisher,
      },
      user: row.user!,
    }));
  }

  // Member operations
  async getMembers(filters: {
    membershipType?: string;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ members: UserWithLoans[]; total: number }> {
    const { membershipType, isActive, search, limit = 20, offset = 0 } = filters;

    let whereConditions = [eq(users.role, "patron")];
    
    if (membershipType) whereConditions.push(eq(users.membershipType, membershipType));
    if (isActive !== undefined) whereConditions.push(eq(users.isActive, isActive));
    if (search) {
      whereConditions.push(
        or(
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      );
    }

    const whereClause = and(...whereConditions);

    const [membersList, totalCount] = await Promise.all([
      db
        .select()
        .from(users)
        .where(whereClause)
        .orderBy(users.firstName, users.lastName)
        .limit(limit)
        .offset(offset),
      
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause)
        .then(result => result[0].count)
    ]);

    // Get loans for each member
    const membersWithLoans: UserWithLoans[] = await Promise.all(
      membersList.map(async (member) => {
        const memberLoans = await this.getUserLoans(member.id);
        return {
          ...member,
          loans: memberLoans,
        };
      })
    );

    return { members: membersWithLoans, total: totalCount };
  }

  async getMember(id: string): Promise<UserWithLoans | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const userLoans = await this.getUserLoans(id);
    return {
      ...user,
      loans: userLoans,
    };
  }

  async updateMember(id: string, user: Partial<UpsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deactivateMember(id: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Statistics and reports
  async getStats(): Promise<{
    totalBooks: number;
    activeLoans: number;
    overdueItems: number;
    activeMembers: number;
  }> {
    const today = new Date().toISOString().split('T')[0];

    const [totalBooks, activeLoans, overdueItems, activeMembers] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(books).then(result => result[0].count),
      db.select({ count: sql<number>`count(*)` }).from(loans).where(eq(loans.status, "active")).then(result => result[0].count),
      db.select({ count: sql<number>`count(*)` }).from(loans).where(
        and(eq(loans.status, "active"), lte(loans.dueDate, today))
      ).then(result => result[0].count),
      db.select({ count: sql<number>`count(*)` }).from(users).where(
        and(eq(users.role, "patron"), eq(users.isActive, true))
      ).then(result => result[0].count),
    ]);

    return {
      totalBooks,
      activeLoans,
      overdueItems,
      activeMembers,
    };
  }

  async getPopularBooks(limit = 10): Promise<Array<BookWithDetails & { loanCount: number }>> {
    const result = await db
      .select({
        book: books,
        author: authors,
        publisher: publishers,
        loanCount: sql<number>`count(${loans.id})`,
      })
      .from(books)
      .leftJoin(authors, eq(books.authorId, authors.id))
      .leftJoin(publishers, eq(books.publisherId, publishers.id))
      .leftJoin(loans, eq(books.id, loans.bookId))
      .groupBy(books.id, authors.id, publishers.id)
      .orderBy(desc(sql`count(${loans.id})`))
      .limit(limit);

    return result.map(row => ({
      ...row.book,
      author: row.author,
      publisher: row.publisher,
      loanCount: row.loanCount,
    }));
  }

  async getMemberActivity(dateFrom?: string, dateTo?: string): Promise<any[]> {
    let whereConditions = [];
    
    if (dateFrom) whereConditions.push(gte(loans.loanDate, dateFrom));
    if (dateTo) whereConditions.push(lte(loans.loanDate, dateTo));

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const result = await db
      .select({
        userId: loans.userId,
        user: users,
        loanCount: sql<number>`count(${loans.id})`,
      })
      .from(loans)
      .leftJoin(users, eq(loans.userId, users.id))
      .where(whereClause)
      .groupBy(loans.userId, users.id)
      .orderBy(desc(sql`count(${loans.id})`));

    return result;
  }
}

export const storage = new DatabaseStorage();
