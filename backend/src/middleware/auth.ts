import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface UserTokenPayload {
  id: number;
  username: string;
  role: 'ADMIN' | 'OPERATOR' | 'AUDITOR' | string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserTokenPayload;
}

/**
 * Validates and retrieves the JWT Secret from environment variables.
 * Enforces minimum length of 32 characters and prohibits default fallbacks.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error(
      'FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is missing. ' +
      'A strong secret key of at least 32 characters is required.'
    );
  }
  if (secret.length < 32) {
    throw new Error(
      `FATAL CONFIGURATION ERROR: JWT_SECRET must be at least 32 characters long. ` +
      `Current length: ${secret.length} characters.`
    );
  }
  return secret;
}

/**
 * Middleware: Enforces that requests contain a valid Bearer token.
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return res.status(401).json({
      error: 'Authentication token required. Please include Authorization: Bearer <token>',
    });
  }

  try {
    const secret = getJwtSecret();
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          error: 'Invalid or expired authentication token: ' + err.message,
        });
      }
      req.user = decoded as UserTokenPayload;
      next();
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Middleware: Role-based access control.
 * Restricts access to users having one of the allowed roles.
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access forbidden: user role '${req.user.role}' lacks sufficient privileges. Required: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}
