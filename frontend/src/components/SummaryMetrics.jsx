import React from 'react';
import { TrendingUp, TrendingDown, Scale, Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { getMonthName } from '../utils/constants';

const SummaryMetrics = ({ summary, selectedMonth, isLoading }) => {
  const {
    totalIncome = 0,
    totalExpenses = 0,
    netBalance = 0,
    transactionCount = 0,
    incomeCount = 0,
    expenseCount = 0,
    balanceNote = 'Period net balance = income minus expenses. This is cash flow for the selected period, not an overall bank balance.',
  } = summary || {};

  const isNetPositive = netBalance >= 0;

  return (
    <section className="summary-section" aria-label="Monthly Financial Summary">
      <div className="summary-grid">
        {/* Income Card */}
        <div className="card stat-card income-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Income</span>
            <div className="stat-icon-wrapper income-icon-bg" aria-hidden="true">
              <TrendingUp size={18} className="income-icon" />
            </div>
          </div>
          <div className="stat-value">
            {isLoading ? (
              <span className="skeleton-line" />
            ) : (
              formatCurrency(totalIncome)
            )}
          </div>
          <div className="stat-footer">
            <span className="stat-badge income-badge">
              <ArrowUpRight size={13} />
              {incomeCount} {incomeCount === 1 ? 'deposit' : 'deposits'}
            </span>
            <span className="stat-period">in {getMonthName(selectedMonth)}</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="card stat-card expense-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Expenses</span>
            <div className="stat-icon-wrapper expense-icon-bg" aria-hidden="true">
              <TrendingDown size={18} className="expense-icon" />
            </div>
          </div>
          <div className="stat-value">
            {isLoading ? (
              <span className="skeleton-line" />
            ) : (
              formatCurrency(totalExpenses)
            )}
          </div>
          <div className="stat-footer">
            <span className="stat-badge expense-badge">
              <ArrowDownRight size={13} />
              {expenseCount} {expenseCount === 1 ? 'expense' : 'expenses'}
            </span>
            <span className="stat-period">in {getMonthName(selectedMonth)}</span>
          </div>
        </div>

        {/* Period Net Balance Card */}
        <div className={`card stat-card balance-card ${isNetPositive ? 'positive' : 'negative'}`}>
          <div className="stat-card-header">
            <div className="stat-label-with-info">
              <span className="stat-label">Period Net Balance</span>
              <div className="info-tooltip-container" tabIndex={0} role="note" aria-label="Explanation of net balance">
                <Info size={14} className="info-trigger" />
                <span className="tooltip-bubble">{balanceNote}</span>
              </div>
            </div>
            <div className="stat-icon-wrapper balance-icon-bg" aria-hidden="true">
              <Scale size={18} className="balance-icon" />
            </div>
          </div>
          <div className={`stat-value ${isNetPositive ? 'balance-positive' : 'balance-negative'}`}>
            {isLoading ? (
              <span className="skeleton-line" />
            ) : (
              formatCurrency(netBalance)
            )}
          </div>
          <div className="stat-footer">
            <span className="stat-note">
              {transactionCount === 0
                ? 'No transactions this month'
                : `${transactionCount} total recorded transactions`}
            </span>
            <span className="stat-disclaimer">Period cash flow</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SummaryMetrics;
