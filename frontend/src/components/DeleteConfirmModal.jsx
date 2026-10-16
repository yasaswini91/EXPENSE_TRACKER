import React, { useEffect } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

const DeleteConfirmModal = ({
  isOpen,
  transaction,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !transaction) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
      role="presentation"
    >
      <div
        className="modal-content delete-modal-content"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
      >
        <div className="delete-modal-body">
          <div className="delete-icon-box" aria-hidden="true">
            <AlertTriangle size={24} className="delete-warn-icon" />
          </div>

          <div className="delete-text-group">
            <h2 id="delete-dialog-title" className="delete-title">
              Delete Transaction?
            </h2>
            <p id="delete-dialog-desc" className="delete-desc">
              Are you sure you want to permanently delete this transaction? This action will update your monthly summary calculations.
            </p>

            <div className="delete-item-preview">
              <div className="preview-row">
                <span className="preview-label">Category:</span>
                <span className="preview-value">{transaction.category}</span>
              </div>
              <div className="preview-row">
                <span className="preview-label">Amount:</span>
                <span className="preview-value">
                  {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                </span>
              </div>
              <div className="preview-row">
                <span className="preview-label">Date:</span>
                <span className="preview-value">{formatDate(transaction.date)}</span>
              </div>
              {transaction.note && (
                <div className="preview-row">
                  <span className="preview-label">Note:</span>
                  <span className="preview-value note">{transaction.note}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer delete-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="spinner" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Permanently</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
