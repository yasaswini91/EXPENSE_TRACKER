import Debt from '../models/Debt.js';
import Transaction from '../models/Transaction.js';

export const getDebts = async (req, res, next) => {
  try {
    const debts = await Debt.find().sort({ status: 1, dueDate: 1, createdAt: -1 });

    const pending = debts.filter((d) => d.status === 'pending');
    const totalYouOwe = pending
      .filter((d) => d.type === 'you_owe')
      .reduce((sum, d) => sum + Math.max(0, (d.amount || 0) - (d.paidAmount || 0)), 0);
    const totalTheyOwe = pending
      .filter((d) => d.type === 'they_owe')
      .reduce((sum, d) => sum + Math.max(0, (d.amount || 0) - (d.paidAmount || 0)), 0);
    const netDueBalance = totalTheyOwe - totalYouOwe;

    res.status(200).json({
      success: true,
      data: {
        debts,
        summary: {
          totalYouOwe,
          totalTheyOwe,
          netDueBalance,
          pendingYouOweCount: pending.filter((d) => d.type === 'you_owe').length,
          pendingTheyOweCount: pending.filter((d) => d.type === 'they_owe').length,
          settledCount: debts.filter((d) => d.status === 'settled').length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createDebt = async (req, res, next) => {
  try {
    const { personName, type, amount, description = '', dueDate } = req.body;

    if (!personName || !personName.trim()) {
      return res.status(400).json({ success: false, message: 'Person name is required' });
    }
    if (!type || !['you_owe', 'they_owe'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Due type must be 'you_owe' (payable) or 'they_owe' (receivable)",
      });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
    }

    const debt = await Debt.create({
      personName: personName.trim(),
      type,
      amount: Number(amount),
      paidAmount: 0,
      description: description ? description.trim() : '',
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Due / IOU record created successfully',
      data: debt,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDebt = async (req, res, next) => {
  try {
    const { personName, type, amount, paidAmount, description, dueDate, status } = req.body;

    const updateData = {
      personName: personName ? personName.trim() : undefined,
      type: type || undefined,
      amount: amount !== undefined ? Number(amount) : undefined,
      paidAmount: paidAmount !== undefined ? Number(paidAmount) : undefined,
      description: description !== undefined ? description.trim() : undefined,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      status: status || undefined,
    };

    if (status === 'settled') {
      updateData.settledAt = new Date();
    } else if (status === 'pending') {
      updateData.settledAt = null;
    }

    const debt = await Debt.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!debt) {
      return res.status(404).json({ success: false, message: 'Due record not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Due record updated successfully',
      data: debt,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findByIdAndDelete(req.params.id);
    if (!debt) {
      return res.status(404).json({ success: false, message: 'Due record not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Due record deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record partial or full installment payment for a debt.
 * Automatically inserts an Income or Expense transaction to update net balance!
 */
export const recordDebtPayment = async (req, res, next) => {
  try {
    const { paymentAmount, paymentMethod = 'UPI', note = '' } = req.body;
    const amount = Number(paymentAmount);

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    }

    const debt = await Debt.findById(req.params.id);
    if (!debt) {
      return res.status(404).json({ success: false, message: 'Due record not found' });
    }

    const currentRemaining = Math.max(0, debt.amount - (debt.paidAmount || 0));
    if (amount > currentRemaining) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${amount}) cannot exceed remaining balance of ₹${currentRemaining}`,
      });
    }

    debt.paidAmount = (debt.paidAmount || 0) + amount;
    if (debt.paidAmount >= debt.amount) {
      debt.status = 'settled';
      debt.settledAt = new Date();
    }

    await debt.save();

    // Automatically create corresponding Transaction in the ledger:
    let transaction = null;
    if (debt.type === 'they_owe') {
      // Someone paid you money -> Growth in balance (Income)
      transaction = await Transaction.create({
        amount,
        type: 'income',
        category: 'Other Income',
        date: new Date(),
        paymentMethod: paymentMethod || 'UPI',
        note: note ? note.trim() : `Debt payment received from ${debt.personName}${debt.description ? ` (${debt.description})` : ''}`,
      });
    } else {
      // You paid someone back -> Decrease in balance (Expense)
      transaction = await Transaction.create({
        amount,
        type: 'expense',
        category: 'Debt & Loan',
        date: new Date(),
        paymentMethod: paymentMethod || 'UPI',
        note: note ? note.trim() : `Debt payment made to ${debt.personName}${debt.description ? ` (${debt.description})` : ''}`,
      });
    }

    res.status(200).json({
      success: true,
      message: debt.type === 'they_owe'
        ? `Received ₹${amount} from ${debt.personName}. Recorded as Income and added to your balance.`
        : `Paid ₹${amount} to ${debt.personName}. Recorded as Expense and deducted from your balance.`,
      data: {
        debt,
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle debt between pending and settled directly.
 * Automatically synchronizes unpaid balance into Transactions!
 */
export const toggleSettleDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findById(req.params.id);
    if (!debt) {
      return res.status(404).json({ success: false, message: 'Due record not found' });
    }

    const isNowSettled = debt.status !== 'settled';
    let transaction = null;

    if (isNowSettled) {
      const unpaid = Math.max(0, debt.amount - (debt.paidAmount || 0));
      debt.paidAmount = debt.amount;
      debt.status = 'settled';
      debt.settledAt = new Date();

      // If there was unpaid amount, create matching transaction
      if (unpaid > 0) {
        if (debt.type === 'they_owe') {
          // Received money -> Income
          transaction = await Transaction.create({
            amount: unpaid,
            type: 'income',
            category: 'Other Income',
            date: new Date(),
            paymentMethod: 'UPI',
            note: `Full debt settled by ${debt.personName}${debt.description ? ` (${debt.description})` : ''}`,
          });
        } else {
          // Paid money -> Expense
          transaction = await Transaction.create({
            amount: unpaid,
            type: 'expense',
            category: 'Debt & Loan',
            date: new Date(),
            paymentMethod: 'UPI',
            note: `Full debt settled with ${debt.personName}${debt.description ? ` (${debt.description})` : ''}`,
          });
        }
      }
    } else {
      // Reopening
      debt.status = 'pending';
      debt.settledAt = null;
    }

    await debt.save();

    res.status(200).json({
      success: true,
      message: isNowSettled
        ? `Marked debt with ${debt.personName} as settled. Balance updated accordingly.`
        : `Reopened pending debt with ${debt.personName}`,
      data: {
        debt,
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};
