import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
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
  await Transaction.deleteMany({});
});

describe('Summary & Aggregation API', () => {
  it('GET /api/transactions/summary should accurately aggregate income, expenses, and net balance', async () => {
    // Seed test transactions in 2026-10
    await Transaction.create([
      // Income in October 2026
      {
        amount: 60000,
        type: 'income',
        category: 'Salary',
        date: new Date('2026-10-01T09:00:00.000Z'),
        paymentMethod: 'Bank Transfer',
      },
      {
        amount: 15000,
        type: 'income',
        category: 'Freelance & Consulting',
        date: new Date('2026-10-15T14:00:00.000Z'),
        paymentMethod: 'Bank Transfer',
      },
      // Expenses in October 2026
      {
        amount: 18000,
        type: 'expense',
        category: 'Housing & Rent',
        date: new Date('2026-10-02T10:00:00.000Z'),
        paymentMethod: 'Bank Transfer',
      },
      {
        amount: 4500,
        type: 'expense',
        category: 'Groceries',
        date: new Date('2026-10-05T18:00:00.000Z'),
        paymentMethod: 'UPI',
      },
      {
        amount: 2500,
        type: 'expense',
        category: 'Food & Dining',
        date: new Date('2026-10-31T20:00:00.000Z'), // Last day of month boundary
        paymentMethod: 'UPI',
      },
      // Transaction in September (should NOT be included in October summary)
      {
        amount: 10000,
        type: 'income',
        category: 'Salary',
        date: new Date('2026-09-30T23:59:00.000Z'),
        paymentMethod: 'Bank Transfer',
      },
      // Transaction in November (should NOT be included in October summary)
      {
        amount: 5000,
        type: 'expense',
        category: 'Shopping & Apparel',
        date: new Date('2026-11-01T00:00:01.000Z'),
        paymentMethod: 'Credit Card',
      },
    ]);

    const res = await request(app).get('/api/transactions/summary?month=2026-10');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;
    expect(data.month).toBe('2026-10');
    // Total income: 60000 + 15000 = 75000
    expect(data.totalIncome).toBe(75000);
    // Total expenses: 18000 + 4500 + 2500 = 25000
    expect(data.totalExpenses).toBe(25000);
    // Net balance: 75000 - 25000 = 50000
    expect(data.netBalance).toBe(50000);
    expect(data.transactionCount).toBe(5);
    expect(data.incomeCount).toBe(2);
    expect(data.expenseCount).toBe(3);

    // Verify category breakdown exists and sums correctly
    expect(data.categoryBreakdown.length).toBe(3);
    const housing = data.categoryBreakdown.find((c) => c.category === 'Housing & Rent');
    expect(housing).toBeDefined();
    expect(housing.total).toBe(18000);
    expect(housing.percentage).toBeCloseTo(72.0, 1);

    // Verify balance note is returned explaining period net balance
    expect(data.balanceNote).toContain('Net balance = income minus expenses');
  });

  it('GET /api/transactions/summary should reject invalid month format', async () => {
    const res = await request(app).get('/api/transactions/summary?month=2026-13');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);

    const resAlpha = await request(app).get('/api/transactions/summary?month=october-2026');
    expect(resAlpha.status).toBe(400);
  });

  it('GET /api/transactions with month query filters boundary dates properly', async () => {
    await Transaction.create([
      {
        amount: 500,
        type: 'expense',
        category: 'Food & Dining',
        date: new Date('2026-10-31T23:59:59.000Z'), // Very last second of Oct 31
        paymentMethod: 'UPI',
      },
      {
        amount: 900,
        type: 'expense',
        category: 'Food & Dining',
        date: new Date('2026-11-01T00:00:00.000Z'), // First second of Nov 1
        paymentMethod: 'UPI',
      },
    ]);

    const res = await request(app).get('/api/transactions?month=2026-10');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].amount).toBe(500);
  });
});
