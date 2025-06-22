import prisma from '@/lib/prisma';
import { Category, Statement, Transaction } from '@prisma/client';

export const createTestCategory = (data: Partial<Category> = {}): Promise<Category> => {
  return prisma.category.create({
    data: {
      name: `Test Category ${Date.now()}`,
      ...data,
    },
  });
};

export const createTestStatement = (data: Partial<Statement> = {}): Promise<Statement> => {
  return prisma.statement.create({
    data: {
      payment_date: new Date(),
      total_amount: 10000,
      ...data,
    },
  });
};

export const createTestTransaction = (
  statementId: number,
  data: Partial<Transaction> = {}
): Promise<Transaction> => {
  return prisma.transaction.create({
    data: {
      statementId,
      transaction_date: new Date(),
      store_name: 'Test Store',
      amount: 100,
      payment_type: '１回',
      ...data,
    },
  });
};