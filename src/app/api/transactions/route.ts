import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statementId = searchParams.get('statementId');

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        statementId: statementId ? parseInt(statementId, 10) : undefined,
      },
      include: {
        statement: true,
        category: true,
      },
      orderBy: {
        transaction_date: 'desc',
      },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Error fetching transactions' },
      { status: 500 }
    );
  }
}