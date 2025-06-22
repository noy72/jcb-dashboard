'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { parseJCBCSV } from '@/lib/csv-parser';

export interface ImportResult {
  success: boolean;
  statementId?: number;
  message: string;
  error?: string;
}

export async function importCSV(csvContent: string): Promise<ImportResult> {
  try {
    // Parse CSV content
    const parsedData = parseJCBCSV(csvContent);
    
    // Create statement record
    const statement = await prisma.statement.create({
      data: {
        payment_date: parsedData.statement.payment_date,
        total_amount: parsedData.statement.total_amount,
      },
    });

    // Get existing store category mappings
    const storeCategoryMappings = await prisma.storeCategoryMapping.findMany();
    const mappingMap = new Map(storeCategoryMappings.map(m => [m.store_name, m.categoryId]));

    let importedCount = 0;
    let skippedCount = 0;

    // Import transactions
    for (const transaction of parsedData.transactions) {
      // Check for duplicates
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          statementId: statement.id,
          transaction_date: transaction.transaction_date,
          store_name: transaction.store_name,
          amount: transaction.amount,
        },
      });

      if (existingTransaction) {
        skippedCount++;
        continue;
      }

      // Auto-assign category if mapping exists
      const categoryId = mappingMap.get(transaction.store_name);

      await prisma.transaction.create({
        data: {
          statementId: statement.id,
          transaction_date: transaction.transaction_date,
          store_name: transaction.store_name,
          amount: transaction.amount,
          payment_type: transaction.payment_type,
          note: transaction.note,
          categoryId: categoryId,
        },
      });

      importedCount++;
    }

    // Revalidate pages that display transaction data
    revalidatePath('/');
    revalidatePath('/transactions');

    return {
      success: true,
      statementId: statement.id,
      message: `CSVファイルのインポートが完了しました。${importedCount}件の取引をインポートしました。${skippedCount > 0 ? `${skippedCount}件の重複取引をスキップしました。` : ''}`,
    };

  } catch (error) {
    console.error('CSV import error:', error);
    
    let errorMessage = 'CSVインポートに失敗しました。';
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid CSV header format')) {
        errorMessage = 'CSVファイルの形式が正しくありません。JCBの利用明細CSVファイルを選択してください。';
      } else if (error.message.includes('CSV parse error')) {
        errorMessage = 'CSVファイルの解析に失敗しました。ファイルの内容を確認してください。';
      } else {
        errorMessage = `エラー: ${error.message}`;
      }
    }

    return {
      success: false,
      message: errorMessage,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}