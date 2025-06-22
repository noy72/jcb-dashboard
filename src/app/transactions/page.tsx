import { getAvailableTransactionMonths } from '@/lib/actions/transactions';
import { 
  getTransactionsWithHierarchicalCategories,
  getMajorCategories,
} from '@/lib/actions/hierarchical-categories';
import HierarchicalTransactionsList from '@/components/HierarchicalTransactionsList';

interface TransactionsPageProps {
  searchParams: {
    month?: string;
  };
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  try {
    const [transactions, majorCategories, availableMonths] = await Promise.all([
      getTransactionsWithHierarchicalCategories(searchParams.month),
      getMajorCategories(),
      getAvailableTransactionMonths(),
    ]);

    return (
      <HierarchicalTransactionsList 
        initialTransactions={transactions}
        majorCategories={majorCategories}
        availableMonths={availableMonths}
        initialMonthFilter={searchParams.month || ''}
      />
    );
  } catch (error) {
    console.error('Error fetching transactions data:', error);
    return (
      <HierarchicalTransactionsList 
        initialTransactions={[]}
        majorCategories={[]}
        availableMonths={[]}
        initialMonthFilter=""
      />
    );
  }
}