import { apiRequest } from "./queryClient";
import type { BookWithDetails, LoanWithDetails, Author, Publisher, User } from "@shared/schema";

export const api = {
  // Books
  getBooks: async (params?: {
    search?: string;
    genre?: string;
    status?: string;
    authorId?: number;
    publisherId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ books: BookWithDetails[]; total: number }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const response = await fetch(`/api/books?${searchParams}`);
    return response.json();
  },

  searchBooks: async (query: string): Promise<BookWithDetails[]> => {
    const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
    return response.json();
  },

  getBook: async (id: number): Promise<BookWithDetails> => {
    const response = await fetch(`/api/books/${id}`);
    return response.json();
  },

  createBook: async (data: any) => {
    return apiRequest("POST", "/api/books", data);
  },

  updateBook: async (id: number, data: any) => {
    return apiRequest("PUT", `/api/books/${id}`, data);
  },

  deleteBook: async (id: number) => {
    return apiRequest("DELETE", `/api/books/${id}`, {});
  },

  // Authors
  getAuthors: async (): Promise<Author[]> => {
    const response = await fetch("/api/authors");
    return response.json();
  },

  searchAuthors: async (query: string): Promise<Author[]> => {
    const response = await fetch(`/api/authors/search?q=${encodeURIComponent(query)}`);
    return response.json();
  },

  createAuthor: async (data: any) => {
    return apiRequest("POST", "/api/authors", data);
  },

  // Publishers
  getPublishers: async (): Promise<Publisher[]> => {
    const response = await fetch("/api/publishers");
    return response.json();
  },

  createPublisher: async (data: any) => {
    return apiRequest("POST", "/api/publishers", data);
  },

  // Loans
  getLoans: async (params?: {
    status?: string;
    userId?: string;
    dueDate?: string;
    overdue?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ loans: LoanWithDetails[]; total: number }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const response = await fetch(`/api/loans?${searchParams}`);
    return response.json();
  },

  getUserLoans: async (userId: string): Promise<LoanWithDetails[]> => {
    const response = await fetch(`/api/loans/user/${userId}`);
    return response.json();
  },

  createLoan: async (data: any) => {
    return apiRequest("POST", "/api/loans", data);
  },

  returnBook: async (loanId: number) => {
    return apiRequest("POST", `/api/loans/${loanId}/return`, {});
  },

  renewLoan: async (loanId: number) => {
    return apiRequest("POST", `/api/loans/${loanId}/renew`, {});
  },

  // Members
  getMembers: async (params?: {
    membershipType?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const response = await fetch(`/api/members?${searchParams}`);
    return response.json();
  },

  getMember: async (id: string) => {
    const response = await fetch(`/api/members/${id}`);
    return response.json();
  },

  updateMember: async (id: string, data: any) => {
    return apiRequest("PUT", `/api/members/${id}`, data);
  },

  deactivateMember: async (id: string) => {
    return apiRequest("POST", `/api/members/${id}/deactivate`, {});
  },

  // Statistics and Reports
  getStats: async () => {
    const response = await fetch("/api/stats");
    return response.json();
  },

  getPopularBooks: async (limit = 10) => {
    const response = await fetch(`/api/reports/popular-books?limit=${limit}`);
    return response.json();
  },

  getOverdueLoans: async () => {
    const response = await fetch("/api/reports/overdue-loans");
    return response.json();
  },

  getMemberActivity: async (dateFrom?: string, dateTo?: string) => {
    const searchParams = new URLSearchParams();
    if (dateFrom) searchParams.append("dateFrom", dateFrom);
    if (dateTo) searchParams.append("dateTo", dateTo);
    const response = await fetch(`/api/reports/member-activity?${searchParams}`);
    return response.json();
  },
};
