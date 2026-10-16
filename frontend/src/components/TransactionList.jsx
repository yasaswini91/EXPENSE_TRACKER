import React from 'react';
import TransactionItem from './TransactionItem';
import EmptyState from './EmptyState';

const TransactionList = ({
  transactions = [],
  isLoading,
  isFiltered,
  onClearFilters,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  if (isLoading) {
    return (
      <div className="card tx-list-card">
        <div className="tx-list-header">
          <h2 className="tx-list-title">Transactions</h2>
        </div>
        <div className="tx-skeleton-list" aria-busy="true" aria-label="Loading transactions">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="tx-skeleton-row">
              <div className="tx-skeleton-circle" />
              <div className="tx-skeleton-text-group">
                <div className="tx-skeleton-line short" />
                <div className="tx-skeleton-line long" />
              </div>
              <div className="tx-skeleton-amount" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="card tx-list-card">
        <div className="tx-list-header">
          <h2 className="tx-list-title">Transactions</h2>
        </div>
        <EmptyState
          isFiltered={isFiltered}
          onClearFilters={onClearFilters}
          onAddTransaction={onAddTransaction}
        />
      </div>
    );
  }

  return (
    <div className="card tx-list-card">
      <div className="tx-list-header">
        <div className="tx-title-wrapper">
          <h2 className="tx-list-title">Transactions</h2>
          <span className="tx-count-pill">{transactions.length}</span>
        </div>
      </div>

      <div className="tx-list-container" role="feed" aria-label="Monthly transaction records">
        {transactions.map((tx) => (
          <TransactionItem
            key={tx._id}
            transaction={tx}
            onEdit={onEditTransaction}
            onDelete={onDeleteTransaction}
          />
        ))}
      </div>
    </div>
  );
};

export default TransactionList;
