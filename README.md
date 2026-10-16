# Expense Tracker — Full-Stack MERN Financial Management System

A comprehensive financial tracking web application built with **MongoDB**, **Express.js**, **React.js**, and **Node.js** (MERN). The application provides complete personal financial management: income and expense tracking, savings goals, loan & EMI obligations, dues & IOUs (payables/receivables), and interactive analytics.

---

## Where Is All the Data Stored?

All data in this application is stored locally in your **MongoDB** database instance:

1. **Database Engine**: **MongoDB Server 8.2** (running locally as a Windows Service `MongoDB` on port `27017`).
2. **Database Name**: `expense_tracker` (configured in `backend/.env` as `mongodb://127.0.0.1:27017/expense_tracker`).
3. **Physical Disk Location**:
   ```
   C:\Program Files\MongoDB\Server\8.2\data
   ```
   *This directory contains the underlying WiredTiger storage engine data files (`.wt` files) that hold your collections, documents, and indexes.*
4. **Collections Stored in the Database**:
   - `transactions` — Stores all income deposits, daily expenses, custom categories, dates, payment methods, and notes.
   - `savingsgoals` — Stores your savings targets, accumulated funds, target completion dates, and progress.
   - `loans` — Stores active and closed loans/EMIs, total loan amounts, monthly EMI obligations, due days, and remaining balances.
   - `debts` — Stores money you owe to others (`you_owe`) and money others owe to you (`they_owe`), descriptions, due dates, and settlement timestamps.
5. **How to View Your Raw Data**:
   - **MongoDB Compass (GUI)**: Connect to `mongodb://localhost:27017` and open the `expense_tracker` database.
   - **MongoDB Shell (`mongosh`)**:
     ```bash
     mongosh mongodb://127.0.0.1:27017/expense_tracker
     db.transactions.find().pretty()
     db.savingsgoals.find().pretty()
     db.loans.find().pretty()
     db.debts.find().pretty()
     ```

---

## Visual Design & Aesthetics

- **Human-Designed Financial Aesthetic**: Warm off-white backgrounds (`#FAF9F5`), crisp charcoal typography (`#1C201D`), and muted forest green (`#2B5742`) and sage accents.
- **Thoughtful Financial Semantics**: Muted terracotta (`#B04235`) for outflows/debts and deep forest green (`#266346`) for inflows/savings.
- **Lucide Icons**: Uniform iconography (`lucide-react`) across all headers, cards, form controls, and modals.
- **Zero Distractions**: No neon colors, no emojis, no glassmorphism, and no cartoon illustrations.
- **Responsive Layout**: Designed for mobile devices, tablets, and desktop displays.

---

## Application Modules & Features

### 1. Overview & Cash Flow (Transactions & Charts)
- **Summary Cards**: Selected-month Total Income, Total Expenses, and Period Net Cash Flow (with tooltips clarifying cash flow vs. overall bank balance).
- **Interactive Recharts**:
  - *Inflow vs. Outflow Comparison*: Bar chart with toggle for a daily timeline breakdown.
  - *Expenses by Category*: Donut chart with center total and detailed percentage legend.
- **Transaction CRUD**:
  - Record and edit amounts, types, categories, payment methods, and notes.
  - **Custom "Other Expense" / "Other Income" specification**: When a user selects `Other Expense` or `Other Income`, a dedicated text box appears allowing them to write the exact category or type of transaction (e.g., Gym Membership, Pet Care, Freelance Bonus).
- **Filters & Search**:
  - Month navigator with previous/next controls, month picker, and return to current month.
  - Filter by `All Types`, `Expenses`, or `Income`.
  - Filter by category and search across notes or categories.

### 2. Savings Goals Tracker
- Define savings milestones (e.g., Emergency Fund, New Laptop, Vacation, Retirement).
- Track total accumulated savings vs. target objectives.
- Visual progress bars showing percentage completed.
- **Add Deposit**: One-click modal to add funds to any savings goal, updating accumulated totals and progress.

### 3. Loans & EMI Tracker
- Track long-term obligations (e.g., Car Loan, Gadget EMI, Home Loan, Personal Loan).
- Tracks lender name, total loan amount, monthly EMI amount, and due day of the month (e.g., "Due on 5th of each month").
- Progress bar displaying percentage of loan repaid.
- **Pay Monthly EMI**: Automatically deducts the monthly EMI from the remaining loan balance, decrements remaining installments, and marks the loan as "Closed / Paid" once the balance reaches zero.

### 4. Dues & IOUs Tracker (Payables & Receivables)
- Track money you have to pay back to others (`You Owe`) and money others have to pay back to you (`Owed to You`).
- Cards display person name, amount, due date, and description/reason.
- Summary cards showing Total You Owe, Total Owed to You, and Net Position.
- **One-Click Settle**: Toggle status between "Pending" and "Settled", preserving a settled history log.

---

## REST API Specification

Base URL: `http://localhost:5000/api`

### Transactions
- `GET /api/transactions?month=YYYY-MM&type=...&category=...&search=...` — List transactions for month.
- `GET /api/transactions/summary?month=YYYY-MM` — Monthly aggregates via MongoDB aggregation pipelines.
- `POST /api/transactions` — Create transaction (supports custom "Other: [Custom Category]").
- `PUT /api/transactions/:id` — Update transaction.
- `DELETE /api/transactions/:id` — Delete transaction.

### Savings Goals
- `GET /api/savings` — List all savings goals and overall progress summary.
- `POST /api/savings` — Create new savings goal (`title`, `targetAmount`, `currentAmount`, `category`, `targetDate`, `note`).
- `PUT /api/savings/:id` — Update savings goal.
- `DELETE /api/savings/:id` — Delete savings goal.
- `PATCH /api/savings/:id/deposit` — Add deposit amount directly to a goal.

### Loans & EMIs
- `GET /api/loans` — List loans and calculate total outstanding debt and monthly EMI commitments.
- `POST /api/loans` — Create new loan (`title`, `lender`, `totalAmount`, `monthlyEmi`, `dueDay`, `remainingAmount`, `totalTenureMonths`).
- `PUT /api/loans/:id` — Update loan details.
- `DELETE /api/loans/:id` — Delete loan record.
- `POST /api/loans/:id/pay-emi` — Deduct monthly EMI from remaining balance and tenure.

### Dues & IOUs
- `GET /api/debts` — List dues and calculate total you owe, total owed to you, and net due balance.
- `POST /api/debts` — Create due (`personName`, `type`: `you_owe` | `they_owe`, `amount`, `description`, `dueDate`).
- `PUT /api/debts/:id` — Update due details.
- `DELETE /api/debts/:id` — Delete due record.
- `PATCH /api/debts/:id/settle` — Toggle between pending and settled.

---

## Running the Application Locally

1. **Start the Backend**:
   ```bash
   cd backend
   npm run dev
   ```
   *Runs on `http://localhost:5000` and connects to local MongoDB.*

2. **Start the Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   *Runs on `http://127.0.0.1:5173` (with `/api` proxied to port 5000).*

3. **Run Automated Tests**:
   ```bash
   cd backend
   npm test
   ```
   *Runs 18 automated tests covering CRUD, validations, summary aggregations, savings deposits, loan payments, and debt settlements.*
