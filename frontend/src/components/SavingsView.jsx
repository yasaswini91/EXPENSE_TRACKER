import React, { useState, useEffect } from 'react';
import {
  PiggyBank,
  Target,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  Coins,
  Loader2,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, formatDate, formatDateForInput } from '../utils/formatters';
import { PAYMENT_METHODS } from '../utils/constants';

const SAVINGS_CATEGORIES = [
  'Emergency Fund',
  'Retirement',
  'Vehicle / Car',
  'Home & Real Estate',
  'Vacation & Travel',
  'Gadgets & Electronics',
  'Education',
  'General Wealth',
];

const SavingsView = ({ showToast, onDataMutated }) => {
  const [savingsData, setSavingsData] = useState({ goals: [], summary: {} });
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [depositModalGoal, setDepositModalGoal] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('Bank Transfer');
  const [depositNote, setDepositNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Goal modal
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [category, setCategory] = useState(SAVINGS_CATEGORIES[0]);
  const [targetDate, setTargetDate] = useState('');
  const [note, setNote] = useState('');

  const loadSavings = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSavings();
      if (res.success) {
        setSavingsData(res.data);
      }
    } catch (error) {
      showToast(error.message || 'Failed to load savings records', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSavings();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingGoal(null);
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('');
    setCategory(SAVINGS_CATEGORIES[0]);
    setTargetDate('');
    setNote('');
    setIsGoalModalOpen(true);
  };

  const handleOpenEditModal = (goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setTargetAmount(String(goal.targetAmount));
    setCurrentAmount(String(goal.currentAmount || 0));
    setCategory(goal.category || SAVINGS_CATEGORIES[0]);
    setTargetDate(goal.targetDate ? formatDateForInput(goal.targetDate) : '');
    setNote(goal.note || '');
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (!title.trim() || Number(targetAmount) <= 0) {
      showToast('Please provide a valid goal title and target amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount) || 0,
        category,
        targetDate: targetDate ? new Date(targetDate).toISOString() : null,
        note: note.trim(),
      };

      if (editingGoal) {
        await api.updateSavingsGoal(editingGoal._id, payload);
        showToast('Savings goal updated successfully', 'success');
      } else {
        await api.createSavingsGoal(payload);
        showToast('New savings goal created', 'success');
      }
      setIsGoalModalOpen(false);
      await loadSavings();
    } catch (error) {
      showToast(error.message || 'Failed to save savings goal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id, goalTitle) => {
    if (!window.confirm(`Delete savings goal "${goalTitle}"?`)) return;
    try {
      await api.deleteSavingsGoal(id);
      showToast('Savings goal deleted', 'success');
      await loadSavings();
    } catch (error) {
      showToast(error.message || 'Failed to delete goal', 'error');
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      showToast('Please enter a valid deposit amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.addSavingsDeposit(depositModalGoal._id, {
        depositAmount: amount,
        paymentMethod: depositMethod,
        note: depositNote,
      });
      showToast(`Deposited ${formatCurrency(amount)} into ${depositModalGoal.title}. Deducted from balance.`, 'success');
      setDepositModalGoal(null);
      setDepositAmount('');
      setDepositNote('');
      await loadSavings();
      if (onDataMutated) onDataMutated();
    } catch (error) {
      showToast(error.message || 'Failed to add deposit', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const {
    totalSavings = 0,
    totalTarget = 0,
    overallProgress = 0,
    goalCount = 0,
    completedCount = 0,
  } = savingsData.summary || {};

  return (
    <div className="subview-container animate-fade-in">
      {/* Top Banner & Summary Cards */}
      <div className="subview-header">
        <div>
          <h2 className="subview-title">Savings & Financial Goals</h2>
          <p className="subview-subtitle">
            Track your dedicated savings funds, emergency reserves, and milestones
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleOpenCreateModal}
        >
          <Plus size={16} />
          <span>New Savings Goal</span>
        </button>
      </div>

      <div className="summary-grid">
        <div className="card stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Accumulated Savings</span>
            <div className="stat-icon-wrapper income-icon-bg">
              <PiggyBank size={18} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(totalSavings)}</div>
          <div className="stat-footer">
            <span className="stat-badge income-badge">
              <TrendingUp size={13} />
              Across {goalCount} {goalCount === 1 ? 'goal' : 'goals'}
            </span>
            <span className="stat-period">{completedCount} reached target</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Target Objective</span>
            <div className="stat-icon-wrapper balance-icon-bg">
              <Target size={18} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(totalTarget)}</div>
          <div className="stat-footer">
            <span className="stat-note">
              {formatCurrency(Math.max(0, totalTarget - totalSavings))} remaining to save
            </span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Overall Progress</span>
            <div className="stat-icon-wrapper income-icon-bg">
              <Coins size={18} />
            </div>
          </div>
          <div className="stat-value">{overallProgress}%</div>
          <div className="stat-footer">
            <div className="progress-bar-track full-width">
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.min(100, overallProgress)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {savingsData.goals.length === 0 && !isLoading ? (
        <div className="card empty-state-card">
          <div className="empty-state-icon-box">
            <PiggyBank size={32} />
          </div>
          <h3 className="empty-state-title">No Savings Goals Set Yet</h3>
          <p className="empty-state-desc">
            Define savings milestones like an Emergency Fund, a dream vacation, or investment reserves to keep your finances disciplined.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreateModal}
          >
            <Plus size={16} />
            <span>Create First Goal</span>
          </button>
        </div>
      ) : (
        <div className="goals-grid">
          {savingsData.goals.map((goal) => {
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const progress = goal.targetAmount > 0
              ? Math.min(100, Number(((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)))
              : 0;

            return (
              <div key={goal._id} className={`card goal-card ${isCompleted ? 'completed' : ''}`}>
                <div className="goal-header">
                  <div>
                    <span className="badge badge-neutral">{goal.category}</span>
                    <h3 className="goal-title">{goal.title}</h3>
                  </div>
                  <div className="goal-actions">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleOpenEditModal(goal)}
                      title="Edit Goal"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleDeleteGoal(goal._id, goal.title)}
                      title="Delete Goal"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="goal-amounts">
                  <div>
                    <span className="amount-sublabel">Saved so far</span>
                    <p className="goal-current">{formatCurrency(goal.currentAmount)}</p>
                  </div>
                  <div className="text-right">
                    <span className="amount-sublabel">Target</span>
                    <p className="goal-target">{formatCurrency(goal.targetAmount)}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="goal-progress-section">
                  <div className="progress-bar-track">
                    <div
                      className={`progress-bar-fill ${isCompleted ? 'success' : ''}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="progress-labels">
                    <span className="progress-pct">{progress}% completed</span>
                    {isCompleted ? (
                      <span className="completed-badge">
                        <CheckCircle2 size={13} /> Reached!
                      </span>
                    ) : (
                      <span className="remaining-text">
                        {formatCurrency(goal.targetAmount - goal.currentAmount)} to go
                      </span>
                    )}
                  </div>
                </div>

                {goal.targetDate && (
                  <div className="goal-target-date">
                    <Calendar size={13} />
                    <span>Target Date: {formatDate(goal.targetDate)}</span>
                  </div>
                )}

                {goal.note && <p className="goal-note">{goal.note}</p>}

                <div className="goal-card-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm deposit-btn"
                    onClick={() => {
                      setDepositModalGoal(goal);
                      setDepositAmount('');
                      setDepositMethod('Bank Transfer');
                      setDepositNote('');
                    }}
                  >
                    <Plus size={14} />
                    <span>Add Deposit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Create / Edit Modal */}
      {isGoalModalOpen && (
        <div className="modal-overlay" onClick={() => setIsGoalModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {editingGoal ? 'Edit Savings Goal' : 'New Savings Goal'}
                </h3>
                <p className="modal-subtitle">Set your target milestone and timeline</p>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsGoalModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="modal-form">
              <div className="form-group">
                <label className="form-label">Goal Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Emergency Fund, Laptop, Summer Trip"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-row-two-col">
                <div className="form-group">
                  <label className="form-label">Target Amount (₹) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    className="form-input"
                    placeholder="100000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Already Saved (₹)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    className="form-input"
                    placeholder="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-two-col">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {SAVINGS_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Date (Optional)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Note / Purpose</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Saved in high-yield recurring deposit..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsGoalModalOpen(false)}
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
                    <span>{editingGoal ? 'Update Goal' : 'Create Goal'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Deposit Modal */}
      {depositModalGoal && (
        <div className="modal-overlay" onClick={() => setDepositModalGoal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Add Deposit to {depositModalGoal.title}</h3>
                <p className="modal-subtitle">
                  Current balance: {formatCurrency(depositModalGoal.currentAmount)} / Target: {formatCurrency(depositModalGoal.targetAmount)}
                </p>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setDepositModalGoal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Deposit Amount (₹) *</label>
                <div className="input-currency-wrapper">
                  <span className="currency-prefix">₹</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    className="form-input currency-input"
                    placeholder="5000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <p className="form-help-hint">
                  ✨ This deposit will be automatically recorded as an Expense under &quot;Savings Deposit&quot;, reducing your cash balance to reflect money moved into savings.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Deduct From (Payment Method)</label>
                <select
                  className="form-select"
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.target.value)}
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
                  placeholder="e.g. Monthly emergency contribution, bonus deposit..."
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  maxLength={200}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDepositModalGoal(null)}
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
                      <Loader2 size={16} className="spinner" /> Adding...
                    </>
                  ) : (
                    <span>Add to Savings (- Balance)</span>
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

export default SavingsView;
