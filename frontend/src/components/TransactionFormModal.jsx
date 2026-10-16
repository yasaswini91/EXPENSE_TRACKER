import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Loader2, AlertCircle } from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
} from '../utils/constants';
import { formatDateForInput } from '../utils/formatters';

const TransactionFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false,
  serverError = null,
}) => {
  const isEditing = Boolean(initialData && initialData._id);

  // Form state
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [date, setDate] = useState(formatDateForInput(new Date()));
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});

  // Sync form when initialData changes or modal opens
  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'expense');
      setAmount(initialData.amount ? String(initialData.amount) : '');

      const initialCat = initialData.category || '';
      const isKnownExpense = EXPENSE_CATEGORIES.includes(initialCat);
      const isKnownIncome = INCOME_CATEGORIES.includes(initialCat);

      if (initialData.type === 'income') {
        if (isKnownIncome) {
          setCategory(initialCat);
          setCustomCategory('');
        } else {
          setCategory('Other Income');
          setCustomCategory(initialCat.replace(/^Other:\s*/i, ''));
        }
      } else {
        if (isKnownExpense) {
          setCategory(initialCat);
          setCustomCategory('');
        } else {
          setCategory('Other Expense');
          setCustomCategory(initialCat.replace(/^Other:\s*/i, ''));
        }
      }

      setDate(
        initialData.date
          ? formatDateForInput(initialData.date)
          : formatDateForInput(new Date())
      );
      setPaymentMethod(initialData.paymentMethod || 'Cash');
      setNote(initialData.note || '');
    } else {
      // Reset for new creation
      setType('expense');
      setAmount('');
      setCategory(EXPENSE_CATEGORIES[0]);
      setCustomCategory('');
      setDate(formatDateForInput(new Date()));
      setPaymentMethod('Cash');
      setNote('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const isOtherSelected = category === 'Other Expense' || category === 'Other Income';

  // Change type handler - also switches default category
  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'income') {
      if (!INCOME_CATEGORIES.includes(category)) {
        setCategory(INCOME_CATEGORIES[0]);
      }
    } else {
      if (!EXPENSE_CATEGORIES.includes(category)) {
        setCategory(EXPENSE_CATEGORIES[0]);
      }
    }
    setCustomCategory('');
    if (errors.category || errors.customCategory) {
      setErrors((prev) => ({ ...prev, category: null, customCategory: null }));
    }
  };

  // Client-side validation
  const validateForm = () => {
    const newErrors = {};

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount)) {
      newErrors.amount = 'Please enter a valid transaction amount';
    } else if (numAmount <= 0) {
      newErrors.amount = 'Amount must be greater than zero';
    } else if (numAmount > 1000000000) {
      newErrors.amount = 'Amount exceeds maximum allowable limit';
    }

    if (!category || !category.trim()) {
      newErrors.category = 'Please select a category';
    } else if (isOtherSelected && (!customCategory || !customCategory.trim())) {
      newErrors.customCategory = 'Please specify what type of transaction this is';
    }

    if (!date) {
      newErrors.date = 'Transaction date is required';
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    if (note && note.length > 500) {
      newErrors.note = 'Note cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    // If "Other" category is chosen, use the user's custom specification
    const finalCategory = isOtherSelected
      ? `Other: ${customCategory.trim()}`
      : category.trim();

    const payload = {
      amount: parseFloat(amount),
      type,
      category: finalCategory,
      date: new Date(date).toISOString(),
      paymentMethod,
      note: note.trim(),
    };

    onSubmit(payload);
  };

  const currentCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      role="presentation"
    >
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-modal-title"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 id="tx-modal-title" className="modal-title">
              {isEditing ? 'Edit Transaction' : 'Record Transaction'}
            </h2>
            <p className="modal-subtitle">
              {isEditing
                ? 'Update transaction amount, details, or category'
                : 'Log a personal income deposit or expense payout'}
            </p>
          </div>
          <button
            type="button"
            className="btn-icon modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="form-alert-banner" role="alert">
            <AlertCircle size={16} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="modal-form">
          {/* Type Toggle Switch */}
          <div className="form-group">
            <label className="form-label">
              <span>Transaction Type</span>
              <span className="required">*</span>
            </label>
            <div className="tx-type-selector" role="radiogroup" aria-label="Transaction Type">
              <button
                type="button"
                role="radio"
                aria-checked={type === 'expense'}
                className={`type-select-btn expense ${type === 'expense' ? 'active' : ''}`}
                onClick={() => handleTypeChange('expense')}
                disabled={isSubmitting}
              >
                <ArrowDownRight size={16} />
                <span>Expense</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={type === 'income'}
                className={`type-select-btn income ${type === 'income' ? 'active' : ''}`}
                onClick={() => handleTypeChange('income')}
                disabled={isSubmitting}
              >
                <ArrowUpRight size={16} />
                <span>Income</span>
              </button>
            </div>
          </div>

          {/* Amount input */}
          <div className="form-group">
            <label htmlFor="tx-amount" className="form-label">
              <span>Amount (₹)</span>
              <span className="required">*</span>
            </label>
            <div className="input-currency-wrapper">
              <span className="currency-prefix" aria-hidden="true">
                ₹
              </span>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                className={`form-input currency-input ${errors.amount ? 'is-invalid' : ''}`}
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: null }));
                }}
                disabled={isSubmitting}
                required
                autoFocus
              />
            </div>
            {errors.amount && <p className="form-error">{errors.amount}</p>}
          </div>

          {/* Category Dropdown */}
          <div className="form-group">
            <label htmlFor="tx-category" className="form-label">
              <span>Category</span>
              <span className="required">*</span>
            </label>
            <select
              id="tx-category"
              className={`form-select ${errors.category ? 'is-invalid' : ''}`}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (errors.category) setErrors((prev) => ({ ...prev, category: null }));
              }}
              disabled={isSubmitting}
              required
            >
              {currentCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && <p className="form-error">{errors.category}</p>}
          </div>

          {/* Conditional Custom Type Textbox when "Other Expense" or "Other Income" is selected */}
          {isOtherSelected && (
            <div className="form-group animate-slide-down">
              <label htmlFor="tx-custom-category" className="form-label">
                <span>Specify Transaction Type / Category</span>
                <span className="required">*</span>
              </label>
              <input
                id="tx-custom-category"
                type="text"
                className={`form-input ${errors.customCategory ? 'is-invalid' : ''}`}
                placeholder="e.g. Gym membership, Pet supplies, Freelance bonus, Repairs..."
                value={customCategory}
                onChange={(e) => {
                  setCustomCategory(e.target.value);
                  if (errors.customCategory) {
                    setErrors((prev) => ({ ...prev, customCategory: null }));
                  }
                }}
                disabled={isSubmitting}
                maxLength={80}
                required
              />
              {errors.customCategory && (
                <p className="form-error">{errors.customCategory}</p>
              )}
            </div>
          )}

          {/* Date & Payment Method Row */}
          <div className="form-row-two-col">
            <div className="form-group">
              <label htmlFor="tx-date" className="form-label">
                <span>Date</span>
                <span className="required">*</span>
              </label>
              <input
                id="tx-date"
                type="date"
                className={`form-input ${errors.date ? 'is-invalid' : ''}`}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: null }));
                }}
                disabled={isSubmitting}
                required
              />
              {errors.date && <p className="form-error">{errors.date}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="tx-payment-method" className="form-label">
                <span>Payment Method</span>
                <span className="required">*</span>
              </label>
              <select
                id="tx-payment-method"
                className={`form-select ${errors.paymentMethod ? 'is-invalid' : ''}`}
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  if (errors.paymentMethod)
                    setErrors((prev) => ({ ...prev, paymentMethod: null }));
                }}
                disabled={isSubmitting}
                required
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              {errors.paymentMethod && <p className="form-error">{errors.paymentMethod}</p>}
            </div>
          </div>

          {/* Optional Note */}
          <div className="form-group">
            <div className="form-label">
              <label htmlFor="tx-note">Optional Note</label>
              <span className="char-count">{note.length}/500</span>
            </div>
            <textarea
              id="tx-note"
              className={`form-textarea ${errors.note ? 'is-invalid' : ''}`}
              rows={2}
              placeholder="e.g. Monthly broadband bill, client invoice #102..."
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (errors.note) setErrors((prev) => ({ ...prev, note: null }));
              }}
              disabled={isSubmitting}
              maxLength={500}
            />
            {errors.note && <p className="form-error">{errors.note}</p>}
          </div>

          {/* Modal Actions */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Record Transaction'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionFormModal;
