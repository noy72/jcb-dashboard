import { getCategories } from '@/lib/actions/categories';
import { getTransactions, getAvailableTransactionMonths } from '@/lib/actions/transactions';
import TransactionsList from '@/components/TransactionsList';

interface TransactionsPageProps {
  searchParams: {
    month?: string;
  };
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  try {
    const [transactions, categories, availableMonths] = await Promise.all([
      getTransactions(searchParams.month),
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