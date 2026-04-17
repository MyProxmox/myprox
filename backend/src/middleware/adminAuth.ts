import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { db } from '../config/database';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      adminId?: string;
    }
  }
}

export async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const decoded = verifyAccessToken(token);
    const { rows } = await db.query(
      'SELECT id, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (rows.length === 0) return res.status(401).json({ error: 'User not found' });
    if (rows[0].role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    req.userId = decoded.userId;
    req.adminId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
