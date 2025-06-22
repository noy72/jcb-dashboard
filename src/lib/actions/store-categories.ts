'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getStoreCategoryMappings() {
  try {
    const mappings = await prisma.storeCategoryMapping.findMany({
      include: {
        category: true,
      },
      orderBy: {
        store_name: 'asc',
      },
    });
    return mappings;
  } catch (error) {
    console.error('Error fetching store category mappings:', error);
    throw new Error('店舗カテゴリマッピングの取得に失敗しました');
  }
}

export async function updateStoreCategoryMapping(storeName: string, categoryId: number) {
  try {
    if (typeof categoryId !== 'number') {
      throw new Error('カテゴリIDが無効です');
    }

    // Check if mapping already exists
    const existingMapping = await prisma.storeCategoryMapping.findUnique({
      where: { store_name: storeName },
    });

    if (existingMapping) {
      // Update existing mapping
      await prisma.storeCategoryMapping.update({
        where: { store_name: storeName },
        data: { categoryId },
      });
    } else {
      // Create new mapping
      await prisma.storeCategoryMapping.create({
        data: {
          store_name: storeName,
          categoryId,
        },
      });
    }

    revalidatePath('/transactions');
    return { success: true, message: '店舗カテゴリマッピングが更新されました' };
  } catch (error) {
    console.error('Error updating store category mapping:', error);
    throw new Error('店舗カテゴリマッピングの更新に失敗しました');
  }
}

export async function deleteStoreCategoryMapping(storeName: string) {
  try {
    await prisma.storeCategoryMapping.delete({
      where: { store_name: storeName },
    });

    revalidatePath('/transactions');
    return { success: true, message: '店舗カテゴリマッピングが削除されました' };
  } catch (error) {
    console.error('Error deleting store category mapping:', error);
    throw new Error('店舗カテゴリマッピングの削除に失敗しました');
  }
}

export async function getTransactionsWithStoreCategories(transactionMonth?: string) {
  try {
    let whereClause = {};
    
    if (transactionMonth) {
      const year = parseInt(transactionMonth.split('-')[0]);
      const month = parseInt(transactionMonth.split('-')[1]);
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
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

    // Get store category mappings
    const storeMappings = await prisma.storeCategoryMapping.findMany({
      include: {
        category: true,
      },
    });

    // Create a map for quick lookup
    const storeCategoryMap = new Map(
      storeMappings.map(mapping => [mapping.store_name, mapping.category])
    );

    // Add store-based category to each transaction
    const transactionsWithStoreCategories = transactions.map(transaction => ({
      ...transaction,
      storeCategory: storeCategoryMap.get(transaction.store_name) || null,
    }));

    return transactionsWithStoreCategories;
  } catch (error) {
    console.error('Error fetching transactions with store categories:', error);
    throw new Error('取引データの取得に失敗しました');
  }
}