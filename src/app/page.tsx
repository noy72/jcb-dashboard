import { getTransactions } from '@/lib/actions/transactions';
import { calculateDashboardData } from '@/lib/dashboard-utils';
import Dashboard from '@/components/Dashboard';

export default async function DashboardPage() {
  try {
    const transactions = await getTransactions();
    const dashboardData = calculateDashboardData(transactions);
    
    return <Dashboard data={dashboardData} />;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return <Dashboard data={null} />;
  }
}
