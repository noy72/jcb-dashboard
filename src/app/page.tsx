import { getTransactionsWithStoreCategories } from '@/lib/actions/store-categories';
import { calculateDashboardData } from '@/lib/dashboard-utils';
import ClientOnlyDashboard from '@/components/ClientOnlyDashboard';

export default async function DashboardPage() {
  try {
    const transactions = await getTransactionsWithStoreCategories();
    const dashboardData = calculateDashboardData(transactions);
    
    return <ClientOnlyDashboard data={dashboardData} />;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return <ClientOnlyDashboard data={null} />;
  }
}
