import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  date,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["patron", "staff"] }).default("patron"),
  membershipType: varchar("membership_type", { enum: ["standard", "premium", "student"] }).default("standard"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nationality: varchar("nationality", { length: 100 }),
  dateOfBirth: date("date_of_birth"),
  biography: text("biography"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const publishers = pgTable("publishers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  website: varchar("website", { length: 255 }),
  email: varchar("email", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  isbn: varchar("isbn", { length: 20 }).unique(),
  authorId: integer("author_id").references(() => authors.id),
  publisherId: integer("publisher_id").references(() => publishers.id),
  genre: varchar("genre", { length: 100 }),
  publicationYear: integer("publication_year"),
  totalCopies: integer("total_copies").default(1),
  availableCopies: integer("available_copies").default(1),
  price: decimal("price", { precision: 10, scale: 2 }),
  status: varchar("status", { enum: ["available", "checked_out", "missing"] }).default("available"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  loanDate: date("loan_date").notNull(),
  dueDate: date("due_date").notNull(),
  returnDate: date("return_date"),
  renewCount: integer("renew_count").default(0),
  status: varchar("status", { enum: ["active", "returned", "overdue"] }).default("active"),
  fine: decimal("fine", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations between tables
export const usersRelations = relations(users, ({ many }) => ({
  loans: many(loans),
}));

export const authorsRelations = relations(authors, ({ many }) => ({
  books: many(books),
}));

export const publishersRelations = relations(publishers, ({ many }) => ({
  books: many(books),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  author: one(authors, {
    fields: [books.authorId],
    references: [authors.id],
  }),
  publisher: one(publishers, {
    fields: [books.publisherId],
    references: [publishers.id],
  }),
  loans: many(loans),
}));

export const loansRelations = relations(loans, ({ one }) => ({
  user: one(users, {
    fields: [loans.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [loans.bookId],
    references: [books.id],
  }),
}));

// Validation schemas for inserts
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertAuthorSchema = createInsertSchema(authors).omit({
  id: true,
  createdAt: true,
});

export const insertPublisherSchema = createInsertSchema(publishers).omit({
  id: true,
  createdAt: true,
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
});

export const insertLoanSchema = createInsertSchema(loans).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertAuthor = z.infer<typeof insertAuthorSchema>;
export type Author = typeof authors.$inferSelect;
export type InsertPublisher = z.infer<typeof insertPublisherSchema>;
export type Publisher = typeof publishers.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loans.$inferSelect;

// Helper types for joined data
export type BookWithDetails = Book & {
  author: Author | null;
  publisher: Publisher | null;
};

export type LoanWithDetails = Loan & {
  book: BookWithDetails;
  user: User;
};

export type UserWithLoans = User & {
  loans: LoanWithDetails[];
};