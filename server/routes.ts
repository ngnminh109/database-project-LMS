import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBookSchema, insertAuthorSchema, insertPublisherSchema, insertLoanSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Book routes
  app.get('/api/books', async (req, res) => {
    try {
      const { genre, status, authorId, publisherId, search, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      const result = await storage.getBooks({
        genre: genre as string,
        status: status as string,
        authorId: authorId ? Number(authorId) : undefined,
        publisherId: publisherId ? Number(publisherId) : undefined,
        search: search as string,
        limit: Number(limit),
        offset,
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  app.get('/api/books/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }
      
      const books = await storage.searchBooks(q);
      res.json(books);
    } catch (error) {
      console.error("Error searching books:", error);
      res.status(500).json({ message: "Failed to search books" });
    }
  });

  app.get('/api/books/:id', async (req, res) => {
    try {
      const book = await storage.getBook(Number(req.params.id));
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      console.error("Error fetching book:", error);
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });

  app.post('/api/books', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is staff
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Access denied. Staff only." });
      }

      const bookData = insertBookSchema.parse(req.body);
      const book = await storage.createBook(bookData);
      res.status(201).json(book);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid book data", errors: error.errors });
      }
      console.error("Error creating book:", error);
      res.status(500).json({ message: "Failed to create book" });
    }
  });

  app.put('/api/books/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is staff
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Access denied. Staff only." });
      }

      const bookData = insertBookSchema.partial().parse(req.body);
      const book = await storage.updateBook(Number(req.params.id), bookData);
      res.json(book);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid book data", errors: error.errors });
      }
      console.error("Error updating book:", error);
      res.status(500).json({ message: "Failed to update book" });
    }
  });

  app.delete('/api/books/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is staff
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Access denied. Staff only." });
      }

      await storage.deleteBook(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).json({ message: "Failed to delete book" });
    }
  });

  // Author routes
  app.get('/api/authors', async (req, res) => {
    try {
      const authors = await storage.getAuthors();
      res.json(authors);
    } catch (error) {
      console.error("Error fetching authors:", error);
      res.status(500).json({ message: "Failed to fetch authors" });
    }
  });

  app.get('/api/authors/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }
      
      const authors = await storage.searchAuthors(q);
      res.json(authors);
    } catch (error) {
      console.error("Error searching authors:", error);
      res.status(500).json({ message: "Failed to search authors" });
    }
  });

  app.post('/api/authors', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is staff
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Access denied. Staff only." });
      }

      const authorData = insertAuthorSchema.parse(req.body);
      const author = await storage.createAuthor(authorData);
      res.status(201).json(author);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid author data", errors: error.errors });
      }
      console.error("Error creating author:", error);
      res.status(500).json({ message: "Failed to create author" });
    }
  });

  // Publisher routes
  app.get('/api/publishers', async (req, res) => {
    try {
      const publishers = await storage.getPublishers();
      res.json(publishers);
    } catch (error) {
      console.error("Error fetching publishers:", error);
      res.status(500).json({ message: "Failed to fetch publishers" });
    }
  });

  app.post('/api/publishers', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is staff
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Access denied. Staff only." });
      }

      const publisherData = insertPublisherSchema.parse(req.body);
      const publisher = await storage.createPublisher(publisherData);
      res.status(201).json(publisher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid publisher data", errors: error.errors });
      }
      console.error("Error creating publisher:", error);
      res.status(500).json({ message: "Failed to create publisher" });
    }
  });

  // Loan routes
  app.get('/api/loans', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { status, dueDate, overdue, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let filters: any = {
        limit: Number(limit),
        offset,
      };

      if (status) filters.status = status as string;
      if (dueDate) filters.dueDate = dueDate as string;
      if (overdue === 'true') filters.overdue = true;

      // If user is patron, only show their loans
      if (user.role === 'patron') {
        filters.userId = user.id;
      }

      const result = await storage.getLoans(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching loans:", error);
      res.status(500).json({ message: "Failed to fetch loans" });
    }
  });

  app.get('/api/loans/user/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const requestingUser = await storage.getUser(req.user.claims.sub);
      const targetUserId = req.params.userId;

      // Users can only view their own loans, staff can view any user's loans
      if (requestingUser?.role !== 'staff' && requestingUser?.id !== targetUserId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const loans = await storage.getUserLoans(targetUserId);
      res.json(loans);
    } catch (error) {
      console.error("Error fetching user loans:", error);
      res.status(500).json({ message: "Failed to fetch user loans" });
    }
  });

  app.post('/api/loans', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const loanData = insertLoanSchema.parse({
        ...req.body,
        userId: user.role === 'patron' ? user.id : req.body.userId,
      });

      // Check if book is available
      const book = await storage.getBook(loanData.bookId);
      if (!book || book.availableCopies <= 0) {
        return res.status(400).json({ message: "Book is not available" });
      }

      const loan = await storage.createLoan(loanData);
      res.status(201).json(loan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid loan data", errors: error.errors });
      }
      console.error("Error creating loan:", error);
      res.status(500).json({ message: "Failed to create loan" });
    }
  });

  app.post('/api/loans/:id/return', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const loan = await storage.getLoan(Number(req.params.id));
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }

      // Users can only return their own loans, staff can return any loan
      if (user.role !== 'staff' && loan.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedLoan = await storage.returnBook(Number(req.params.id));
      res.json(updatedLoan);
    } catch (error) {
      console.error("Error returning book:", error);
      res.status(500).json({ message: "Failed to return book" });
    }
  });

  app.post('/api/loans/:id/renew', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const loan = await storage.getLoan(Number(req.params.id));
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }

      // Users can only renew their own loans, staff can renew any loan
      if (user.role !== 'staff' && loan.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (loan.renewalCount >= 2) {
        return res.status(400).json({ message: "Maximum renewals reached" });
      }

      const updatedLoan = await storage.renewLoan(Number(req.params.id));
      res.json(updatedLoan);
    } catch (error) {
      console.error("Error renewing loan:", error);
      res.status(500).json({ message: "Failed to renew loan" });
    }
  });

  // Member management routes (staff only)
  app.get('/api/members', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is staff
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Access denied. Staff only." });
      }

      const { membershipType, isActive, search, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const result = await storage.getMembers({
        membershipType: membershipType as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search: search as string,
        limit: Number(limit),
        offset,
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.get('/api/members/:id', isAuthenticated, async (req: any, res) => {
    try {
      const requestingUser = await storage.getUser(req.user.claims.sub);
      if (!requestingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Users can view their own profile, staff can view any member
      if (requestingUser.role !== 'staff' && requestingUser.id !== req.params.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const member = await storage.getMember(req.params.id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      res.json(member);
    } catch (error) {
      console.error("Error fetching member:", error);
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  app.put('/api/members/:id', isAuthenticated, async (req: any, res) => {
    try {
      const requestingUser = await storage.getUser(req.user.claims.sub);
      if (!requestingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Users can update their own profile, staff can update any member
      if (requestingUser.role !== 'staff' && requestingUser.id !== req.params.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Patrons cannot change their role
      const updateData = { ...req.body };
      if (requestingUser.role !== 'staff') {
        delete updateData.role;
        delete updateData.isActive;
      }

      const member = await storage.updateMember(req.params.id, updateData);
      res.json(member);
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({ message: "Failed to update member" });
    }
  });

  app.post('/api/members/:id/deactivate', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is staff
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Access denied. Staff only." });
      }

      const member = await storage.deactivateMember(req.params.id);
      res.json(member);
    } catch (error) {
      console.error("Error deactivating member:", error);
      res.status(500).json({ message: "Failed to deactivate member" });
    }
  });

  // Statistics and reports (staff only)
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is staff
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Access denied. Staff only." });
      }

      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/reports/popular-books', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is staff
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Access denied. Staff only." });
      }

      const { limit = 10 } = req.query;
      const popularBooks = await storage.getPopularBooks(Number(limit));
      res.json(popularBooks);
    } catch (error) {
      console.error("Error fetching popular books:", error);
      res.status(500).json({ message: "Failed to fetch popular books" });
    }
  });

  app.get('/api/reports/overdue-loans', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is staff
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Access denied. Staff only." });
      }

      const overdueLoans = await storage.getOverdueLoans();
      res.json(overdueLoans);
    } catch (error) {
      console.error("Error fetching overdue loans:", error);
      res.status(500).json({ message: "Failed to fetch overdue loans" });
    }
  });

  app.get('/api/reports/member-activity', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is staff
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Access denied. Staff only." });
      }

      const { dateFrom, dateTo } = req.query;
      const activity = await storage.getMemberActivity(
        dateFrom as string,
        dateTo as string
      );
      res.json(activity);
    } catch (error) {
      console.error("Error fetching member activity:", error);
      res.status(500).json({ message: "Failed to fetch member activity" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
