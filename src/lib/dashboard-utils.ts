import { DashboardData } from '@/components/Dashboard';

interface Transaction {
  id: number;
  transaction_date: Date;
  store_name: string;
  amount: number;
  payment_type: string;
  note: string | null;
  category: {
    id: number;
    name: string;
  } | null;
  statement: {
    id: number;
    payment_date: Date;
    total_amount: number;
  };
}

export function calculateDashboardData(transactions: Transaction[]): DashboardData {
  // Calculate total amount
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Category breakdown
  const categoryMap = new Map<string, { amount: number; count: number }>();
  let uncategorizedCount = 0;
  
  transactions.forEach(transaction => {
    if (transaction.category) {
      const existing = categoryMap.get(transaction.category.name) || { amount: 0, count: 0 };
      categoryMap.set(transaction.category.name, {
        amount: existing.amount + transaction.amount,
        count: existing.count + 1,
      });
    } else {
      uncategorizedCount++;
    }
  });
  
  const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, data]) => ({
    name,
    amount: data.amount,
    count: data.count,
  })).sort((a, b) => b.amount - a.amount);
  
  // Monthly data
  const monthMap = new Map<string, number>();
  transactions.forEach(transaction => {
    const month = transaction.transaction_date.toISOString().slice(0, 7); // YYYY-MM format
    monthMap.set(month, (monthMap.get(month) || 0) + transaction.amount);
  });
  
  const monthlyData = Array.from(monthMap.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  return {
    totalAmount,
    categoryBreakdown,
    monthlyData,
    uncategorizedCount,
  };
}