import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${new Date().toISOString()}] ${status} - ${message}`, err.stack);
  }

  res.status(status).json({ error: message });
}
