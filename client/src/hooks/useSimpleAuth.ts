import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  membershipType?: string;
  isActive?: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useSimpleAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  });

  // Get session ID from localStorage
  const getSessionId = () => localStorage.getItem('library_session_id');
  
  // Set session ID in localStorage
  const setSessionId = (sessionId: string) => {
    localStorage.setItem('library_session_id', sessionId);
  };

  // Remove session ID from localStorage
  const clearSession = () => {
    localStorage.removeItem('library_session_id');
  };

  // Check current authentication status
  const checkAuth = async () => {
    const sessionId = getSessionId();
    
    if (!sessionId) {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      });
      return;
    }

    try {
      const response = await fetch('/api/auth/user', {
        headers: {
          'session-id': sessionId
        }
      });

      if (response.ok) {
        const user = await response.json();
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true
        });
      } else {
        clearSession();
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearSession();
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      });
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSessionId(data.sessionId);
        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true
        });
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error' };
    }
  };

  // Logout function
  const logout = async () => {
    const sessionId = getSessionId();
    
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'session-id': sessionId || ''
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    clearSession();
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false
    });
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  return {
    ...authState,
    login,
    logout,
    checkAuth
  };
}
