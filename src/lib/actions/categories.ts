'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('カテゴリの取得に失敗しました');
  }
}

export async function createCategory(name: string) {
  try {
    if (!name || typeof name !== 'string') {
      throw new Error('カテゴリ名が必要です');
    }

    const category = await prisma.category.create({
      data: { name },
    });

    revalidatePath('/transactions');
    return category;
  } catch (error) {
    console.error('Error creating category:', error);
    throw new Error('カテゴリの作成に失敗しました');
  }
}