// Simple API client with session-based authentication
const getSessionId = () => localStorage.getItem('library_session_id');

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const sessionId = getSessionId();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(sessionId && { 'session-id': sessionId }),
      ...options.headers,
    },
  };

  const response = await fetch(endpoint, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth endpoints
  login: (email: string, password: string) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    apiRequest('/api/auth/logout', { method: 'POST' }),

  getCurrentUser: () => apiRequest('/api/auth/user'),

  // Books endpoints
  getBooks: (params?: { genre?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return apiRequest(`/api/books${query ? `?${query}` : ''}`);
  },

  createBook: (book: any) =>
    apiRequest('/api/books', {
      method: 'POST',
      body: JSON.stringify(book),
    }),

  // Authors endpoints
  getAuthors: () => apiRequest('/api/authors'),

  createAuthor: (author: any) =>
    apiRequest('/api/authors', {
      method: 'POST',
      body: JSON.stringify(author),
    }),

  // Publishers endpoints
  getPublishers: () => apiRequest('/api/publishers'),

  createPublisher: (publisher: any) =>
    apiRequest('/api/publishers', {
      method: 'POST',
      body: JSON.stringify(publisher),
    }),

  // Loans endpoints
  getLoans: (params?: { status?: string; userId?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return apiRequest(`/api/loans${query ? `?${query}` : ''}`);
  },

  createLoan: (loan: any) =>
    apiRequest('/api/loans', {
      method: 'POST',
      body: JSON.stringify(loan),
    }),

  // Stats endpoint
  getStats: () => apiRequest('/api/stats'),

  // Members endpoint
  getMembers: (params?: { search?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return apiRequest(`/api/members${query ? `?${query}` : ''}`);
  },
};
