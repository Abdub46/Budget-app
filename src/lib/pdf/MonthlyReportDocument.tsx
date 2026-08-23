import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import type { IReport } from '@/models/Report';
import { formatCurrency, formatPercent, MONTH_NAMES } from '@/lib/utils';
import { CATEGORY_LABELS } from '@/lib/category-colors';
import type { CategoryType } from '@/types';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a2e' },
  header: { marginBottom: 20, borderBottom: '2 solid #2563eb', paddingBottom: 14 },
  brand: { fontSize: 10, color: '#2563eb', fontWeight: 700, marginBottom: 6 },
  userName: { fontSize: 12, color: '#4b5563' },
  title: { fontSize: 20, fontWeight: 700, marginTop: 4 },
  period: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { color: '#6b7280' },
  value: { fontWeight: 700 },
  divider: { borderBottom: '1 solid #e5e7eb', marginVertical: 10 },
  statusBadge: {
    marginTop: 6,
    padding: '4 8',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 700,
    alignSelf: 'flex-start',
  },
  statusAbove: { backgroundColor: '#fef3c7', color: '#92400e' },
  statusBelow: { backgroundColor: '#dbeafe', color: '#1e40af' },
  statusEqual: { backgroundColor: '#dcfce7', color: '#166534' },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottom: '1 solid #f3f4f6',
  },
  highlightBox: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  highlightCard: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  highlightLabel: { fontSize: 8, color: '#6b7280', textTransform: 'uppercase' },
  highlightValue: { fontSize: 12, fontWeight: 700, marginTop: 2 },
  insightItem: { flexDirection: 'row', marginBottom: 5 },
  bullet: { width: 10, color: '#2563eb' },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 8,
  },
});

const statusStyle = (status: 'above' | 'below' | 'equal') =>
  status === 'above' ? styles.statusAbove : status === 'below' ? styles.statusBelow : styles.statusEqual;

const statusText = (status: 'above' | 'below' | 'equal', amount: number, percent: number, currency: string) => {
  if (status === 'equal') return 'At Average — matches your registered average monthly budget';
  return `${formatCurrency(amount, currency)} ${status === 'above' ? 'above' : 'below'} average (${formatPercent(percent)})`;
};

interface MonthlyReportDocumentProps {
  userName: string;
  currency: string;
  month: number;
  year: number;
  snapshot: IReport['snapshot'];
}

export default function MonthlyReportDocument({
  userName,
  currency,
  month,
  year,
  snapshot,
}: MonthlyReportDocumentProps) {
  const monthName = MONTH_NAMES[month - 1];
  const periodStart = format(new Date(year, month - 1, 1), 'MMMM d');
  const periodEnd = format(new Date(year, month, 0), 'MMMM d, yyyy');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>BUDGET</Text>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.title}>{monthName} Budget Summary</Text>
          <Text style={styles.period}>
            Reporting period: {periodStart} – {periodEnd}
          </Text>
        </View>

        {/* Budget Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Initial Budget</Text>
            <Text style={styles.value}>{formatCurrency(snapshot.initialBudget, currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Additional Budget</Text>
            <Text style={styles.value}>{formatCurrency(snapshot.additionalBudget, currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Budget</Text>
            <Text style={styles.value}>{formatCurrency(snapshot.totalBudget, currency)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Spending */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Expenses</Text>
            <Text style={styles.value}>{formatCurrency(snapshot.totalExpenses, currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Remaining</Text>
            <Text style={styles.value}>{formatCurrency(snapshot.remaining, currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Budget Utilization</Text>
            <Text style={styles.value}>{formatPercent(snapshot.utilizationPercent)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          {snapshot.categoryBreakdown.length === 0 ? (
            <Text style={styles.label}>No expenses recorded this month.</Text>
          ) : (
            snapshot.categoryBreakdown.map((c) => (
              <View key={c.category} style={styles.categoryRow}>
                <Text>{CATEGORY_LABELS[c.category as CategoryType] ?? c.category}</Text>
                <Text style={styles.value}>{formatCurrency(c.amount, currency)}</Text>
              </View>
            ))
          )}

          <View style={styles.highlightBox}>
            <View style={styles.highlightCard}>
              <Text style={styles.highlightLabel}>Highest Category</Text>
              <Text style={styles.highlightValue}>
                {snapshot.highestCategory
                  ? CATEGORY_LABELS[snapshot.highestCategory.category as CategoryType]
                  : '—'}
              </Text>
              <Text style={styles.label}>
                {snapshot.highestCategory ? formatCurrency(snapshot.highestCategory.amount, currency) : ''}
              </Text>
            </View>
            <View style={styles.highlightCard}>
              <Text style={styles.highlightLabel}>Lowest Category</Text>
              <Text style={styles.highlightValue}>
                {snapshot.lowestCategory
                  ? CATEGORY_LABELS[snapshot.lowestCategory.category as CategoryType]
                  : '—'}
              </Text>
              <Text style={styles.label}>
                {snapshot.lowestCategory ? formatCurrency(snapshot.lowestCategory.amount, currency) : ''}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Average Budget Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Average Budget Comparison</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Registered Average Monthly Budget</Text>
            <Text style={styles.value}>{formatCurrency(snapshot.averageMonthlyBudget, currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Actual {monthName} Budget</Text>
            <Text style={styles.value}>{formatCurrency(snapshot.totalBudget, currency)}</Text>
          </View>
          <View style={statusStyle(snapshot.comparisonStatus)}>
            <Text>
              {statusText(snapshot.comparisonStatus, snapshot.comparisonAmount, snapshot.comparisonPercent, currency)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Savings & Investments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Savings &amp; Investments</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Savings</Text>
            <Text style={styles.value}>{formatCurrency(snapshot.totalSavings, currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Investments</Text>
            <Text style={styles.value}>{formatCurrency(snapshot.totalInvestments, currency)}</Text>
          </View>
          {snapshot.savingsDestinations.length > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Destinations</Text>
              <Text style={styles.value}>{snapshot.savingsDestinations.join(', ')}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Financial Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Insights</Text>
          {snapshot.insights.length === 0 ? (
            <Text style={styles.label}>Not enough data yet to generate insights this month.</Text>
          ) : (
            snapshot.insights.map((insight, i) => (
              <View key={i} style={styles.insightItem}>
                <Text style={styles.bullet}>•</Text>
                <Text>{insight}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.footer} fixed>
          Generated by Budget · This report is for informational purposes and does not constitute
          financial advice.
        </Text>
      </Page>
    </Document>
  );
}
