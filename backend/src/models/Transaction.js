import mongoose from 'mongoose';

export const TRANSACTION_TYPES = ['income', 'expense'];

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Other',
];

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance & Consulting',
  'Investments & Dividends',
  'Business',
  'Gifts & Grants',
  'Rental Income',
  'Other Income',
];

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Housing & Rent',
  'Groceries',
  'Utilities & Bills',
  'Transportation',
  'Healthcare & Medical',
  'Entertainment & Leisure',
  'Shopping & Apparel',
  'Education',
  'Personal Care',
  'Debt & Loan',
  'Savings Deposit',
  'Other Expense',
];

export const ALL_CATEGORIES = Array.from(new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]));

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
      validate: {
        validator: (v) => Number.isFinite(v) && v > 0,
        message: 'Amount must be a valid positive number',
      },
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: TRANSACTION_TYPES,
        message: '{VALUE} is not a valid transaction type (must be income or expense)',
      },
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      validate: {
        validator: function (v) {
          if (!v || typeof v !== 'string') return false;
          const trimmed = v.trim();
          return trimmed.length > 0 && trimmed.length <= 100;
        },
        message: 'Category must be a non-empty string under 100 characters',
      },
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: PAYMENT_METHODS,
        message: '{VALUE} is not a valid payment method',
      },
      default: 'Cash',
      trim: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for fast querying, filtering, and aggregation
transactionSchema.index({ date: -1 });
transactionSchema.index({ type: 1, date: -1 });
transactionSchema.index({ category: 1, date: -1 });
transactionSchema.index({ date: 1, type: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
