import { DashboardData } from '@/components/Dashboard';

interface MajorCategory {
  id: number;
  name: string;
}

interface MinorCategory {
  id: number;
  name: string;
  major_category_id: number;
}

interface HierarchicalCategory {
  majorCategory: MajorCategory;
  minorCategory: MinorCategory | null;
}

interface Transaction {
  id: number;
  transaction_date: Date;
  store_name: string;
  amount: number;
  payment_type: string;
  note: string | null;
  hierarchicalCategory: HierarchicalCategory | null;
  statement: {
    id: number;
    payment_date: Date;
    total_amount: number;
  };
}

export interface HierarchicalDashboardData extends DashboardData {
  majorCategoryBreakdown: { name: string; amount: number; count: number }[];
  detailedCategoryBreakdown: { 
    majorCategory: string; 
    minorCategory: string | null; 
    amount: number; 
    count: number; 
  }[];
}

export interface MonthlyData {
  month: string;
  monthlyCategories: { name: string; amount: number; count: number }[];
  monthlyDetailedCategories: { 
    majorCategory: string; 
    minorCategory: string | null; 
    amount: number; 
    count: number; 
  }[];
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
    const majorCategoryMap = new Map<string, { amount: number; count: number }>();
    const detailedCategoryMap = new Map<string, { amount: number; count: number }>();
    let monthlyTotal = 0;

    monthTransactions.forEach(transaction => {
      monthlyTotal += transaction.amount;
      
      if (transaction.hierarchicalCategory) {
        const { majorCategory, minorCategory } = transaction.hierarchicalCategory;
        
        // Major category aggregation
        const existingMajor = majorCategoryMap.get(majorCategory.name) || { amount: 0, count: 0 };
        majorCategoryMap.set(majorCategory.name, {
          amount: existingMajor.amount + transaction.amount,
          count: existingMajor.count + 1,
        });

        // Detailed category aggregation
        const detailedKey = `${majorCategory.name}${minorCategory ? ` > ${minorCategory.name}` : ''}`;
        const existingDetailed = detailedCategoryMap.get(detailedKey) || { amount: 0, count: 0 };
        detailedCategoryMap.set(detailedKey, {
          amount: existingDetailed.amount + transaction.amount,
          count: existingDetailed.count + 1,
        });
      }
    });

    const monthlyCategories = Array.from(majorCategoryMap.entries()).map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count,
    })).sort((a, b) => b.amount - a.amount);

    const monthlyDetailedCategories = Array.from(detailedCategoryMap.entries()).map(([key, data]) => {
      const parts = key.split(' > ');
      return {
        majorCategory: parts[0],
        minorCategory: parts[1] || null,
        amount: data.amount,
        count: data.count,
      };
    }).sort((a, b) => b.amount - a.amount);

    return {
      month,
      monthlyCategories,
      monthlyDetailedCategories,
      monthlyTotal,
    };
  }).sort((a, b) => a.month.localeCompare(b.month));
}

export function calculateHierarchicalDashboardData(transactions: Transaction[]): HierarchicalDashboardData {
  // Calculate total amount
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Major category breakdown
  const majorCategoryMap = new Map<string, { amount: number; count: number }>();
  // Detailed category breakdown (major + minor)
  const detailedCategoryMap = new Map<string, { majorCategory: string; minorCategory: string | null; amount: number; count: number }>();
  let uncategorizedCount = 0;
  
  transactions.forEach(transaction => {
    if (transaction.hierarchicalCategory) {
      const { majorCategory, minorCategory } = transaction.hierarchicalCategory;
      
      // Major category aggregation
      const existingMajor = majorCategoryMap.get(majorCategory.name) || { amount: 0, count: 0 };
      majorCategoryMap.set(majorCategory.name, {
        amount: existingMajor.amount + transaction.amount,
        count: existingMajor.count + 1,
      });

      // Detailed category aggregation
      const detailedKey = `${majorCategory.name}${minorCategory ? `_${minorCategory.name}` : '_null'}`;
      const existing = detailedCategoryMap.get(detailedKey) || {
        majorCategory: majorCategory.name,
        minorCategory: minorCategory?.name || null,
        amount: 0,
        count: 0,
      };
      detailedCategoryMap.set(detailedKey, {
        ...existing,
        amount: existing.amount + transaction.amount,
        count: existing.count + 1,
      });
    } else {
      uncategorizedCount++;
    }
  });
  
  const majorCategoryBreakdown = Array.from(majorCategoryMap.entries()).map(([name, data]) => ({
    name,
    amount: data.amount,
    count: data.count,
  })).sort((a, b) => b.amount - a.amount);

  const detailedCategoryBreakdown = Array.from(detailedCategoryMap.values())
    .sort((a, b) => b.amount - a.amount);
  
  // Use major categories for the legacy categoryBreakdown
  const categoryBreakdown = majorCategoryBreakdown;
  
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
    majorCategoryBreakdown,
    detailedCategoryBreakdown,
    monthlyData,
    monthlyCategories,
    availableMonths,
    uncategorizedCount,
  };
}