import mongoose from 'mongoose';
import { TRANSACTION_TYPES, PAYMENT_METHODS } from '../models/Transaction.js';

/**
 * Validates request body for creating or updating a transaction
 */
export const validateTransactionBody = (req, res, next) => {
  const { amount, type, category, date, paymentMethod, note } = req.body;
  const errors = [];

  // Amount validation
  if (amount === undefined || amount === null || amount === '') {
    errors.push({ field: 'amount', message: 'Amount is required' });
  } else {
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount)) {
      errors.push({ field: 'amount', message: 'Amount must be a valid number' });
    } else if (numAmount <= 0) {
      errors.push({ field: 'amount', message: 'Amount must be a positive number greater than 0' });
    } else if (numAmount > 1000000000) {
      errors.push({ field: 'amount', message: 'Amount exceeds maximum allowable limit' });
    }
  }

  // Type validation
  if (!type) {
    errors.push({ field: 'type', message: 'Transaction type is required' });
  } else if (!TRANSACTION_TYPES.includes(String(type).toLowerCase().trim())) {
    errors.push({
      field: 'type',
      message: `Transaction type must be one of: ${TRANSACTION_TYPES.join(', ')}`,
    });
  }

  // Category validation
  if (!category || typeof category !== 'string' || !category.trim()) {
    errors.push({ field: 'category', message: 'Category is required and cannot be blank' });
  } else if (category.trim().length > 100) {
    errors.push({ field: 'category', message: 'Category cannot exceed 100 characters' });
  }

  // Date validation
  if (!date) {
    errors.push({ field: 'date', message: 'Transaction date is required' });
  } else {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      errors.push({ field: 'date', message: 'Invalid date format. Please supply a valid ISO date string' });
    }
  }

  // Payment method validation
  if (paymentMethod !== undefined && paymentMethod !== null && paymentMethod !== '') {
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      errors.push({
        field: 'paymentMethod',
        message: `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}`,
      });
    }
  }

  // Note validation
  if (note && typeof note === 'string' && note.length > 500) {
    errors.push({ field: 'note', message: 'Note cannot exceed 500 characters' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/**
 * Validates MongoDB ObjectId param
 */
export const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid transaction ID format: '${id}'`,
    });
  }
  next();
};

/**
 * Validates month query parameter if present
 */
export const validateMonthQuery = (req, res, next) => {
  const { month } = req.query;
  if (month !== undefined && month !== '') {
    const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!regex.test(month)) {
      return res.status(400).json({
        success: false,
        message: "Invalid month format. Expected 'YYYY-MM' (e.g. 2026-10)",
      });
    }
  }
  next();
};
