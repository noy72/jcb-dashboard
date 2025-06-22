import { getTransactionsWithHierarchicalCategories } from '@/lib/actions/hierarchical-categories';
import { calculateHierarchicalDashboardData } from '@/lib/hierarchical-dashboard-utils';
import ClientOnlyDashboard from '@/components/ClientOnlyDashboard';

export default async function DashboardPage() {
  try {
    const transactions = await getTransactionsWithHierarchicalCategories();
    const dashboardData = calculateHierarchicalDashboardData(transactions);
    
    return <ClientOnlyDashboard data={dashboardData} />;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return <ClientOnlyDashboard data={null} />;
  }
}
