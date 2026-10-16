import React from 'react';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  HelpCircle,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

const getPaymentIcon = (method) => {
  switch (method) {
    case 'Cash':
      return <Banknote size={13} aria-hidden="true" />;
    case 'Credit Card':
    case 'Debit Card':
      return <CreditCard size={13} aria-hidden="true" />;
    case 'UPI':
      return <Smartphone size={13} aria-hidden="true" />;
    case 'Bank Transfer':
      return <Building2 size={13} aria-hidden="true" />;
    default:
      return <HelpCircle size={13} aria-hidden="true" />;
  }
};

const TransactionItem = ({ transaction, onEdit, onDelete }) => {
  const isIncome = transaction.type === 'income';

  return (
    <article className="transaction-row" tabIndex={0}>
      {/* Type indicator & Category */}
      <div className="tx-main-col">
        <div
          className={`tx-type-icon-box ${isIncome ? 'income' : 'expense'}`}
          aria-label={isIncome ? 'Income transaction' : 'Expense transaction'}
        >
          {isIncome ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}
        </div>
        <div className="tx-details">
          <div className="tx-header-line">
            <span className="tx-category-name">{transaction.category}</span>
            <span className={`badge ${isIncome ? 'badge-income' : 'badge-expense'}`}>
              {isIncome ? 'Income' : 'Expense'}
            </span>
            <span className="badge badge-neutral payment-badge" title={`Paid via ${transaction.paymentMethod}`}>
              {getPaymentIcon(transaction.paymentMethod)}
              <span>{transaction.paymentMethod}</span>
            </span>
          </div>
          {transaction.note && (
            <p className="tx-note" title={transaction.note}>
              <FileText size={12} className="tx-note-icon" aria-hidden="true" />
              <span>{transaction.note}</span>
            </p>
          )}
        </div>
      </div>

      {/* Date */}
      <div className="tx-date-col">
        <time dateTime={transaction.date} className="tx-date">
          {formatDate(transaction.date)}
        </time>
      </div>

      {/* Amount & Actions */}
      <div className="tx-right-col">
        <div className={`tx-amount ${isIncome ? 'amount-income' : 'amount-expense'}`}>
          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
        </div>

        <div className="tx-actions">
          <button
            type="button"
            className="btn-icon tx-action-btn edit"
            onClick={() => onEdit(transaction)}
            title="Edit transaction"
            aria-label={`Edit ${transaction.category} transaction`}
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            className="btn-icon tx-action-btn delete"
            onClick={() => onDelete(transaction)}
            title="Delete transaction"
            aria-label={`Delete ${transaction.category} transaction`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default TransactionItem;
