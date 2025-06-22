'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getTransactions(transactionMonth?: string) {
  try {
    let whereClause = {};
    
    if (transactionMonth) {
      // Parse the month string (YYYY-MM format) to create date range
      const year = parseInt(transactionMonth.split('-')[0]);
      const month = parseInt(transactionMonth.split('-')[1]);
      
      const startDate = new Date(year, month - 1, 1); // Month is 0-indexed
      const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month
      
      whereClause = {
        transaction_date: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        statement: true,
        category: true,
      },
      orderBy: {
        transaction_date: 'desc',
      },
    });
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('取引データの取得に失敗しました');
  }
}

export async function getAvailableTransactionMonths(): Promise<string[]> {
  try {
    const transactions = await prisma.transaction.findMany({
      select: {
        transaction_date: true,
      },
      orderBy: {
        transaction_date: 'desc',
      },
    });

    // Extract unique months in YYYY-MM format
    const months = new Set<string>();
    transactions.forEach(transaction => {
      const month = transaction.transaction_date.toISOString().slice(0, 7); // YYYY-MM format
      months.add(month);
    });

    return Array.from(months).sort().reverse(); // Most recent first
  } catch (error) {
    console.error('Error fetching available transaction months:', error);
    throw new Error('利用可能な月の取得に失敗しました');
  }
}

export async function updateTransactionCategory(transactionId: number, categoryId: number) {
  try {
    if (typeof categoryId !== 'number') {
      throw new Error('カテゴリIDが無効です');
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { categoryId },
    });

    revalidatePath('/transactions');
    return updatedTransaction;
  } catch (error) {
    console.error('Error updating transaction category:', error);
    throw new Error('カテゴリの更新に失敗しました');
  }
}