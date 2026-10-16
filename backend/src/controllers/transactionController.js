import Transaction from '../models/Transaction.js';
import { getMonthDateRange, getCurrentMonthString } from '../utils/dateUtils.js';

/**
 * @desc   Get transactions with month, type, category, and search filters
 * @route  GET /api/transactions
 */
export const getTransactions = async (req, res, next) => {
  try {
    const { month, type, category, search, page = 1, limit = 100 } = req.query;

    const query = {};

    // Filter by month
    if (month) {
      const { startDate, endDate } = getMonthDateRange(month);
      query.date = { $gte: startDate, $lt: endDate };
    }

    // Filter by type (income or expense)
    if (type && ['income', 'expense'].includes(type.toLowerCase())) {
      query.type = type.toLowerCase();
    }

    // Filter by category
    if (category && category.trim()) {
      query.category = category.trim();
    }

    // Search in note or category
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ note: searchRegex }, { category: searchRegex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get single transaction by ID
 * @route  GET /api/transactions/:id
 */
export const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Create new transaction
 * @route  POST /api/transactions
 */
export const createTransaction = async (req, res, next) => {
  try {
    const { amount, type, category, date, paymentMethod, note } = req.body;

    const transaction = await Transaction.create({
      amount: Number(amount),
      type: String(type).toLowerCase().trim(),
      category: category.trim(),
      date: new Date(date),
      paymentMethod: paymentMethod || 'Cash',
      note: note ? note.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Update transaction
 * @route  PUT /api/transactions/:id
 */
export const updateTransaction = async (req, res, next) => {
  try {
    const { amount, type, category, date, paymentMethod, note } = req.body;

    const updateData = {
      amount: Number(amount),
      type: String(type).toLowerCase().trim(),
      category: category.trim(),
      date: new Date(date),
      paymentMethod: paymentMethod || 'Cash',
      note: note !== undefined ? (note ? note.trim() : '') : undefined,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Delete transaction
 * @route  DELETE /api/transactions/:id
 */
export const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get monthly summary, totals, category aggregates, and trend
 * @route  GET /api/transactions/summary?month=YYYY-MM
 */
export const getTransactionSummary = async (req, res, next) => {
  try {
    const monthQuery = req.query.month || getCurrentMonthString();
    const { startDate, endDate, monthString } = getMonthDateRange(monthQuery);

    const dateMatch = {
      $match: {
        date: { $gte: startDate, $lt: endDate },
      },
    };

    // Run parallel aggregation pipelines
    const [totalsAggregation, expenseCatAggregation, incomeCatAggregation, dailyAggregation] =
      await Promise.all([
        // 1. Total income and expenses
        Transaction.aggregate([
          dateMatch,
          {
            $group: {
              _id: '$type',
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
        ]),

        // 2. Expense category breakdown
        Transaction.aggregate([
          {
            $match: {
              date: { $gte: startDate, $lt: endDate },
              type: 'expense',
            },
          },
          {
            $group: {
              _id: '$category',
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { total: -1 } },
        ]),

        // 3. Income category breakdown
        Transaction.aggregate([
          {
            $match: {
              date: { $gte: startDate, $lt: endDate },
              type: 'income',
            },
          },
          {
            $group: {
              _id: '$category',
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { total: -1 } },
        ]),

        // 4. Daily aggregation for trend chart
        Transaction.aggregate([
          dateMatch,
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$date' },
              },
              income: {
                $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
              },
              expense: {
                $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    // Parse totals
    let totalIncome = 0;
    let totalExpenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    totalsAggregation.forEach((item) => {
      if (item._id === 'income') {
        totalIncome = Number(item.totalAmount.toFixed(2));
        incomeCount = item.count;
      } else if (item._id === 'expense') {
        totalExpenses = Number(item.totalAmount.toFixed(2));
        expenseCount = item.count;
      }
    });

    const netBalance = Number((totalIncome - totalExpenses).toFixed(2));
    const totalTransactions = incomeCount + expenseCount;

    // Calculate percentages for expense categories
    const categoryBreakdown = expenseCatAggregation.map((cat) => {
      const amount = Number(cat.total.toFixed(2));
      const percentage =
        totalExpenses > 0 ? Number(((amount / totalExpenses) * 100).toFixed(1)) : 0;
      return {
        category: cat._id,
        total: amount,
        count: cat.count,
        percentage,
      };
    });

    // Calculate percentages for income categories
    const incomeCategoryBreakdown = incomeCatAggregation.map((cat) => {
      const amount = Number(cat.total.toFixed(2));
      const percentage =
        totalIncome > 0 ? Number(((amount / totalIncome) * 100).toFixed(1)) : 0;
      return {
        category: cat._id,
        total: amount,
        count: cat.count,
        percentage,
      };
    });

    // Format daily trend
    const dailyTrend = dailyAggregation.map((d) => ({
      date: d._id,
      income: Number(d.income.toFixed(2)),
      expense: Number(d.expense.toFixed(2)),
      count: d.count,
    }));

    res.status(200).json({
      success: true,
      data: {
        month: monthString,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        totalIncome,
        totalExpenses,
        netBalance,
        transactionCount: totalTransactions,
        incomeCount,
        expenseCount,
        categoryBreakdown,
        incomeCategoryBreakdown,
        dailyTrend,
        balanceNote:
          'Net balance = income minus expenses. This represents your period net cash flow for the selected month, not your total bank account balance.',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Seed realistic demo data (for testing/demonstration)
 * @route  POST /api/transactions/seed
 */
export const seedTransactions = async (req, res, next) => {
  try {
    const { getSeedData } = await import('../scripts/seedData.js');
    const seedItems = getSeedData();

    // Optionally clear existing demo data if requested with ?clear=true
    if (req.query.clear === 'true') {
      await Transaction.deleteMany({});
    }

    const created = await Transaction.insertMany(seedItems);

    res.status(201).json({
      success: true,
      message: `Successfully seeded ${created.length} sample transactions`,
      count: created.length,
    });
  } catch (error) {
    next(error);
  }
};
