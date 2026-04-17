import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import serverRoutes from './routes/servers';
import vmRoutes from './routes/vms';
import userRoutes from './routes/users';
import subscriptionRoutes from './routes/subscriptions';
import cloudRoutes from './routes/cloud';
import nodeRoutes from './routes/nodes';
import pbsRoutes from './routes/pbs';
import stripeRoutes from './routes/stripe';
import adminRoutes from './routes/admin';
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Stripe webhook needs raw body BEFORE express.json()
app.use(
  '/api/v1/stripe/webhook',
  express.raw({ type: 'application/json' }),
);

app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// Rate limiting
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', apiLimiter);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/servers', serverRoutes);
app.use('/api/v1/servers', vmRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/cloud', cloudRoutes);
app.use('/api/v1/servers', nodeRoutes);
app.use('/api/v1/servers', pbsRoutes);
app.use('/api/v1/stripe', stripeRoutes);
app.use('/api/v1/admin', adminRoutes);

// Global error handler (must be last)
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MyProx API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

export default app;
