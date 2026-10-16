import SavingsGoal from '../models/SavingsGoal.js';
import Transaction from '../models/Transaction.js';

export const getSavingsGoals = async (req, res, next) => {
  try {
    const goals = await SavingsGoal.find().sort({ createdAt: -1 });

    const totalSavings = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
    const totalTarget = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
    const overallProgress =
      totalTarget > 0 ? Number(((totalSavings / totalTarget) * 100).toFixed(1)) : 0;

    res.status(200).json({
      success: true,
      data: {
        goals,
        summary: {
          totalSavings,
          totalTarget,
          overallProgress,
          goalCount: goals.length,
          completedCount: goals.filter((g) => g.currentAmount >= g.targetAmount).length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createSavingsGoal = async (req, res, next) => {
  try {
    const { title, targetAmount, currentAmount = 0, category, targetDate, note } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Goal title is required' });
    }
    if (!targetAmount || Number(targetAmount) <= 0) {
      return res.status(400).json({ success: false, message: 'Target amount must be greater than zero' });
    }

    const goal = await SavingsGoal.create({
      title: title.trim(),
      targetAmount: Number(targetAmount),
      currentAmount: Math.max(0, Number(currentAmount) || 0),
      category: category ? category.trim() : 'Emergency',
      targetDate: targetDate ? new Date(targetDate) : null,
      note: note ? note.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSavingsGoal = async (req, res, next) => {
  try {
    const { title, targetAmount, currentAmount, category, targetDate, note } = req.body;

    const goal = await SavingsGoal.findByIdAndUpdate(
      req.params.id,
      {
        title: title ? title.trim() : undefined,
        targetAmount: targetAmount !== undefined ? Number(targetAmount) : undefined,
        currentAmount: currentAmount !== undefined ? Number(currentAmount) : undefined,
        category: category ? category.trim() : undefined,
        targetDate: targetDate !== undefined ? (targetDate ? new Date(targetDate) : null) : undefined,
        note: note !== undefined ? note.trim() : undefined,
      },
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Savings goal updated successfully',
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSavingsGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findByIdAndDelete(req.params.id);
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Savings goal deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

export const addDepositToGoal = async (req, res, next) => {
  try {
    const { depositAmount, paymentMethod = 'Bank Transfer', note = '' } = req.body;
    const amount = Number(depositAmount);

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Deposit amount must be greater than zero' });
    }

    const goal = await SavingsGoal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Savings goal not found' });
    }

    goal.currentAmount = (goal.currentAmount || 0) + amount;
    await goal.save();

    // Automatically create an Expense transaction so the cash balance decreases
    const transaction = await Transaction.create({
      amount,
      type: 'expense',
      category: 'Savings Deposit',
      date: new Date(),
      paymentMethod: paymentMethod || 'Bank Transfer',
      note: note ? note.trim() : `Savings deposit towards ${goal.title}${goal.category ? ` (${goal.category})` : ''}`,
    });

    res.status(200).json({
      success: true,
      message: `Deposited ₹${amount} into ${goal.title}. Deducted from operating balance.`,
      data: {
        goal,
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};
