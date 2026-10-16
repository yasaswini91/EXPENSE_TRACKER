import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Wallet,
  Receipt,
  PiggyBank,
  Landmark,
  HandCoins,
} from 'lucide-react';
import { getMonthName, getCurrentMonth } from '../utils/constants';

const Header = ({
  activeTab,
  onTabChange,
  selectedMonth,
  onMonthChange,
  onOpenCreateModal,
  pendingDebtsCount = 0,
  activeLoansCount = 0,
}) => {
  // Navigation for previous month
  const handlePrevMonth = () => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) - 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    const newMonthStr = `${year}-${String(month).padStart(2, '0')}`;
    onMonthChange(newMonthStr);
  };

  // Navigation for next month
  const handleNextMonth = () => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) + 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    const newMonthStr = `${year}-${String(month).padStart(2, '0')}`;
    onMonthChange(newMonthStr);
  };

  const isCurrentMonth = selectedMonth === getCurrentMonth();

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Brand identity */}
        <div className="brand-section">
          <div className="brand-logo" aria-hidden="true">
            <Wallet size={22} className="brand-icon" />
          </div>
          <div>
            <h1 className="brand-title">Expense Tracker</h1>
            <p className="brand-subtitle">Personal Financial Manager & Ledger</p>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <nav className="header-tabs" role="tablist" aria-label="Main Navigation">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'transactions'}
            className={`header-tab ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => onTabChange('transactions')}
          >
            <Receipt size={16} />
            <span>Overview & Flow</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'savings'}
            className={`header-tab ${activeTab === 'savings' ? 'active' : ''}`}
            onClick={() => onTabChange('savings')}
          >
            <PiggyBank size={16} />
            <span>Savings</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'loans'}
            className={`header-tab ${activeTab === 'loans' ? 'active' : ''}`}
            onClick={() => onTabChange('loans')}
          >
            <Landmark size={16} />
            <span>Loans & EMI</span>
            {activeLoansCount > 0 && (
              <span className="tab-badge" title={`${activeLoansCount} active loans`}>
                {activeLoansCount}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'debts'}
            className={`header-tab ${activeTab === 'debts' ? 'active' : ''}`}
            onClick={() => onTabChange('debts')}
          >
            <HandCoins size={16} />
            <span>Dues & IOUs</span>
            {pendingDebtsCount > 0 && (
              <span className="tab-badge warning" title={`${pendingDebtsCount} unsettled dues`}>
                {pendingDebtsCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Section: Month Navigator & New Transaction Action */}
        <div className="header-actions">
          {activeTab === 'transactions' && (
            <div className="month-navigator" aria-label="Month Navigation">
              <button
                type="button"
                className="btn-icon month-nav-btn"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                title="Go to previous month"
              >
                <ChevronLeft size={17} />
              </button>

              <div className="month-picker-wrapper">
                <label htmlFor="month-select" className="sr-only">
                  Select Month
                </label>
                <Calendar size={15} className="calendar-icon" aria-hidden="true" />
                <input
                  id="month-select"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => e.target.value && onMonthChange(e.target.value)}
                  className="month-input"
                  aria-label="Filter by month"
                />
                <span className="month-display-text">{getMonthName(selectedMonth)}</span>
              </div>

              <button
                type="button"
                className="btn-icon month-nav-btn"
                onClick={handleNextMonth}
                aria-label="Next month"
                title="Go to next month"
              >
                <ChevronRight size={17} />
              </button>

              {!isCurrentMonth && (
                <button
                  type="button"
                  className="btn btn-subtle btn-xs reset-month-btn"
                  onClick={() => onMonthChange(getCurrentMonth())}
                  title="Return to current month"
                >
                  Current
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary new-tx-btn"
            onClick={onOpenCreateModal}
          >
            <Plus size={16} />
            <span>New Transaction</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
