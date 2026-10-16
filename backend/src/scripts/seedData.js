/**
 * Generates realistic sample transactions for the current month and previous month
 */
export const getSeedData = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Helper to construct a Date in current or previous month
  const makeDate = (year, month, day, hour = 12) => {
    return new Date(Date.UTC(year, month, day, hour, 0, 0));
  };

  const currentMonthDays = [
    {
      amount: 45000,
      type: 'income',
      category: 'Salary',
      date: makeDate(currentYear, currentMonth, 1, 9),
      paymentMethod: 'Bank Transfer',
      note: 'Monthly salary credit from TechCorp',
    },
    {
      amount: 14000,
      type: 'expense',
      category: 'Housing & Rent',
      date: makeDate(currentYear, currentMonth, 2, 10),
      paymentMethod: 'Bank Transfer',
      note: 'Apartment monthly rent',
    },
    {
      amount: 3200,
      type: 'expense',
      category: 'Groceries',
      date: makeDate(currentYear, currentMonth, 4, 17),
      paymentMethod: 'UPI',
      note: 'Weekly organic groceries at Nature Basket',
    },
    {
      amount: 1250,
      type: 'expense',
      category: 'Utilities & Bills',
      date: makeDate(currentYear, currentMonth, 5, 11),
      paymentMethod: 'Debit Card',
      note: 'High-speed fiber broadband bill',
    },
    {
      amount: 850,
      type: 'expense',
      category: 'Food & Dining',
      date: makeDate(currentYear, currentMonth, 7, 20),
      paymentMethod: 'UPI',
      note: 'Dinner with college friends at Olive Bistro',
    },
    {
      amount: 12000,
      type: 'income',
      category: 'Freelance & Consulting',
      date: makeDate(currentYear, currentMonth, 9, 14),
      paymentMethod: 'Bank Transfer',
      note: 'Milestone 1 payment for mobile app UI design',
    },
    {
      amount: 450,
      type: 'expense',
      category: 'Transportation',
      date: makeDate(currentYear, currentMonth, 10, 8),
      paymentMethod: 'UPI',
      note: 'Metro monthly smartcard recharge',
    },
    {
      amount: 1800,
      type: 'expense',
      category: 'Healthcare & Medical',
      date: makeDate(currentYear, currentMonth, 12, 15),
      paymentMethod: 'Credit Card',
      note: 'Dental checkup and routine cleaning',
    },
    {
      amount: 2800,
      type: 'expense',
      category: 'Groceries',
      date: makeDate(currentYear, currentMonth, 14, 18),
      paymentMethod: 'UPI',
      note: 'Supermarket supplies and pantry staples',
    },
    {
      amount: 550,
      type: 'expense',
      category: 'Entertainment & Leisure',
      date: makeDate(currentYear, currentMonth, 15, 21),
      paymentMethod: 'Credit Card',
      note: 'Cinema tickets for weekend movie',
    },
    {
      amount: 2200,
      type: 'expense',
      category: 'Shopping & Apparel',
      date: makeDate(currentYear, currentMonth, 18, 16),
      paymentMethod: 'Credit Card',
      note: 'Winter jacket and everyday work shirts',
    },
    {
      amount: 600,
      type: 'expense',
      category: 'Food & Dining',
      date: makeDate(currentYear, currentMonth, 20, 13),
      paymentMethod: 'Cash',
      note: 'Café lunch and iced pour-over',
    },
    {
      amount: 4500,
      type: 'income',
      category: 'Investments & Dividends',
      date: makeDate(currentYear, currentMonth, 22, 11),
      paymentMethod: 'Bank Transfer',
      note: 'Quarterly index fund dividend payout',
    },
    {
      amount: 1500,
      type: 'expense',
      category: 'Utilities & Bills',
      date: makeDate(currentYear, currentMonth, 24, 10),
      paymentMethod: 'UPI',
      note: 'State electricity bill',
    },
  ];

  // Previous month items for trend comparison
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const prevMonthDays = [
    {
      amount: 45000,
      type: 'income',
      category: 'Salary',
      date: makeDate(prevYear, prevMonth, 1, 9),
      paymentMethod: 'Bank Transfer',
      note: 'Monthly salary credit',
    },
    {
      amount: 14000,
      type: 'expense',
      category: 'Housing & Rent',
      date: makeDate(prevYear, prevMonth, 2, 10),
      paymentMethod: 'Bank Transfer',
      note: 'Apartment monthly rent',
    },
    {
      amount: 5500,
      type: 'expense',
      category: 'Groceries',
      date: makeDate(prevYear, prevMonth, 6, 17),
      paymentMethod: 'UPI',
      note: 'Monthly grocery restocking',
    },
    {
      amount: 8000,
      type: 'income',
      category: 'Freelance & Consulting',
      date: makeDate(prevYear, prevMonth, 10, 14),
      paymentMethod: 'Bank Transfer',
      note: 'Frontend consulting hours',
    },
    {
      amount: 3400,
      type: 'expense',
      category: 'Food & Dining',
      date: makeDate(prevYear, prevMonth, 15, 20),
      paymentMethod: 'Debit Card',
      note: 'Family weekend dinner',
    },
    {
      amount: 2100,
      type: 'expense',
      category: 'Utilities & Bills',
      date: makeDate(prevYear, prevMonth, 20, 11),
      paymentMethod: 'UPI',
      note: 'Electricity and water bills',
    },
    {
      amount: 1200,
      type: 'expense',
      category: 'Transportation',
      date: makeDate(prevYear, prevMonth, 25, 9),
      paymentMethod: 'Cash',
      note: 'Cab rides and fuel refills',
    },
  ];

  return [...currentMonthDays, ...prevMonthDays];
};
