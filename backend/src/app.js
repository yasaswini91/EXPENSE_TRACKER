import express from 'express';
import cors from 'cors';
import transactionRoutes from './routes/transactionRoutes.js';
import savingsRoutes from './routes/savingsRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import debtRoutes from './routes/debtRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

const clientUrls = (process.env.CLIENT_URL || '')
  .split(',')
  .map((u) => u.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...clientUrls,
];

// CORS configuration supporting localhost, 127.0.0.1, and custom CLIENT_URL
app.use(
  cors({
    origin: (origin, callback) => {
      const normalizedOrigin = origin ? origin.replace(/\/$/, '') : '';
      if (!origin || allowedOrigins.includes(normalizedOrigin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error(`Blocked by CORS policy: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Expense Tracker API is operational',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/debts', debtRoutes);

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
