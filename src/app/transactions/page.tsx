import { getCategories } from '@/lib/actions/categories';
import { getAvailableTransactionMonths } from '@/lib/actions/transactions';
import { getTransactionsWithStoreCategories } from '@/lib/actions/store-categories';
import TransactionsList from '@/components/TransactionsList';

interface TransactionsPageProps {
  searchParams: {
    month?: string;
  };
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  try {
    const [transactions, categories, availableMonths] = await Promise.all([
      getTransactionsWithStoreCategories(searchParams.month),
      getCategories(),
      getAvailableTransactionMonths(),
    ]);

    return (
      <TransactionsList 
        initialTransactions={transactions}
        categories={categories}
        availableMonths={availableMonths}
        initialMonthFilter={searchParams.month || ''}
      />
    );
  } catch (error) {
    console.error('Error fetching transactions data:', error);
    return (
      <TransactionsList 
        initialTransactions={[]}
        categories={[]}
        availableMonths={[]}
        initialMonthFilter=""
      />
    );
  }
}