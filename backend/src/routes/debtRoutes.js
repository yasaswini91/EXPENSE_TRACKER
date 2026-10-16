import express from 'express';
import {
  getDebts,
  createDebt,
  updateDebt,
  deleteDebt,
  recordDebtPayment,
  toggleSettleDebt,
} from '../controllers/debtController.js';
import { validateObjectId } from '../middleware/validateTransaction.js';

const router = express.Router();

router.route('/').get(getDebts).post(createDebt);

router.post('/:id/payment', validateObjectId, recordDebtPayment);
router.patch('/:id/settle', validateObjectId, toggleSettleDebt);

router
  .route('/:id')
  .put(validateObjectId, updateDebt)
  .delete(validateObjectId, deleteDebt);

export default router;
