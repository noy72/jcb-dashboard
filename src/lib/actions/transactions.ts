'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getTransactions(statementId?: number) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        statementId: statementId ? statementId : undefined,
      },
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