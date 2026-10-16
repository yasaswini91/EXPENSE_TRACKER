import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { PieChart as PieIcon, BarChart3, TrendingUp } from 'lucide-react';
import { CHART_PALETTE, getMonthName } from '../utils/constants';
import { formatCurrency, formatPercentage } from '../utils/formatters';

// Custom tooltip for comparison Bar Chart
const ComparisonTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-title">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="tooltip-row">
            <span
              className="tooltip-dot"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="tooltip-name">{entry.name}:</span>
            <span className="tooltip-val">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom tooltip for Pie Chart
const CategoryPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-title">{data.category}</p>
        <div className="tooltip-row">
          <span
            className="tooltip-dot"
            style={{ backgroundColor: payload[0].color || payload[0].fill }}
          />
          <span className="tooltip-name">Amount:</span>
          <span className="tooltip-val">{formatCurrency(data.total)}</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-name">Share of Expenses:</span>
          <span className="tooltip-val">{formatPercentage(data.percentage)}</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-name">Transactions:</span>
          <span className="tooltip-val">{data.count}</span>
        </div>
      </div>
    );
  }
  return null;
};

const ChartsSection = ({ summary, selectedMonth, isLoading }) => {
  const [chartView, setChartView] = useState('monthly'); // 'monthly' | 'daily'
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const {
    totalIncome = 0,
    totalExpenses = 0,
    categoryBreakdown = [],
    dailyTrend = [],
  } = summary || {};

  // Data for Income vs Expense Overview
  const comparisonData = [
    {
      period: getMonthName(selectedMonth),
      Income: totalIncome,
      Expenses: totalExpenses,
    },
  ];

  // Daily Trend Data (formatted dates)
  const formattedDailyData = dailyTrend.map((d) => {
    const day = d.date.split('-')[2];
    return {
      day: `${parseInt(day, 10)}th`,
      Income: d.income,
      Expenses: d.expense,
    };
  });

  const hasData = totalIncome > 0 || totalExpenses > 0;
  const hasExpenses = categoryBreakdown.length > 0;

  return (
    <section className="charts-section" aria-label="Financial Charts">
      <div className="charts-grid">
        {/* Chart 1: Income vs Expenses Comparison */}
        <div className="card chart-card">
          <div className="chart-header">
            <div className="chart-title-group">
              <div className="chart-icon-box" aria-hidden="true">
                <BarChart3 size={17} />
              </div>
              <div>
                <h2 className="chart-heading">Cash Inflow vs Outflow</h2>
                <p className="chart-subheading">
                  {chartView === 'monthly'
                    ? `Total totals for ${getMonthName(selectedMonth)}`
                    : `Daily breakdown for ${getMonthName(selectedMonth)}`}
                </p>
              </div>
            </div>

            {dailyTrend.length > 1 && (
              <div className="chart-toggle-group" role="tablist">
                <button
                  type="button"
                  className={`toggle-tab ${chartView === 'monthly' ? 'active' : ''}`}
                  onClick={() => setChartView('monthly')}
                >
                  Totals
                </button>
                <button
                  type="button"
                  className={`toggle-tab ${chartView === 'daily' ? 'active' : ''}`}
                  onClick={() => setChartView('daily')}
                >
                  Daily Timeline
                </button>
              </div>
            )}
          </div>

          <div className="chart-body">
            {!hasData && !isLoading ? (
              <div className="chart-empty-state">
                <p>No transactions available for this month</p>
                <span className="chart-empty-hint">Add an income or expense to see the chart</span>
              </div>
            ) : chartView === 'monthly' ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={comparisonData}
                    margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                    barGap={16}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBE9E2" />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={{ stroke: '#E2DFD7' }}
                      tick={{ fill: '#6B726C', fontSize: 13 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                      tick={{ fill: '#6B726C', fontSize: 12 }}
                    />
                    <Tooltip content={<ComparisonTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ paddingBottom: '16px', fontSize: '13px' }}
                    />
                    <Bar
                      dataKey="Income"
                      fill="#2B5742"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={64}
                    />
                    <Bar
                      dataKey="Expenses"
                      fill="#B04235"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={64}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={formattedDailyData}
                    margin={{ top: 20, right: 10, left: 5, bottom: 5 }}
                    barGap={4}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBE9E2" />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={{ stroke: '#E2DFD7' }}
                      tick={{ fill: '#6B726C', fontSize: 11 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                      tick={{ fill: '#6B726C', fontSize: 11 }}
                    />
                    <Tooltip content={<ComparisonTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                    />
                    <Bar
                      dataKey="Income"
                      fill="#2B5742"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={20}
                    />
                    <Bar
                      dataKey="Expenses"
                      fill="#B04235"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Category-wise Expense Breakdown */}
        <div className="card chart-card">
          <div className="chart-header">
            <div className="chart-title-group">
              <div className="chart-icon-box" aria-hidden="true">
                <PieIcon size={17} />
              </div>
              <div>
                <h2 className="chart-heading">Expenses by Category</h2>
                <p className="chart-subheading">
                  Spending distribution across {categoryBreakdown.length} {categoryBreakdown.length === 1 ? 'category' : 'categories'}
                </p>
              </div>
            </div>
            {hasExpenses && (
              <span className="badge badge-neutral">
                {formatCurrency(totalExpenses)} Total
              </span>
            )}
          </div>

          <div className="chart-body">
            {!hasExpenses && !isLoading ? (
              <div className="chart-empty-state">
                <p>No expense transactions recorded</p>
                <span className="chart-empty-hint">Category spending will appear here</span>
              </div>
            ) : (
              <div className="pie-chart-layout">
                <div className="pie-wrapper">
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart onMouseLeave={() => setHoveredSlice(null)}>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="total"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={88}
                        paddingAngle={3}
                        animationDuration={600}
                        onMouseEnter={(data) => setHoveredSlice(data)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                            stroke="#FFFFFF"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CategoryPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center donut label (hidden on hover to prevent overlap) */}
                  <div className={`donut-center-label ${hoveredSlice ? 'is-hidden' : ''}`}>
                    <span className="donut-center-title">Spent</span>
                    <span className="donut-center-amount">{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="category-legend-list" role="list" aria-label="Category percentage breakdown">
                  {categoryBreakdown.map((item, index) => {
                    const color = CHART_PALETTE[index % CHART_PALETTE.length];
                    return (
                      <div key={item.category} className="category-legend-item" role="listitem">
                        <div className="legend-label-col">
                          <span className="legend-color-dot" style={{ backgroundColor: color }} />
                          <span className="legend-category-name" title={item.category}>
                            {item.category}
                          </span>
                        </div>
                        <div className="legend-value-col">
                          <span className="legend-amount">{formatCurrency(item.total)}</span>
                          <span className="legend-percent">{formatPercentage(item.percentage)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChartsSection;
