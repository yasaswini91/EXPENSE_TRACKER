import express from 'express';
import {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  addDepositToGoal,
} from '../controllers/savingsController.js';
import { validateObjectId } from '../middleware/validateTransaction.js';

const router = express.Router();

router.route('/').get(getSavingsGoals).post(createSavingsGoal);

router.patch('/:id/deposit', validateObjectId, addDepositToGoal);

router
  .route('/:id')
  .put(validateObjectId, updateSavingsGoal)
  .delete(validateObjectId, deleteSavingsGoal);

export default router;
