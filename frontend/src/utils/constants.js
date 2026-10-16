export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
};

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance & Consulting',
  'Investments & Dividends',
  'Business',
  'Gifts & Grants',
  'Rental Income',
  'Other Income',
];

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Housing & Rent',
  'Groceries',
  'Utilities & Bills',
  'Transportation',
  'Healthcare & Medical',
  'Entertainment & Leisure',
  'Shopping & Apparel',
  'Education',
  'Personal Care',
  'Debt & Loan',
  'Savings Deposit',
  'Other Expense',
];

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Other',
];

export const getCurrentMonth = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const getMonthName = (monthString) => {
  if (!monthString) return '';
  const [year, month] = monthString.split('-');
  const date = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, 1));
  return date.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

// Curated tasteful palette for financial charts (muted forest, sage, ochre, slate, terracotta)
export const CHART_PALETTE = [
  '#2D5A43', // Forest green
  '#5C8065', // Sage green
  '#99A88C', // Light sage
  '#C78B50', // Ochre / warm amber
  '#C46851', // Terracotta
  '#6D7993', // Muted slate
  '#8E8D8A', // Warm stone
  '#B26771', // Dusty mauve
  '#4E7982', // Ocean teal
  '#9B786F', // Cedar
  '#637081', // Steel
  '#78866B', // Olive
];
