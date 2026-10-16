import React, { useState, useEffect } from 'react';
import {
  Landmark,
  CreditCard,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const LoansView = ({ showToast, onDataMutated }) => {
  const [loanData, setLoanData] = useState({ loans: [], summary: {} });
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [lender, setLender] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [monthlyEmi, setMonthlyEmi] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [totalTenureMonths, setTotalTenureMonths] = useState('12');
  const [remainingTenureMonths, setRemainingTenureMonths] = useState('12');
  const [interestRate, setInterestRate] = useState('');
  const [notes, setNotes] = useState('');

  const loadLoans = async () => {
    setIsLoading(true);
    try {
      const res = await api.getLoans();
      if (res.success) {
        setLoanData(res.data);
      }
    } catch (error) {
      showToast(error.message || 'Failed to load loans', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingLoan(null);
    setTitle('');
    setLender('HDFC Bank');
    setTotalAmount('');
    setMonthlyEmi('');
    setDueDay('5');
    setRemainingAmount('');
    setTotalTenureMonths('12');
    setRemainingTenureMonths('12');
    setInterestRate('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (loan) => {
    setEditingLoan(loan);
    setTitle(loan.title);
    setLender(loan.lender || '');
    setTotalAmount(String(loan.totalAmount));
    setMonthlyEmi(String(loan.monthlyEmi));
    setDueDay(String(loan.dueDay || 5));
    setRemainingAmount(String(loan.remainingAmount));
    setTotalTenureMonths(String(loan.totalTenureMonths || 12));
    setRemainingTenureMonths(String(loan.remainingTenureMonths || 12));
    setInterestRate(loan.interestRate ? String(loan.interestRate) : '');
    setNotes(loan.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveLoan = async (e) => {
    e.preventDefault();
    if (!title.trim() || Number(totalAmount) <= 0 || Number(monthlyEmi) <= 0) {
      showToast('Please fill all required loan details with positive numbers', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        lender: lender.trim() || 'Bank / NBFC',
        totalAmount: Number(totalAmount),
        monthlyEmi: Number(monthlyEmi),
        dueDay: Number(dueDay) || 5,
        remainingAmount:
          remainingAmount !== '' ? Number(remainingAmount) : Number(totalAmount),
        totalTenureMonths: Number(totalTenureMonths) || 12,
        remainingTenureMonths:
          remainingTenureMonths !== '' ? Number(remainingTenureMonths) : Number(totalTenureMonths) || 12,
        interestRate: Number(interestRate) || 0,
        notes: notes.trim(),
      };

      if (editingLoan) {
        await api.updateLoan(editingLoan._id, payload);
        showToast('Loan / EMI record updated successfully', 'success');
      } else {
        await api.createLoan(payload);
        showToast('New Loan / EMI tracked successfully', 'success');
      }
      setIsModalOpen(false);
      await loadLoans();
    } catch (error) {
      showToast(error.message || 'Failed to save loan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLoan = async (id, loanTitle) => {
    if (!window.confirm(`Delete loan record "${loanTitle}"?`)) return;
    try {
      await api.deleteLoan(id);
      showToast('Loan record deleted', 'success');
      await loadLoans();
    } catch (error) {
      showToast(error.message || 'Failed to delete loan', 'error');
    }
  };

  const handlePayEmi = async (loan) => {
    if (loan.remainingAmount <= 0) return;
    try {
      const res = await api.payEmi(loan._id);
      showToast(res.message || 'Monthly EMI payment recorded', 'success');
      await loadLoans();
      if (onDataMutated) onDataMutated();
    } catch (error) {
      showToast(error.message || 'Failed to record EMI payment', 'error');
    }
  };

  const {
    totalOutstandingDebt = 0,
    totalMonthlyEmi = 0,
    activeLoansCount = 0,
    closedLoansCount = 0,
  } = loanData.summary || {};

  return (
    <div className="subview-container animate-fade-in">
      {/* Header */}
      <div className="subview-header">
        <div>
          <h2 className="subview-title">Loans & EMI Tracker</h2>
          <p className="subview-subtitle">
            Manage your monthly EMIs, vehicle/personal loans, and track payoff schedules
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleOpenCreateModal}
        >
          <Plus size={16} />
          <span>Add Loan / EMI</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="summary-grid">
        <div className="card stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Outstanding Debt</span>
            <div className="stat-icon-wrapper expense-icon-bg">
              <Landmark size={18} />
            </div>
          </div>
          <div className="stat-value balance-negative">{formatCurrency(totalOutstandingDebt)}</div>
          <div className="stat-footer">
            <span className="stat-badge expense-badge">
              {activeLoansCount} active {activeLoansCount === 1 ? 'obligation' : 'obligations'}
            </span>
            <span className="stat-period">{closedLoansCount} closed</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Monthly EMI Commitment</span>
            <div className="stat-icon-wrapper balance-icon-bg">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(totalMonthlyEmi)}</div>
          <div className="stat-footer">
            <span className="stat-note">Recurring monthly outflow</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Debt Status Overview</span>
            <div className="stat-icon-wrapper income-icon-bg">
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value">{activeLoansCount} Active</div>
          <div className="stat-footer">
            <span className="stat-note">
              {activeLoansCount > 0 ? 'Monthly payments scheduled' : 'All loans cleared!'}
            </span>
          </div>
        </div>
      </div>

      {/* Loans List */}
      {loanData.loans.length === 0 && !isLoading ? (
        <div className="card empty-state-card">
          <div className="empty-state-icon-box">
            <Landmark size={32} />
          </div>
          <h3 className="empty-state-title">No Loans or EMIs Tracked</h3>
          <p className="empty-state-desc">
            Stay on top of debt by tracking consumer EMIs, bank loans, and monthly due dates in one place.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreateModal}
          >
            <Plus size={16} />
            <span>Add First Loan / EMI</span>
          </button>
        </div>
      ) : (
        <div className="loans-list">
          {loanData.loans.map((loan) => {
            const isClosed = loan.status === 'closed' || loan.remainingAmount === 0;
            const paidAmount = Math.max(0, loan.totalAmount - loan.remainingAmount);
            const paidPct = loan.totalAmount > 0
              ? Math.min(100, Number(((paidAmount / loan.totalAmount) * 100).toFixed(1)))
              : 100;

            return (
              <div key={loan._id} className={`card loan-card ${isClosed ? 'closed' : ''}`}>
                <div className="loan-card-main">
                  <div className="loan-info-group">
                    <div className="loan-title-row">
                      <h3 className="loan-title">{loan.title}</h3>
                      <span className="badge badge-neutral">{loan.lender}</span>
                      <span className={`badge ${isClosed ? 'badge-income' : 'badge-expense'}`}>
                        {isClosed ? 'Closed / Paid' : 'Active'}
                      </span>
                      {!isClosed && (
                        <span className="due-day-pill" title="Day of month payment is due">
                          <Calendar size={12} /> Due on the {loan.dueDay}th
                        </span>
                      )}
                    </div>
                    {loan.notes && <p className="loan-notes-text">{loan.notes}</p>}
                  </div>

                  <div className="loan-amount-group">
                    <div className="loan-amount-block">
                      <span className="amount-sublabel">Monthly EMI</span>
                      <p className="loan-emi-val">{formatCurrency(loan.monthlyEmi)}</p>
                    </div>
                    <div className="loan-amount-block">
                      <span className="amount-sublabel">Remaining Balance</span>
                      <p className="loan-remaining-val">{formatCurrency(loan.remainingAmount)}</p>
                    </div>
                  </div>

                  <div className="loan-actions-group">
                    {!isClosed && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm pay-emi-btn"
                        onClick={() => handlePayEmi(loan)}
                        title={`Record payment of ${formatCurrency(loan.monthlyEmi)}`}
                      >
                        <CheckCircle2 size={14} />
                        <span>Pay Monthly EMI</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleOpenEditModal(loan)}
                      title="Edit Loan"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleDeleteLoan(loan._id, loan.title)}
                      title="Delete Loan"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Progress bar of loan repaid */}
                <div className="loan-progress-bar-wrapper">
                  <div className="progress-bar-track">
                    <div
                      className={`progress-bar-fill ${isClosed ? 'success' : ''}`}
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>
                  <div className="loan-progress-labels">
                    <span>
                      {paidPct}% Repaid ({formatCurrency(paidAmount)} of {formatCurrency(loan.totalAmount)})
                    </span>
                    <span>
                      {isClosed
                        ? 'Fully Paid Off'
                        : `${loan.remainingTenureMonths || 0} installments remaining`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Loan Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {editingLoan ? 'Edit Loan / EMI' : 'Track New Loan / EMI'}
                </h3>
                <p className="modal-subtitle">Record details of your EMI or personal loan</p>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLoan} className="modal-form">
              <div className="form-row-two-col">
                <div className="form-group">
                  <label className="form-label">Loan / EMI Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Car Loan, MacBook EMI, Education Loan"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Lender / Institution *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. HDFC Bank, SBI, Bajaj Finserv"
                    value={lender}
                    onChange={(e) => setLender(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row-two-col">
                <div className="form-group">
                  <label className="form-label">Total Loan Amount (₹) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    className="form-input"
                    placeholder="150000"
                    value={totalAmount}
                    onChange={(e) => {
                      setTotalAmount(e.target.value);
                      if (!editingLoan && !remainingAmount) {
                        setRemainingAmount(e.target.value);
                      }
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Monthly EMI (₹) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    className="form-input"
                    placeholder="12500"
                    value={monthlyEmi}
                    onChange={(e) => setMonthlyEmi(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row-two-col">
                <div className="form-group">
                  <label className="form-label">Due Day of Month (1-31) *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    className="form-input"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Remaining Balance (₹) *</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    className="form-input"
                    placeholder="100000"
                    value={remainingAmount}
                    onChange={(e) => setRemainingAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row-two-col">
                <div className="form-group">
                  <label className="form-label">Total Tenure (Months)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={totalTenureMonths}
                    onChange={(e) => setTotalTenureMonths(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Remaining Installments</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={remainingTenureMonths}
                    onChange={(e) => setRemainingTenureMonths(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Account no., auto-debit from salary account..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                    <span>{editingLoan ? 'Update Loan' : 'Record Loan'}</span>
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

export default LoansView;
