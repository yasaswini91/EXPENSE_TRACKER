import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor to format error messages
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let customMessage = 'An unexpected network error occurred';
    if (error.response) {
      if (error.response.data && error.response.data.message) {
        customMessage = error.response.data.message;
      }
      if (error.response.data && error.response.data.errors) {
        const errorDetails = error.response.data.errors
          .map((e) => e.message || `${e.field}: invalid`)
          .join(', ');
        customMessage = `${customMessage}: ${errorDetails}`;
      }
    } else if (error.request) {
      customMessage = 'Unable to connect to the backend server. Please ensure the API is running.';
    }
    const enhancedError = new Error(customMessage);
    enhancedError.response = error.response;
    return Promise.reject(enhancedError);
  }
);

export const api = {
  // Transactions
  getTransactions: async ({ month, type, category, search, page = 1, limit = 100 } = {}) => {
    const params = {};
    if (month) params.month = month;
    if (type && type !== 'all') params.type = type;
    if (category && category !== 'all') params.category = category;
    if (search && search.trim()) params.search = search.trim();
    if (page) params.page = page;
    if (limit) params.limit = limit;

    const res = await apiClient.get('/transactions', { params });
    return res.data;
  },

  getSummary: async (month) => {
    const params = month ? { month } : {};
    const res = await apiClient.get('/transactions/summary', { params });
    return res.data;
  },

  createTransaction: async (data) => {
    const res = await apiClient.post('/transactions', data);
    return res.data;
  },

  updateTransaction: async (id, data) => {
    const res = await apiClient.put(`/transactions/${id}`, data);
    return res.data;
  },

  deleteTransaction: async (id) => {
    const res = await apiClient.delete(`/transactions/${id}`);
    return res.data;
  },

  // Savings Goals
  getSavings: async () => {
    const res = await apiClient.get('/savings');
    return res.data;
  },

  createSavingsGoal: async (data) => {
    const res = await apiClient.post('/savings', data);
    return res.data;
  },

  updateSavingsGoal: async (id, data) => {
    const res = await apiClient.put(`/savings/${id}`, data);
    return res.data;
  },

  deleteSavingsGoal: async (id) => {
    const res = await apiClient.delete(`/savings/${id}`);
    return res.data;
  },

  addSavingsDeposit: async (id, depositData) => {
    const payload =
      typeof depositData === 'object' ? depositData : { depositAmount: depositData };
    const res = await apiClient.patch(`/savings/${id}/deposit`, payload);
    return res.data;
  },

  // Loans & EMIs
  getLoans: async () => {
    const res = await apiClient.get('/loans');
    return res.data;
  },

  createLoan: async (data) => {
    const res = await apiClient.post('/loans', data);
    return res.data;
  },

  updateLoan: async (id, data) => {
    const res = await apiClient.put(`/loans/${id}`, data);
    return res.data;
  },

  deleteLoan: async (id) => {
    const res = await apiClient.delete(`/loans/${id}`);
    return res.data;
  },

  payEmi: async (id) => {
    const res = await apiClient.post(`/loans/${id}/pay-emi`);
    return res.data;
  },

  // Debts & IOUs (You Owe / Owed to You)
  getDebts: async () => {
    const res = await apiClient.get('/debts');
    return res.data;
  },

  createDebt: async (data) => {
    const res = await apiClient.post('/debts', data);
    return res.data;
  },

  updateDebt: async (id, data) => {
    const res = await apiClient.put(`/debts/${id}`, data);
    return res.data;
  },

  deleteDebt: async (id) => {
    const res = await apiClient.delete(`/debts/${id}`);
    return res.data;
  },

  toggleSettleDebt: async (id) => {
    const res = await apiClient.patch(`/debts/${id}/settle`);
    return res.data;
  },

  recordDebtPayment: async (id, { paymentAmount, paymentMethod, note }) => {
    const res = await apiClient.post(`/debts/${id}/payment`, {
      paymentAmount,
      paymentMethod,
      note,
    });
    return res.data;
  },

  // Health check
  checkHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },
};

export default api;
