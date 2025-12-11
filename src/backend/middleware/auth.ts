import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include our user type
declare global {
  namespace Express {
    interface User {
      id: number;
      google_id: string;
      email: string;
      display_name: string;
      profile_picture: string | null;
    }
  }
}

// Middleware to ensure user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

// Middleware to attach user info if authenticated (but don't require it)
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  // User will be available in req.user if authenticated
  next();
}
