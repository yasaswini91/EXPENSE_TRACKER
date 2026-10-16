import mongoose from 'mongoose';

const debtSchema = new mongoose.Schema(
  {
    personName: {
      type: String,
      required: [true, 'Person name is required'],
      trim: true,
      maxlength: [100, 'Person name cannot exceed 100 characters'],
    },
    type: {
      type: String,
      required: [true, 'Due type is required'],
      enum: {
        values: ['you_owe', 'they_owe'],
        message: '{VALUE} is not a valid due type (must be you_owe or they_owe)',
      },
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be positive'],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'settled'],
      default: 'pending',
    },
    settledAt: {
      type: Date,
      default: null,
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

debtSchema.virtual('remainingAmount').get(function () {
  return Math.max(0, (this.amount || 0) - (this.paidAmount || 0));
});

debtSchema.index({ status: 1, type: 1 });

const Debt = mongoose.model('Debt', debtSchema);

export default Debt;
