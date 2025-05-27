import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { login, logout, getCurrentUser, isAuthenticated } from "./simple-auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple authentication routes
  app.post('/api/auth/login', login);
  app.post('/api/auth/logout', logout);
  app.get('/api/auth/user', isAuthenticated, getCurrentUser);

  // Authors endpoints
  app.get("/api/authors", async (req, res) => {
    try {
      const authors = await storage.getAuthors();
      res.json(authors);
    } catch (error) {
      console.error("Error fetching authors:", error);
      res.status(500).json({ message: "Failed to fetch authors" });
    }
  });

  app.post("/api/authors", isAuthenticated, async (req, res) => {
    try {
      const author = await storage.createAuthor(req.body);
      res.json(author);
    } catch (error) {
      console.error("Error creating author:", error);
      res.status(500).json({ message: "Failed to create author" });
    }
  });

  // Publishers endpoints
  app.get("/api/publishers", async (req, res) => {
    try {
      const publishers = await storage.getPublishers();
      res.json(publishers);
    } catch (error) {
      console.error("Error fetching publishers:", error);
      res.status(500).json({ message: "Failed to fetch publishers" });
    }
  });

  app.post("/api/publishers", isAuthenticated, async (req, res) => {
    try {
      const publisher = await storage.createPublisher(req.body);
      res.json(publisher);
    } catch (error) {
      console.error("Error creating publisher:", error);
      res.status(500).json({ message: "Failed to create publisher" });
    }
  });

  // Books endpoints
  app.get("/api/books", async (req, res) => {
    try {
      const { genre, status, search, limit = "50", offset = "0" } = req.query;
      const books = await storage.getBooks({
        genre: genre as string,
        status: status as string,
        search: search as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
      res.json(books);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  app.post("/api/books", isAuthenticated, async (req, res) => {
    try {
      const book = await storage.createBook(req.body);
      res.json(book);
    } catch (error) {
      console.error("Error creating book:", error);
      res.status(500).json({ message: "Failed to create book" });
    }
  });

  // Loans endpoints
  app.get("/api/loans", isAuthenticated, async (req, res) => {
    try {
      const { status, userId, limit = "50", offset = "0" } = req.query;
      const loans = await storage.getLoans({
        status: status as string,
        userId: userId as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
      res.json(loans);
    } catch (error) {
      console.error("Error fetching loans:", error);
      res.status(500).json({ message: "Failed to fetch loans" });
    }
  });

  app.post("/api/loans", isAuthenticated, async (req, res) => {
    try {
      const loan = await storage.createLoan(req.body);
      res.json(loan);
    } catch (error) {
      console.error("Error creating loan:", error);
      res.status(500).json({ message: "Failed to create loan" });
    }
  });

  // Statistics endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Members endpoint (staff only)
  app.get("/api/members", isAuthenticated, async (req, res) => {
    try {
      const { search, limit = "50", offset = "0" } = req.query;
      const members = await storage.getMembers({
        search: search as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
