import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Loan / EMI title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    lender: {
      type: String,
      required: [true, 'Lender or institution name is required'],
      trim: true,
      default: 'Bank / NBFC',
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total loan amount is required'],
      min: [1, 'Total loan amount must be positive'],
    },
    monthlyEmi: {
      type: Number,
      required: [true, 'Monthly EMI amount is required'],
      min: [1, 'Monthly EMI must be positive'],
    },
    dueDay: {
      type: Number,
      required: [true, 'Due day of the month is required'],
      min: [1, 'Day must be between 1 and 31'],
      max: [31, 'Day must be between 1 and 31'],
      default: 5,
    },
    remainingAmount: {
      type: Number,
      required: [true, 'Remaining amount is required'],
      min: [0, 'Remaining amount cannot be negative'],
    },
    interestRate: {
      type: Number,
      default: 0,
      min: [0, 'Interest rate cannot be negative'],
    },
    totalTenureMonths: {
      type: Number,
      default: 12,
      min: [1, 'Tenure must be at least 1 month'],
    },
    remainingTenureMonths: {
      type: Number,
      default: 12,
      min: [0, 'Remaining tenure cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
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

const Loan = mongoose.model('Loan', loanSchema);

export default Loan;
