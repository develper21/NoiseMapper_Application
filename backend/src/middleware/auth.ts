import { Request, Response, NextFunction } from 'express';
import { validateSession } from '../utils/auth';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
      });
      return;
    }

    const session = await validateSession(token);
    if (!session) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    req.user = session;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token validation failed',
    });
  }
}

export function optionalAuthentication(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    validateSession(token)
      .then((session) => {
        if (session) {
          req.user = session;
        }
        next();
      })
      .catch(() => {
        next();
      });
  } else {
    next();
  }
}
