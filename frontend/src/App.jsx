import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import SummaryMetrics from './components/SummaryMetrics';
import ChartsSection from './components/ChartsSection';
import FiltersBar from './components/FiltersBar';
import TransactionList from './components/TransactionList';
import TransactionFormModal from './components/TransactionFormModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import SavingsView from './components/SavingsView';
import LoansView from './components/LoansView';
import DebtsView from './components/DebtsView';
import Toast from './components/Toast';
import { api } from './services/api';
import { getCurrentMonth } from './utils/constants';
import './App.css';

function App() {
  // Navigation tab: 'transactions' | 'savings' | 'loans' | 'debts'
  const [activeTab, setActiveTab] = useState('transactions');

  // Current active month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  // Data states
  const [transactions, setTransactions] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Badge counters for other tabs
  const [pendingDebtsCount, setPendingDebtsCount] = useState(0);
  const [activeLoansCount, setActiveLoansCount] = useState(0);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'income' | 'expense'
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal & form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formServerError, setFormServerError] = useState(null);

  // Delete modal state
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  // Fetch summary and transactions for current month
  const loadDashboardData = useCallback(
    async (monthToLoad) => {
      setIsLoading(true);
      try {
        const [summaryRes, txRes] = await Promise.all([
          api.getSummary(monthToLoad),
          api.getTransactions({
            month: monthToLoad,
            type: typeFilter !== 'all' ? typeFilter : undefined,
            category: categoryFilter !== 'all' ? categoryFilter : undefined,
            search: searchQuery.trim() || undefined,
          }),
        ]);

        if (summaryRes.success) {
          setMonthlySummary(summaryRes.data);
        }
        if (txRes.success) {
          setTransactions(txRes.data || []);
        }
      } catch (error) {
        showToast(error.message || 'Failed to load financial records', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [typeFilter, categoryFilter, searchQuery, showToast]
  );

  // Fetch badge stats (active loans, pending debts)
  const loadBadgeStats = useCallback(async () => {
    try {
      const [loansRes, debtsRes] = await Promise.all([
        api.getLoans().catch(() => null),
        api.getDebts().catch(() => null),
      ]);
      if (loansRes && loansRes.success && loansRes.data?.summary) {
        setActiveLoansCount(loansRes.data.summary.activeLoansCount || 0);
      }
      if (debtsRes && debtsRes.success && debtsRes.data?.summary) {
        const pending =
          (debtsRes.data.summary.pendingYouOweCount || 0) +
          (debtsRes.data.summary.pendingTheyOweCount || 0);
        setPendingDebtsCount(pending);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Re-fetch data on month or filter changes
  useEffect(() => {
    loadDashboardData(selectedMonth);
    loadBadgeStats();
  }, [selectedMonth, loadDashboardData, loadBadgeStats]);

  // Handle month selection
  const handleMonthChange = (newMonth) => {
    setSelectedMonth(newMonth);
  };

  // Reset active filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
  };

  // Calculate dynamic metrics if filters are active
  const isFiltered = searchQuery.trim() !== '' || typeFilter !== 'all' || categoryFilter !== 'all';

  const effectiveSummary = useMemo(() => {
    if (!monthlySummary) return null;

    if (!isFiltered) {
      return monthlySummary;
    }

    // When filters are active, compute metrics for the filtered view
    let filteredIncome = 0;
    let filteredExpenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    const catMap = {};

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        filteredIncome += tx.amount;
        incomeCount += 1;
      } else if (tx.type === 'expense') {
        filteredExpenses += tx.amount;
        expenseCount += 1;
        catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
      }
    });

    const netBalance = Number((filteredIncome - filteredExpenses).toFixed(2));
    const categoryBreakdown = Object.entries(catMap)
      .map(([cat, amount]) => ({
        category: cat,
        total: Number(amount.toFixed(2)),
        percentage: filteredExpenses > 0 ? Number(((amount / filteredExpenses) * 100).toFixed(1)) : 0,
        count: transactions.filter((t) => t.category === cat).length,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      ...monthlySummary,
      totalIncome: Number(filteredIncome.toFixed(2)),
      totalExpenses: Number(filteredExpenses.toFixed(2)),
      netBalance,
      transactionCount: transactions.length,
      incomeCount,
      expenseCount,
      categoryBreakdown,
      balanceNote:
        'Net balance for currently active filter set (Filtered Income - Filtered Expenses).',
    };
  }, [monthlySummary, transactions, isFiltered]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingTransaction(null);
    setFormServerError(null);
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (tx) => {
    setEditingTransaction(tx);
    setFormServerError(null);
    setIsFormOpen(true);
  };

  // Submit Transaction (Create or Update)
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    setFormServerError(null);
    try {
      if (editingTransaction) {
        await api.updateTransaction(editingTransaction._id, formData);
        showToast('Transaction updated successfully', 'success');
      } else {
        await api.createTransaction(formData);
        showToast('Transaction recorded successfully', 'success');
      }
      setIsFormOpen(false);
      setEditingTransaction(null);
      // Refresh dashboard
      await loadDashboardData(selectedMonth);
    } catch (error) {
      setFormServerError(error.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Confirmation Dialog
  const handleOpenDeleteModal = (tx) => {
    setDeletingTransaction(tx);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;
    setIsDeleting(true);
    try {
      await api.deleteTransaction(deletingTransaction._id);
      showToast('Transaction deleted successfully', 'success');
      setDeletingTransaction(null);
      await loadDashboardData(selectedMonth);
    } catch (error) {
      showToast(error.message || 'Failed to delete transaction', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="app-layout">
      {/* Top Navigation Bar with View Tabs */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
        onOpenCreateModal={handleOpenCreateModal}
        pendingDebtsCount={pendingDebtsCount}
        activeLoansCount={activeLoansCount}
      />

      {/* Main Container */}
      <main className="main-container">
        {activeTab === 'transactions' && (
          <>
            {/* Metric Summary Cards */}
            <SummaryMetrics
              summary={effectiveSummary}
              selectedMonth={selectedMonth}
              isLoading={isLoading}
            />

            {/* Financial Charts */}
            <ChartsSection
              summary={effectiveSummary}
              selectedMonth={selectedMonth}
              isLoading={isLoading}
            />

            {/* Filter & Search Bar */}
            <FiltersBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              typeFilter={typeFilter}
              onTypeChange={setTypeFilter}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              onResetFilters={handleResetFilters}
              totalResults={transactions.length}
            />

            {/* Transaction Records List */}
            <TransactionList
              transactions={transactions}
              isLoading={isLoading}
              isFiltered={isFiltered}
              onClearFilters={handleResetFilters}
              onAddTransaction={handleOpenCreateModal}
              onEditTransaction={handleOpenEditModal}
              onDeleteTransaction={handleOpenDeleteModal}
            />
          </>
        )}

        {activeTab === 'savings' && (
          <SavingsView
            showToast={showToast}
            onDataMutated={() => {
              loadDashboardData(selectedMonth);
              loadBadgeStats();
            }}
          />
        )}

        {activeTab === 'loans' && (
          <LoansView
            showToast={showToast}
            onDataMutated={() => {
              loadDashboardData(selectedMonth);
              loadBadgeStats();
            }}
          />
        )}

        {activeTab === 'debts' && (
          <DebtsView
            showToast={showToast}
            onDataMutated={() => {
              loadDashboardData(selectedMonth);
              loadBadgeStats();
            }}
          />
        )}
      </main>

      {/* Create / Edit Modal Dialog */}
      <TransactionFormModal
        isOpen={isFormOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsFormOpen(false);
            setEditingTransaction(null);
          }
        }}
        onSubmit={handleFormSubmit}
        initialData={editingTransaction}
        isSubmitting={isSubmitting}
        serverError={formServerError}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingTransaction)}
        transaction={deletingTransaction}
        onClose={() => {
          if (!isDeleting) setDeletingTransaction(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
