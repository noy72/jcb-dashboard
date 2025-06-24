import { getAvailableTransactionMonths } from '@/lib/actions/transactions';
import { 
  getTransactionsWithHierarchicalCategoriesPaginated,
  getMajorCategories,
} from '@/lib/actions/hierarchical-categories';
import HierarchicalTransactionsList from '@/components/HierarchicalTransactionsList';

interface TransactionsPageProps {
  searchParams: Promise<{
    month?: string;
    page?: string;
  }>;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  try {
    const params = await searchParams;
    const page = parseInt(params.page || '1', 10);
    const [transactionsData, majorCategories, availableMonths] = await Promise.all([
      getTransactionsWithHierarchicalCategoriesPaginated(params.month, page, 50),
      getMajorCategories(),
      getAvailableTransactionMonths(),
    ]);

    return (
      <HierarchicalTransactionsList 
        initialTransactions={transactionsData.transactions}
        pagination={transactionsData.pagination}
        majorCategories={majorCategories}
        availableMonths={availableMonths}
        initialMonthFilter={params.month || ''}
      />
    );
  } catch (error) {
    console.error('Error fetching transactions data:', error);
    return (
      <HierarchicalTransactionsList 
        initialTransactions={[]}
        pagination={{ page: 1, limit: 50, totalCount: 0, totalPages: 0, hasMore: false }}
        majorCategories={[]}
        availableMonths={[]}
        initialMonthFilter=""
      />
    );
  }
}