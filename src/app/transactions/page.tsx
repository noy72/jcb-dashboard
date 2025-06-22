import { getCategories } from '@/lib/actions/categories';
import { getTransactions } from '@/lib/actions/transactions';
import TransactionsList from '@/components/TransactionsList';

interface TransactionsPageProps {
  searchParams: {
    statementId?: string;
  };
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  try {
    const statementId = searchParams.statementId ? parseInt(searchParams.statementId) : undefined;
    
    const [transactions, categories] = await Promise.all([
      getTransactions(statementId),
      getCategories(),
    ]);

    return (
      <TransactionsList 
        initialTransactions={transactions}
        categories={categories}
        initialStatementFilter={searchParams.statementId || ''}
      />
    );
  } catch (error) {
    console.error('Error fetching transactions data:', error);
    return (
      <TransactionsList 
        initialTransactions={[]}
        categories={[]}
        initialStatementFilter=""
      />
    );
  }
}