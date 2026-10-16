import React from 'react';
import { Receipt, SearchX, Plus, RefreshCw } from 'lucide-react';

const EmptyState = ({ isFiltered, onClearFilters, onAddTransaction }) => {
  return (
    <div className="empty-state-card" role="status">
      <div className="empty-state-icon-box" aria-hidden="true">
        {isFiltered ? <SearchX size={32} /> : <Receipt size={32} />}
      </div>
      <h3 className="empty-state-title">
        {isFiltered ? 'No matching transactions' : 'No transactions recorded yet'}
      </h3>
      <p className="empty-state-desc">
        {isFiltered
          ? 'No transactions match your current search and filter criteria. Try adjusting your query or resetting filters.'
          : 'Keep track of your cash flow by logging your first income deposit or daily expense.'}
      </p>
      <div className="empty-state-actions">
        {isFiltered ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClearFilters}
          >
            <RefreshCw size={15} />
            <span>Reset Active Filters</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onAddTransaction}
          >
            <Plus size={16} />
            <span>Record First Transaction</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
