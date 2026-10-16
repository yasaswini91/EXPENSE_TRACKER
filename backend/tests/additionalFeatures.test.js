import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import SavingsGoal from '../src/models/SavingsGoal.js';
import Loan from '../src/models/Loan.js';
import Debt from '../src/models/Debt.js';
import Transaction from '../src/models/Transaction.js';

const TEST_DB_URI = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/expense_tracker_test';

beforeAll(async () => {
  await connectDB(TEST_DB_URI);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.dropDatabase();
    } catch (e) {
      // ignore
    }
    await disconnectDB();
  }
});

beforeEach(async () => {
  await Promise.all([
    SavingsGoal.deleteMany({}),
    Loan.deleteMany({}),
    Debt.deleteMany({}),
    Transaction.deleteMany({}),
  ]);
});

describe('Savings Goals API', () => {
  it('should create a savings goal and add a deposit', async () => {
    const createRes = await request(app).post('/api/savings').send({
      title: 'Emergency Fund',
      targetAmount: 100000,
      currentAmount: 20000,
      category: 'Emergency',
    });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.title).toBe('Emergency Fund');
    expect(createRes.body.data.currentAmount).toBe(20000);

    const goalId = createRes.body.data._id;

    // Add deposit
    const depositRes = await request(app)
      .patch(`/api/savings/${goalId}/deposit`)
      .send({ depositAmount: 5000 });

    expect(depositRes.status).toBe(200);
    expect(depositRes.body.data.goal.currentAmount).toBe(25000);

    // Verify Expense transaction was created to decrease operating balance
    expect(depositRes.body.data.transaction).toBeDefined();
    expect(depositRes.body.data.transaction.type).toBe('expense');
    expect(depositRes.body.data.transaction.amount).toBe(5000);
    expect(depositRes.body.data.transaction.category).toBe('Savings Deposit');

    // Get summary
    const listRes = await request(app).get('/api/savings');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.summary.totalSavings).toBe(25000);
  });
});

describe('Loans & EMI API', () => {
  it('should create a loan, calculate outstanding debt, and record EMI payment creating an expense transaction', async () => {
    const createRes = await request(app).post('/api/loans').send({
      title: 'MacBook Pro EMI',
      lender: 'HDFC Bank',
      totalAmount: 120000,
      monthlyEmi: 10000,
      dueDay: 5,
      remainingAmount: 60000,
      totalTenureMonths: 12,
      remainingTenureMonths: 6,
    });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.title).toBe('MacBook Pro EMI');
    const loanId = createRes.body.data._id;

    // Record EMI payment
    const payRes = await request(app).post(`/api/loans/${loanId}/pay-emi`);
    expect(payRes.status).toBe(200);
    expect(payRes.body.data.loan.remainingAmount).toBe(50000);
    expect(payRes.body.data.loan.remainingTenureMonths).toBe(5);

    // Verify Expense transaction was created
    expect(payRes.body.data.transaction).toBeDefined();
    expect(payRes.body.data.transaction.type).toBe('expense');
    expect(payRes.body.data.transaction.amount).toBe(10000);
    expect(payRes.body.data.transaction.category).toBe('Debt & Loan');

    // Get loans
    const listRes = await request(app).get('/api/loans');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.summary.totalOutstandingDebt).toBe(50000);
    expect(listRes.body.data.summary.totalMonthlyEmi).toBe(10000);
  });
});

describe('Debts & IOUs API', () => {
  it('should support installment payments and settlements with automatic transaction ledger entries', async () => {
    // 1. You owe someone (Rahul ₹1,000)
    const oweRes = await request(app).post('/api/debts').send({
      personName: 'Rahul',
      type: 'you_owe',
      amount: 1000,
      description: 'Dinner bill split',
    });
    const oweId = oweRes.body.data._id;

    // Pay installment of ₹400 to Rahul -> should create an expense transaction
    const payInstallmentRes = await request(app)
      .post(`/api/debts/${oweId}/payment`)
      .send({
        paymentAmount: 400,
        paymentMethod: 'UPI',
        note: 'Half dinner share',
      });

    expect(payInstallmentRes.status).toBe(200);
    expect(payInstallmentRes.body.data.debt.paidAmount).toBe(400);
    expect(payInstallmentRes.body.data.debt.status).toBe('pending');
    expect(payInstallmentRes.body.data.transaction.type).toBe('expense');
    expect(payInstallmentRes.body.data.transaction.amount).toBe(400);

    // 2. Someone owes you (Amit ₹2,500)
    const lentRes = await request(app).post('/api/debts').send({
      personName: 'Amit',
      type: 'they_owe',
      amount: 2500,
      description: 'Concert ticket advance',
    });
    const lentId = lentRes.body.data._id;

    // Receive installment of ₹1,000 from Amit -> should create an income transaction
    const receiveInstallmentRes = await request(app)
      .post(`/api/debts/${lentId}/payment`)
      .send({
        paymentAmount: 1000,
        paymentMethod: 'Cash',
      });

    expect(receiveInstallmentRes.status).toBe(200);
    expect(receiveInstallmentRes.body.data.debt.paidAmount).toBe(1000);
    expect(receiveInstallmentRes.body.data.debt.status).toBe('pending');
    expect(receiveInstallmentRes.body.data.transaction.type).toBe('income');
    expect(receiveInstallmentRes.body.data.transaction.amount).toBe(1000);

    // Get summary (remaining unpaid: you owe 600, they owe 1500)
    const listRes = await request(app).get('/api/debts');
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.summary.totalYouOwe).toBe(600);
    expect(listRes.body.data.summary.totalTheyOwe).toBe(1500);
    expect(listRes.body.data.summary.netDueBalance).toBe(900);

    // Settle remaining debt with Amit (₹1,500) -> should create an income transaction of 1500
    const settleRes = await request(app).patch(`/api/debts/${lentId}/settle`);
    expect(settleRes.status).toBe(200);
    expect(settleRes.body.data.debt.status).toBe('settled');
    expect(settleRes.body.data.transaction.type).toBe('income');
    expect(settleRes.body.data.transaction.amount).toBe(1500);

    // Check updated summary (settled debt excluded from pending)
    const updatedList = await request(app).get('/api/debts');
    expect(updatedList.body.data.summary.totalTheyOwe).toBe(0);
    expect(updatedList.body.data.summary.settledCount).toBe(1);
  });
});
