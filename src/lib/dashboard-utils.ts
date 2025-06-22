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

export interface MonthlyData {
  month: string;
  monthlyCategories: { name: string; amount: number; count: number }[];
  monthlyTotal: number;
}

export function getAvailableMonths(transactions: Transaction[]): string[] {
  const months = new Set<string>();
  transactions.forEach(transaction => {
    const month = transaction.transaction_date.toISOString().slice(0, 7); // YYYY-MM format
    months.add(month);
  });
  return Array.from(months).sort();
}

export function calculateMonthlyData(transactions: Transaction[], targetMonth?: string): MonthlyData[] {
  const monthMap = new Map<string, Transaction[]>();
  
  // Group transactions by month
  transactions.forEach(transaction => {
    const month = transaction.transaction_date.toISOString().slice(0, 7);
    if (!targetMonth || month === targetMonth) {
      if (!monthMap.has(month)) {
        monthMap.set(month, []);
      }
      monthMap.get(month)!.push(transaction);
    }
  });

  // Calculate category breakdown for each month
  return Array.from(monthMap.entries()).map(([month, monthTransactions]) => {
    const categoryMap = new Map<string, { amount: number; count: number }>();
    let monthlyTotal = 0;

    monthTransactions.forEach(transaction => {
      monthlyTotal += transaction.amount;
      
      if (transaction.category) {
        const existing = categoryMap.get(transaction.category.name) || { amount: 0, count: 0 };
        categoryMap.set(transaction.category.name, {
          amount: existing.amount + transaction.amount,
          count: existing.count + 1,
        });
      }
    });

    const monthlyCategories = Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count,
    })).sort((a, b) => b.amount - a.amount);

    return {
      month,
      monthlyCategories,
      monthlyTotal,
    };
  }).sort((a, b) => a.month.localeCompare(b.month));
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

  // Monthly category data
  const availableMonths = getAvailableMonths(transactions);
  const monthlyCategories = calculateMonthlyData(transactions);
  
  return {
    totalAmount,
    categoryBreakdown,
    monthlyData,
    monthlyCategories,
    availableMonths,
    uncategorizedCount,
  };
}