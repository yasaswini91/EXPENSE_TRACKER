import React from 'react';
import { Search, Filter, X, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/constants';

const FiltersBar = ({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeChange,
  categoryFilter,
  onCategoryChange,
  onResetFilters,
  totalResults,
}) => {
  // Determine relevant categories based on current type filter
  let availableCategories = [];
  if (typeFilter === 'income') {
    availableCategories = INCOME_CATEGORIES;
  } else if (typeFilter === 'expense') {
    availableCategories = EXPENSE_CATEGORIES;
  } else {
    // Both
    availableCategories = Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])).sort();
  }

  const isFiltered = searchQuery.trim() !== '' || typeFilter !== 'all' || categoryFilter !== 'all';

  return (
    <div className="filters-bar" aria-label="Transaction Filters">
      <div className="filters-row">
        {/* Search input */}
        <div className="search-field-wrapper">
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            className="search-input"
            placeholder="Search notes or categories..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search transactions"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Type Toggle Pills */}
        <div className="type-filter-group" role="group" aria-label="Filter by transaction type">
          <button
            type="button"
            className={`type-filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              onTypeChange('all');
              // If current category is not valid for all, reset category
              if (categoryFilter !== 'all') onCategoryChange('all');
            }}
          >
            All Types
          </button>
          <button
            type="button"
            className={`type-filter-btn expense-btn ${typeFilter === 'expense' ? 'active' : ''}`}
            onClick={() => {
              onTypeChange('expense');
              if (categoryFilter !== 'all' && !EXPENSE_CATEGORIES.includes(categoryFilter)) {
                onCategoryChange('all');
              }
            }}
          >
            <ArrowDownRight size={14} />
            <span>Expenses</span>
          </button>
          <button
            type="button"
            className={`type-filter-btn income-btn ${typeFilter === 'income' ? 'active' : ''}`}
            onClick={() => {
              onTypeChange('income');
              if (categoryFilter !== 'all' && !INCOME_CATEGORIES.includes(categoryFilter)) {
                onCategoryChange('all');
              }
            }}
          >
            <ArrowUpRight size={14} />
            <span>Income</span>
          </button>
        </div>

        {/* Category Dropdown */}
        <div className="category-select-wrapper">
          <Filter size={15} className="filter-select-icon" aria-hidden="true" />
          <select
            className="category-select"
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Reset / Status */}
        {isFiltered && (
          <button
            type="button"
            className="btn btn-subtle btn-sm reset-filter-btn"
            onClick={onResetFilters}
            title="Reset all active filters"
          >
            <X size={14} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      <div className="filter-results-info">
        <span className="results-count">
          Showing <strong>{totalResults}</strong> {totalResults === 1 ? 'transaction' : 'transactions'}
        </span>
      </div>
    </div>
  );
};

export default FiltersBar;
