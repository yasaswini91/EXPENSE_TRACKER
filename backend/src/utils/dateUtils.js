/**
 * Validates and parses a YYYY-MM string into inclusive start and exclusive end Date boundaries.
 * Using [startDate, endDate) ensures every millisecond of the month is captured,
 * including leap years and 30/31-day months, without timezone drift edge cases.
 *
 * @param {string} monthStr - Month in 'YYYY-MM' format (e.g. '2026-10')
 * @returns {{ startDate: Date, endDate: Date, year: number, month: number, monthString: string }}
 */
export const getMonthDateRange = (monthStr) => {
  const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
  let year;
  let month; // 1-indexed

  if (monthStr && regex.test(monthStr)) {
    const parts = monthStr.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
  } else {
    // Default to current date in UTC
    const now = new Date();
    year = now.getUTCFullYear();
    month = now.getUTCMonth() + 1;
  }

  // Start of the month: Year, Month - 1, Day 1 at 00:00:00.000Z
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));

  // End boundary: Exactly start of next month (Day 1 at 00:00:00.000Z)
  // For queries, use $gte: startDate, $lt: endDate
  const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  const padMonth = month.toString().padStart(2, '0');
  const formattedMonth = `${year}-${padMonth}`;

  return {
    startDate,
    endDate,
    year,
    month,
    monthString: formattedMonth,
  };
};

/**
 * Returns current month in YYYY-MM format
 */
export const getCurrentMonthString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};
