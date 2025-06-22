import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  const { categoryId } = await request.json();

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  if (typeof categoryId !== 'number') {
    return NextResponse.json(
      { error: 'categoryId is required and must be a number' },
      { status: 400 }
    );
  }

  try {
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: { categoryId },
    });
    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error(`Error updating transaction ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025はレコードが見つからない場合のエラーコード
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: `Transaction with id ${id} not found` },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Error updating transaction' },
      { status: 500 }
    );
  }
}