/**
 * Formats a numeric value into currency with standard commas and decimals
 */
export const formatCurrency = (amount, currencySymbol = '₹') => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${currencySymbol}0.00`;
  }
  const numeric = Number(amount);
  const formatted = numeric.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currencySymbol}${formatted}`;
};

/**
 * Formats an ISO date string or Date object into human-readable date
 * e.g. "15 Oct 2026"
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Formats date into "YYYY-MM-DD" for HTML date input values
 */
export const formatDateForInput = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats percentage value
 */
export const formatPercentage = (value) => {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  return `${Number(value).toFixed(1)}%`;
};
