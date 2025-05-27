import { Request, Response, NextFunction } from 'express';
import { db } from './mysql-db';
import { users } from '../shared/mysql-schema';
import { eq } from 'drizzle-orm';

// Simple session store (in production, use database-backed sessions)
const sessions = new Map<string, { userId: string; role: string; expires: number }>();

// Generate simple session ID
function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Middleware to check authentication
export const isAuthenticated = (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  const sessionId = req.headers['session-id'] as string;
  
  if (!sessionId) {
    return res.status(401).json({ message: 'No session provided' });
  }

  const session = sessions.get(sessionId);
  if (!session || session.expires < Date.now()) {
    sessions.delete(sessionId);
    return res.status(401).json({ message: 'Session expired' });
  }

  req.user = { id: session.userId, role: session.role };
  next();
};

// Login endpoint using MySQL SHA2 authentication
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Call the MySQL stored procedure for authentication
    const result = await db.execute(
      `CALL AuthenticateUser(?, ?, @user_id, @role, @is_valid);
       SELECT @user_id as user_id, @role as role, @is_valid as is_valid;`,
      [email, password]
    );

    const authResult = result[1][0] as any;

    if (!authResult.is_valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create session
    const sessionId = generateSessionId();
    const expires = Date.now() + (7 * 24 * 60 * 60 * 1000); // 1 week

    sessions.set(sessionId, {
      userId: authResult.user_id,
      role: authResult.role,
      expires
    });

    // Get full user details
    const [user] = await db.select().from(users).where(eq(users.id, authResult.user_id));

    res.json({
      success: true,
      sessionId,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

// Logout endpoint
export const logout = (req: Request, res: Response) => {
  const sessionId = req.headers['session-id'] as string;
  
  if (sessionId) {
    sessions.delete(sessionId);
  }

  res.json({ success: true, message: 'Logged out successfully' });
};

// Get current user endpoint
export const getCurrentUser = async (req: Request & { user?: any }, res: Response) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      membershipType: user.membershipType,
      isActive: user.isActive
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};
