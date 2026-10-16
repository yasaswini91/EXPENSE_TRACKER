import mongoose from 'mongoose';

const savingsGoalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Savings goal title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [1, 'Target amount must be at least 1'],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Current amount cannot be negative'],
    },
    category: {
      type: String,
      default: 'Emergency',
      trim: true,
    },
    targetDate: {
      type: Date,
      default: null,
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

savingsGoalSchema.virtual('progressPercentage').get(function () {
  if (!this.targetAmount || this.targetAmount <= 0) return 0;
  const pct = (this.currentAmount / this.targetAmount) * 100;
  return Math.min(100, Number(pct.toFixed(1)));
});

const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);

export default SavingsGoal;
