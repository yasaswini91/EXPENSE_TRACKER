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

describe('Health Check API', () => {
  it('GET /api/health should return 200 and operational status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Transaction CRUD & Validation API', () => {
  it('POST /api/transactions should create a valid expense transaction', async () => {
    const payload = {
      amount: 450.5,
      type: 'expense',
      category: 'Food & Dining',
      date: '2026-10-15T12:00:00.000Z',
      paymentMethod: 'UPI',
      note: 'Lunch at cafe',
    };

    const res = await request(app).post('/api/transactions').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.amount).toBe(450.5);
    expect(res.body.data.type).toBe('expense');
    expect(res.body.data.category).toBe('Food & Dining');
    expect(res.body.data.paymentMethod).toBe('UPI');
    expect(res.body.data.note).toBe('Lunch at cafe');
    expect(res.body.data._id).toBeDefined();
  });

  it('POST /api/transactions should create a valid income transaction', async () => {
    const payload = {
      amount: 50000,
      type: 'income',
      category: 'Salary',
      date: '2026-10-01T09:00:00.000Z',
      paymentMethod: 'Bank Transfer',
      note: 'Monthly salary',
    };

    const res = await request(app).post('/api/transactions').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(50000);
    expect(res.body.data.type).toBe('income');
  });

  it('POST /api/transactions should reject negative or zero amount', async () => {
    const resNegative = await request(app).post('/api/transactions').send({
      amount: -100,
      type: 'expense',
      category: 'Groceries',
      date: '2026-10-15',
    });
    expect(resNegative.status).toBe(400);
    expect(resNegative.body.success).toBe(false);

    const resZero = await request(app).post('/api/transactions').send({
      amount: 0,
      type: 'expense',
      category: 'Groceries',
      date: '2026-10-15',
    });
    expect(resZero.status).toBe(400);
    expect(resZero.body.success).toBe(false);
  });

  it('POST /api/transactions should reject missing or invalid type', async () => {
    const res = await request(app).post('/api/transactions').send({
      amount: 500,
      type: 'crypto_gain',
      category: 'Investments',
      date: '2026-10-15',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/transactions should reject empty category', async () => {
    const res = await request(app).post('/api/transactions').send({
      amount: 500,
      type: 'expense',
      category: '   ',
      date: '2026-10-15',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/transactions should reject invalid payment method', async () => {
    const res = await request(app).post('/api/transactions').send({
      amount: 500,
      type: 'expense',
      category: 'Groceries',
      date: '2026-10-15',
      paymentMethod: 'Gold Coins',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/transactions should list transactions newest first', async () => {
    await Transaction.create([
      {
        amount: 100,
        type: 'expense',
        category: 'Food & Dining',
        date: new Date('2026-10-05T10:00:00Z'),
        paymentMethod: 'Cash',
      },
      {
        amount: 200,
        type: 'expense',
        category: 'Transportation',
        date: new Date('2026-10-12T10:00:00Z'),
        paymentMethod: 'UPI',
      },
    ]);

    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    // Newest date first
    expect(new Date(res.body.data[0].date).getTime()).toBeGreaterThan(
      new Date(res.body.data[1].date).getTime()
    );
  });

  it('GET /api/transactions/:id should fetch single transaction or 404', async () => {
    const created = await Transaction.create({
      amount: 750,
      type: 'expense',
      category: 'Shopping & Apparel',
      date: new Date('2026-10-10'),
      paymentMethod: 'Credit Card',
    });

    const res = await request(app).get(`/api/transactions/${created._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(750);

    const nonExistentId = new mongoose.Types.ObjectId();
    const res404 = await request(app).get(`/api/transactions/${nonExistentId}`);
    expect(res404.status).toBe(404);
  });

  it('GET /api/transactions/:id with invalid ObjectId returns 400', async () => {
    const res = await request(app).get('/api/transactions/invalid-mongo-id');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('PUT /api/transactions/:id should update transaction', async () => {
    const created = await Transaction.create({
      amount: 1000,
      type: 'expense',
      category: 'Groceries',
      date: new Date('2026-10-05'),
      paymentMethod: 'Cash',
    });

    const res = await request(app).put(`/api/transactions/${created._id}`).send({
      amount: 1250,
      type: 'expense',
      category: 'Groceries',
      date: '2026-10-05',
      paymentMethod: 'UPI',
      note: 'Updated note with bill receipt',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(1250);
    expect(res.body.data.paymentMethod).toBe('UPI');
    expect(res.body.data.note).toBe('Updated note with bill receipt');
  });

  it('DELETE /api/transactions/:id should delete transaction', async () => {
    const created = await Transaction.create({
      amount: 300,
      type: 'expense',
      category: 'Transportation',
      date: new Date('2026-10-05'),
      paymentMethod: 'Cash',
    });

    const res = await request(app).delete(`/api/transactions/${created._id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const found = await Transaction.findById(created._id);
    expect(found).toBeNull();
  });
});
