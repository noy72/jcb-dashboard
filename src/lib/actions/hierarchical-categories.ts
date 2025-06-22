'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Major Category Management
export async function getMajorCategories() {
  try {
    const categories = await prisma.majorCategory.findMany({
      include: {
        minor_categories: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return categories;
  } catch (error) {
    console.error('Error fetching major categories:', error);
    throw new Error('大カテゴリの取得に失敗しました');
  }
}

export async function createMajorCategory(name: string) {
  try {
    const category = await prisma.majorCategory.create({
      data: { name },
    });
    
    revalidatePath('/transactions');
    return { success: true, category };
  } catch (error) {
    console.error('Error creating major category:', error);
    throw new Error('大カテゴリの作成に失敗しました');
  }
}

// Minor Category Management
export async function getMinorCategoriesByMajor(majorCategoryId: number) {
  try {
    const categories = await prisma.minorCategory.findMany({
      where: {
        major_category_id: majorCategoryId,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return categories;
  } catch (error) {
    console.error('Error fetching minor categories:', error);
    throw new Error('小カテゴリの取得に失敗しました');
  }
}

export async function createMinorCategory(majorCategoryId: number, name: string) {
  try {
    const category = await prisma.minorCategory.create({
      data: {
        name,
        major_category_id: majorCategoryId,
      },
    });
    
    revalidatePath('/transactions');
    return { success: true, category };
  } catch (error) {
    console.error('Error creating minor category:', error);
    throw new Error('小カテゴリの作成に失敗しました');
  }
}

// Store Hierarchical Category Mapping
export async function getStoreHierarchicalCategoryMappings() {
  try {
    const mappings = await prisma.storeHierarchicalCategoryMapping.findMany({
      include: {
        major_category: true,
        minor_category: true,
      },
      orderBy: {
        store_name: 'asc',
      },
    });
    return mappings;
  } catch (error) {
    console.error('Error fetching store hierarchical category mappings:', error);
    throw new Error('店舗階層カテゴリマッピングの取得に失敗しました');
  }
}

export async function updateStoreHierarchicalCategoryMapping(
  storeName: string,
  majorCategoryId: number,
  minorCategoryId?: number
) {
  try {
    // Validate that minor category belongs to major category if specified
    if (minorCategoryId) {
      const minorCategory = await prisma.minorCategory.findFirst({
        where: {
          id: minorCategoryId,
          major_category_id: majorCategoryId,
        },
      });
      
      if (!minorCategory) {
        throw new Error('指定された小カテゴリは大カテゴリに属していません');
      }
    }

    // Check if mapping already exists
    const existingMapping = await prisma.storeHierarchicalCategoryMapping.findUnique({
      where: { store_name: storeName },
    });

    if (existingMapping) {
      // Update existing mapping
      await prisma.storeHierarchicalCategoryMapping.update({
        where: { store_name: storeName },
        data: {
          major_category_id: majorCategoryId,
          minor_category_id: minorCategoryId || null,
        },
      });
    } else {
      // Create new mapping
      await prisma.storeHierarchicalCategoryMapping.create({
        data: {
          store_name: storeName,
          major_category_id: majorCategoryId,
          minor_category_id: minorCategoryId || null,
        },
      });
    }

    revalidatePath('/transactions');
    return { success: true, message: '店舗階層カテゴリマッピングが更新されました' };
  } catch (error) {
    console.error('Error updating store hierarchical category mapping:', error);
    throw new Error('店舗階層カテゴリマッピングの更新に失敗しました');
  }
}

export async function deleteStoreHierarchicalCategoryMapping(storeName: string) {
  try {
    await prisma.storeHierarchicalCategoryMapping.delete({
      where: { store_name: storeName },
    });

    revalidatePath('/transactions');
    return { success: true, message: '店舗階層カテゴリマッピングが削除されました' };
  } catch (error) {
    console.error('Error deleting store hierarchical category mapping:', error);
    throw new Error('店舗階層カテゴリマッピングの削除に失敗しました');
  }
}

// Transaction retrieval with hierarchical categories
export async function getTransactionsWithHierarchicalCategories(transactionMonth?: string) {
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

    // Get hierarchical store category mappings
    const hierarchicalMappings = await prisma.storeHierarchicalCategoryMapping.findMany({
      include: {
        major_category: true,
        minor_category: true,
      },
    });

    // Create a map for quick lookup
    const hierarchicalCategoryMap = new Map(
      hierarchicalMappings.map(mapping => [mapping.store_name, {
        majorCategory: mapping.major_category,
        minorCategory: mapping.minor_category,
      }])
    );

    // Add hierarchical categories to each transaction
    const transactionsWithHierarchicalCategories = transactions.map(transaction => ({
      ...transaction,
      hierarchicalCategory: hierarchicalCategoryMap.get(transaction.store_name) || null,
    }));

    return transactionsWithHierarchicalCategories;
  } catch (error) {
    console.error('Error fetching transactions with hierarchical categories:', error);
    throw new Error('取引データの取得に失敗しました');
  }
}