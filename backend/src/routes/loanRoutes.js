import express from 'express';
import {
  getLoans,
  createLoan,
  updateLoan,
  deleteLoan,
  recordEmiPayment,
} from '../controllers/loanController.js';
import { validateObjectId } from '../middleware/validateTransaction.js';

const router = express.Router();

router.route('/').get(getLoans).post(createLoan);

router.post('/:id/pay-emi', validateObjectId, recordEmiPayment);

router
  .route('/:id')
  .put(validateObjectId, updateLoan)
  .delete(validateObjectId, deleteLoan);

export default router;
