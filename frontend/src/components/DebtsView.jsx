import React, { useState, useEffect } from 'react';
import {
  HandCoins,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Calendar,
  User,
  Loader2,
  X,
  FileText,
  Coins,
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, formatDate, formatDateForInput } from '../utils/formatters';
import { PAYMENT_METHODS } from '../utils/constants';

const DebtsView = ({ showToast, onDataMutated }) => {
  const [debtsData, setDebtsData] = useState({ debts: [], summary: {} });
  const [filterType, setFilterType] = useState('all'); // 'all' | 'you_owe' | 'they_owe' | 'settled'
  const [isLoading, setIsLoading] = useState(true);

  // Modal states for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states for Partial Installment Payment
  const [installmentModalDebt, setInstallmentModalDebt] = useState(null);
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [installmentMethod, setInstallmentMethod] = useState('UPI');
  const [installmentNote, setInstallmentNote] = useState('');

  // Form states
  const [type, setType] = useState('you_owe');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const loadDebts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDebts();
      if (res.success) {
        setDebtsData(res.data);
      }
    } catch (error) {
      showToast(error.message || 'Failed to load dues', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDebts();
  }, []);

  const notifyChange = () => {
    if (onDataMutated) {
      onDataMutated();
    }
  };

  const handleOpenCreateModal = (defaultType = 'you_owe') => {
    setEditingDebt(null);
    setType(defaultType);
    setPersonName('');
    setAmount('');
    setDescription('');
    setDueDate('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (debt) => {
    setEditingDebt(debt);
    setType(debt.type);
    setPersonName(debt.personName);
    setAmount(String(debt.amount));
    setDescription(debt.description || '');
    setDueDate(debt.dueDate ? formatDateForInput(debt.dueDate) : '');
    setIsModalOpen(true);
  };

  const handleSaveDebt = async (e) => {
    e.preventDefault();
    if (!personName.trim() || Number(amount) <= 0) {
      showToast('Please specify a person name and positive amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        personName: personName.trim(),
        type,
        amount: Number(amount),
        description: description.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      };

      if (editingDebt) {
        await api.updateDebt(editingDebt._id, payload);
        showToast('Due record updated successfully', 'success');
      } else {
        await api.createDebt(payload);
        showToast('Due / IOU recorded successfully', 'success');
      }
      setIsModalOpen(false);
      await loadDebts();
      notifyChange();
    } catch (error) {
      showToast(error.message || 'Failed to save due', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDebt = async (id, name) => {
    if (!window.confirm(`Delete record with ${name}?`)) return;
    try {
      await api.deleteDebt(id);
      showToast('Record deleted', 'success');
      await loadDebts();
      notifyChange();
    } catch (error) {
      showToast(error.message || 'Failed to delete record', 'error');
    }
  };

  // Open Installment Payment Modal
  const handleOpenInstallmentModal = (debt) => {
    const remaining = Math.max(0, debt.amount - (debt.paidAmount || 0));
    setInstallmentModalDebt(debt);
    setInstallmentAmount(String(remaining));
    setInstallmentMethod('UPI');
    setInstallmentNote('');
  };

  // Submit Installment Payment (Updates debt + creates Transaction in Ledger)
  const handleInstallmentSubmit = async (e) => {
    e.preventDefault();
    const payAmt = Number(installmentAmount);
    if (!payAmt || payAmt <= 0) {
      showToast('Please enter a valid installment payment amount', 'error');
      return;
    }

    const remaining = Math.max(0, installmentModalDebt.amount - (installmentModalDebt.paidAmount || 0));
    if (payAmt > remaining) {
      showToast(`Amount cannot exceed remaining balance of ${formatCurrency(remaining)}`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.recordDebtPayment(installmentModalDebt._id, {
        paymentAmount: payAmt,
        paymentMethod: installmentMethod,
        note: installmentNote,
      });

      showToast(res.message || 'Payment recorded and ledger balance updated!', 'success');
      setInstallmentModalDebt(null);
      await loadDebts();
      notifyChange();
    } catch (error) {
      showToast(error.message || 'Failed to record installment payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Full Toggle Settle (settles full remaining balance directly)
  const handleToggleSettle = async (debt) => {
    try {
      const res = await api.toggleSettleDebt(debt._id);
      showToast(res.message || 'Status updated and balance adjusted!', 'success');
      await loadDebts();
      notifyChange();
    } catch (error) {
      showToast(error.message || 'Failed to update status', 'error');
    }
  };

  const {
    totalYouOwe = 0,
    totalTheyOwe = 0,
    netDueBalance = 0,
    pendingYouOweCount = 0,
    pendingTheyOweCount = 0,
    settledCount = 0,
  } = debtsData.summary || {};

  // Filter list
  const filteredDebts = debtsData.debts.filter((d) => {
    if (filterType === 'settled') return d.status === 'settled';
    if (d.status === 'settled') return false; // In other views, show pending only
    if (filterType === 'you_owe') return d.type === 'you_owe';
    if (filterType === 'they_owe') return d.type === 'they_owe';
    return true; // 'all' pending
  });

  return (
    <div className="subview-container animate-fade-in">
      {/* Header */}
      <div className="subview-header">
        <div>
          <h2 className="subview-title">Dues & IOUs (Payables & Receivables)</h2>
          <p className="subview-subtitle">
            Track money you owe to others or others owe to you, accept installment payments, and automatically update your cash balance
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenCreateModal('you_owe')}
          >
            <Plus size={16} />
            <span>Record Due / IOU</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        {/* You Owe Card */}
        <div className="card stat-card">
          <div className="stat-card-header">
            <span className="stat-label">You Have to Pay Back (You Owe)</span>
            <div className="stat-icon-wrapper expense-icon-bg">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="stat-value balance-negative">{formatCurrency(totalYouOwe)}</div>
          <div className="stat-footer">
            <span className="stat-badge expense-badge">
              {pendingYouOweCount} pending {pendingYouOweCount === 1 ? 'payment' : 'payments'}
            </span>
            <span className="stat-period">Reduces balance when paid</span>
          </div>
        </div>

        {/* They Owe Card */}
        <div className="card stat-card">
          <div className="stat-card-header">
            <span className="stat-label">People Owe You (To Collect)</span>
            <div className="stat-icon-wrapper income-icon-bg">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="stat-value balance-positive">{formatCurrency(totalTheyOwe)}</div>
          <div className="stat-footer">
            <span className="stat-badge income-badge">
              {pendingTheyOweCount} pending {pendingTheyOweCount === 1 ? 'collection' : 'collections'}
            </span>
            <span className="stat-period">Grows balance when received</span>
          </div>
        </div>

        {/* Net Due Balance */}
        <div className="card stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Net Due Position</span>
            <div className="stat-icon-wrapper balance-icon-bg">
              <HandCoins size={18} />
            </div>
          </div>
          <div
            className={`stat-value ${netDueBalance >= 0 ? 'balance-positive' : 'balance-negative'}`}
          >
            {formatCurrency(netDueBalance)}
          </div>
          <div className="stat-footer">
            <span className="stat-note">
              {netDueBalance >= 0 ? 'You are in net surplus' : 'You have net dues to settle'}
            </span>
            <span className="stat-disclaimer">{settledCount} settled</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="due-filter-tabs" role="tablist">
        <button
          type="button"
          className={`due-filter-btn ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          All Pending ({pendingYouOweCount + pendingTheyOweCount})
        </button>
        <button
          type="button"
          className={`due-filter-btn expense ${filterType === 'you_owe' ? 'active' : ''}`}
          onClick={() => setFilterType('you_owe')}
        >
          You Owe ({pendingYouOweCount})
        </button>
        <button
          type="button"
          className={`due-filter-btn income ${filterType === 'they_owe' ? 'active' : ''}`}
          onClick={() => setFilterType('they_owe')}
        >
          Owed to You ({pendingTheyOweCount})
        </button>
        <button
          type="button"
          className={`due-filter-btn ${filterType === 'settled' ? 'active' : ''}`}
          onClick={() => setFilterType('settled')}
        >
          Settled History ({settledCount})
        </button>
      </div>

      {/* Dues List */}
      {filteredDebts.length === 0 && !isLoading ? (
        <div className="card empty-state-card">
          <div className="empty-state-icon-box">
            <HandCoins size={32} />
          </div>
          <h3 className="empty-state-title">No Records Found</h3>
          <p className="empty-state-desc">
            {filterType === 'settled'
              ? 'No settled debts in your history yet.'
              : 'You have no pending dues in this view. Keep tabs on shared bills and personal advances easily.'}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenCreateModal('you_owe')}
          >
            <Plus size={16} />
            <span>Record a Due or IOU</span>
          </button>
        </div>
      ) : (
        <div className="debts-grid">
          {filteredDebts.map((debt) => {
            const isYouOwe = debt.type === 'you_owe';
            const isSettled = debt.status === 'settled';
            const paid = debt.paidAmount || 0;
            const remaining = Math.max(0, debt.amount - paid);
            const progress = debt.amount > 0 ? Math.min(100, Number(((paid / debt.amount) * 100).toFixed(1))) : 0;

            return (
              <div
                key={debt._id}
                className={`card debt-card ${isSettled ? 'settled' : isYouOwe ? 'you-owe' : 'they-owe'}`}
              >
                <div className="debt-card-top">
                  <div className="debt-person-info">
                    <div
                      className={`debt-avatar ${isYouOwe ? 'avatar-expense' : 'avatar-income'}`}
                    >
                      <User size={16} />
                    </div>
                    <div>
                      <h3 className="debt-person-name">{debt.personName}</h3>
                      <div className="debt-badges-row">
                        <span className={`badge ${isYouOwe ? 'badge-expense' : 'badge-income'}`}>
                          {isYouOwe ? 'You Owe' : 'Owes You'}
                        </span>
                        {isSettled && <span className="badge badge-neutral">Settled</span>}
                      </div>
                    </div>
                  </div>

                  <div className="debt-amount-box text-right">
                    <span className="amount-sublabel">
                      {isSettled ? 'Settled Amount' : 'Remaining Due'}
                    </span>
                    <span
                      className={`debt-amount ${isYouOwe ? 'amount-expense' : 'amount-income'}`}
                    >
                      {formatCurrency(isSettled ? debt.amount : remaining)}
                    </span>
                  </div>
                </div>

                {/* Installment breakdown & Progress */}
                {!isSettled && paid > 0 && (
                  <div className="debt-installment-progress">
                    <div className="progress-bar-track">
                      <div
                        className={`progress-bar-fill ${isYouOwe ? '' : 'success'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="installment-meta">
                      <span>{progress}% paid ({formatCurrency(paid)} of {formatCurrency(debt.amount)})</span>
                      <span>{formatCurrency(remaining)} left</span>
                    </div>
                  </div>
                )}

                {debt.description && (
                  <p className="debt-desc">
                    <FileText size={13} className="desc-icon" />
                    <span>{debt.description}</span>
                  </p>
                )}

                <div className="debt-card-bottom">
                  <div className="debt-date-info">
                    {debt.dueDate && !isSettled && (
                      <span className="due-date-text">
                        <Calendar size={13} /> Due: {formatDate(debt.dueDate)}
                      </span>
                    )}
                    {isSettled && debt.settledAt && (
                      <span className="settled-date-text">
                        <CheckCircle2 size={13} /> Settled on {formatDate(debt.settledAt)}
                      </span>
                    )}
                  </div>

                  <div className="debt-actions">
                    {!isSettled && (
                      <>
                        {/* Installment Button */}
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary installment-action-btn"
                          onClick={() => handleOpenInstallmentModal(debt)}
                          title={isYouOwe ? 'Pay installment towards this debt' : 'Record money received from this person'}
                        >
                          <Coins size={14} />
                          <span>{isYouOwe ? 'Pay Installment' : 'Receive Money'}</span>
                        </button>

                        {/* Quick Full Settle */}
                        <button
                          type="button"
                          className={`btn btn-sm ${isYouOwe ? 'btn-subtle' : 'btn-primary'}`}
                          onClick={() => handleToggleSettle(debt)}
                          title="Settle full remaining balance at once"
                        >
                          <CheckCircle2 size={13} />
                          <span>Settle Full</span>
                        </button>
                      </>
                    )}

                    {isSettled && (
                      <button
                        type="button"
                        className="btn btn-sm btn-subtle"
                        onClick={() => handleToggleSettle(debt)}
                        title="Reopen as pending"
                      >
                        <RotateCcw size={13} />
                        <span>Reopen</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleOpenEditModal(debt)}
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleDeleteDebt(debt._id, debt.personName)}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Installment / Payment Modal */}
      {installmentModalDebt && (
        <div className="modal-overlay" onClick={() => setInstallmentModalDebt(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {installmentModalDebt.type === 'they_owe'
                    ? `Receive Money from ${installmentModalDebt.personName}`
                    : `Pay Money to ${installmentModalDebt.personName}`}
                </h3>
                <p className="modal-subtitle">
                  Total Debt: {formatCurrency(installmentModalDebt.amount)} | Remaining Balance:{' '}
                  <strong>
                    {formatCurrency(
                      Math.max(0, installmentModalDebt.amount - (installmentModalDebt.paidAmount || 0))
                    )}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setInstallmentModalDebt(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInstallmentSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">
                  <span>
                    {installmentModalDebt.type === 'they_owe'
                      ? 'How much money did you receive? (₹) *'
                      : 'How much money did you pay? (₹) *'}
                  </span>
                </label>
                <div className="input-currency-wrapper">
                  <span className="currency-prefix">₹</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max={Math.max(0, installmentModalDebt.amount - (installmentModalDebt.paidAmount || 0))}
                    className="form-input currency-input"
                    placeholder="Enter received amount"
                    value={installmentAmount}
                    onChange={(e) => setInstallmentAmount(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <p className="form-help-hint">
                  {installmentModalDebt.type === 'they_owe'
                    ? '✨ This payment will be automatically recorded as Income, growing your financial balance.'
                    : '🔻 This payment will be automatically recorded as an Expense, updating your financial balance.'}
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={installmentMethod}
                  onChange={(e) => setInstallmentMethod(e.target.value)}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Optional Note</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1st installment via GPay, cash given..."
                  value={installmentNote}
                  onChange={(e) => setInstallmentNote(e.target.value)}
                  maxLength={200}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setInstallmentModalDebt(null)}
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
                      <Loader2 size={16} className="spinner" /> Recording...
                    </>
                  ) : (
                    <span>
                      {installmentModalDebt.type === 'they_owe'
                        ? 'Confirm Received (+ Balance)'
                        : 'Confirm Payment (- Balance)'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Due Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {editingDebt ? 'Edit Due Record' : 'Record Due / IOU'}
                </h3>
                <p className="modal-subtitle">
                  Track money borrowed or lent with friends, family, or contacts
                </p>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDebt} className="modal-form">
              {/* Type Switcher */}
              <div className="form-group">
                <label className="form-label">Who owes whom? *</label>
                <div className="tx-type-selector">
                  <button
                    type="button"
                    className={`type-select-btn expense ${type === 'you_owe' ? 'active' : ''}`}
                    onClick={() => setType('you_owe')}
                  >
                    <ArrowDownRight size={16} />
                    <span>I Owe Someone (Payable)</span>
                  </button>
                  <button
                    type="button"
                    className={`type-select-btn income ${type === 'they_owe' ? 'active' : ''}`}
                    onClick={() => setType('they_owe')}
                  >
                    <ArrowUpRight size={16} />
                    <span>Someone Owes Me (Receivable)</span>
                  </button>
                </div>
              </div>

              <div className="form-row-two-col">
                <div className="form-group">
                  <label className="form-label">Person / Contact Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rahul, Sneha, Landlord"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Total Amount (₹) *</label>
                  <div className="input-currency-wrapper">
                    <span className="currency-prefix">₹</span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      className="form-input currency-input"
                      placeholder="1500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date (Optional)</label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Reason</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Split Goa weekend hotel booking, borrowed for groceries..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
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
                      <Loader2 size={16} className="spinner" /> Saving...
                    </>
                  ) : (
                    <span>{editingDebt ? 'Update Due' : 'Save Record'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtsView;
