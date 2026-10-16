import express from 'express';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
  seedTransactions,
} from '../controllers/transactionController.js';
import {
  validateTransactionBody,
  validateObjectId,
  validateMonthQuery,
} from '../middleware/validateTransaction.js';

const router = express.Router();

// Summary endpoint - must be declared BEFORE /:id to prevent matching 'summary' as an ID
router.get('/summary', validateMonthQuery, getTransactionSummary);

// Optional seed endpoint for demo / quick start
router.post('/seed', seedTransactions);

// Collection routes
router
  .route('/')
  .get(validateMonthQuery, getTransactions)
  .post(validateTransactionBody, createTransaction);

// Item routes
router
  .route('/:id')
  .get(validateObjectId, getTransactionById)
  .put(validateObjectId, validateTransactionBody, updateTransaction)
  .delete(validateObjectId, deleteTransaction);

export default router;
