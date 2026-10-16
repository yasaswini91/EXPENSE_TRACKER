import Loan from '../models/Loan.js';
import Transaction from '../models/Transaction.js';

export const getLoans = async (req, res, next) => {
  try {
    const loans = await Loan.find().sort({ status: 1, dueDay: 1, createdAt: -1 });

    const activeLoans = loans.filter((l) => l.status === 'active');
    const totalOutstandingDebt = activeLoans.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);
    const totalMonthlyEmi = activeLoans.reduce((sum, l) => sum + (l.monthlyEmi || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        loans,
        summary: {
          totalOutstandingDebt,
          totalMonthlyEmi,
          activeLoansCount: activeLoans.length,
          closedLoansCount: loans.filter((l) => l.status === 'closed').length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createLoan = async (req, res, next) => {
  try {
    const {
      title,
      lender,
      totalAmount,
      monthlyEmi,
      dueDay = 5,
      remainingAmount,
      interestRate = 0,
      totalTenureMonths = 12,
      remainingTenureMonths,
      notes = '',
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Loan title is required' });
    }
    if (!totalAmount || Number(totalAmount) <= 0) {
      return res.status(400).json({ success: false, message: 'Total amount must be greater than zero' });
    }
    if (!monthlyEmi || Number(monthlyEmi) <= 0) {
      return res.status(400).json({ success: false, message: 'Monthly EMI must be greater than zero' });
    }

    const loan = await Loan.create({
      title: title.trim(),
      lender: lender ? lender.trim() : 'Bank / NBFC',
      totalAmount: Number(totalAmount),
      monthlyEmi: Number(monthlyEmi),
      dueDay: Math.min(31, Math.max(1, Number(dueDay) || 5)),
      remainingAmount:
        remainingAmount !== undefined ? Number(remainingAmount) : Number(totalAmount),
      interestRate: Number(interestRate) || 0,
      totalTenureMonths: Number(totalTenureMonths) || 12,
      remainingTenureMonths:
        remainingTenureMonths !== undefined
          ? Number(remainingTenureMonths)
          : Number(totalTenureMonths) || 12,
      notes: notes ? notes.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Loan / EMI record created successfully',
      data: loan,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLoan = async (req, res, next) => {
  try {
    const {
      title,
      lender,
      totalAmount,
      monthlyEmi,
      dueDay,
      remainingAmount,
      interestRate,
      totalTenureMonths,
      remainingTenureMonths,
      status,
      notes,
    } = req.body;

    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      {
        title: title ? title.trim() : undefined,
        lender: lender ? lender.trim() : undefined,
        totalAmount: totalAmount !== undefined ? Number(totalAmount) : undefined,
        monthlyEmi: monthlyEmi !== undefined ? Number(monthlyEmi) : undefined,
        dueDay: dueDay !== undefined ? Number(dueDay) : undefined,
        remainingAmount: remainingAmount !== undefined ? Number(remainingAmount) : undefined,
        interestRate: interestRate !== undefined ? Number(interestRate) : undefined,
        totalTenureMonths: totalTenureMonths !== undefined ? Number(totalTenureMonths) : undefined,
        remainingTenureMonths:
          remainingTenureMonths !== undefined ? Number(remainingTenureMonths) : undefined,
        status: status || undefined,
        notes: notes !== undefined ? notes.trim() : undefined,
      },
      { new: true, runValidators: true }
    );

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Loan updated successfully',
      data: loan,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findByIdAndDelete(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Loan deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

export const recordEmiPayment = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const paymentAmount = loan.monthlyEmi;
    loan.remainingAmount = Math.max(0, loan.remainingAmount - paymentAmount);
    loan.remainingTenureMonths = Math.max(0, loan.remainingTenureMonths - 1);

    if (loan.remainingAmount === 0 || loan.remainingTenureMonths === 0) {
      loan.status = 'closed';
    }

    await loan.save();

    // Automatically create an Expense transaction in the ledger
    const transaction = await Transaction.create({
      amount: paymentAmount,
      type: 'expense',
      category: 'Debt & Loan',
      date: new Date(),
      paymentMethod: 'Bank Transfer',
      note: `EMI payment for ${loan.title} (${loan.lender}) - ${loan.remainingTenureMonths} installments remaining`,
    });

    res.status(200).json({
      success: true,
      message: `EMI payment of ₹${paymentAmount} recorded and added to expenses`,
      data: {
        loan,
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};
