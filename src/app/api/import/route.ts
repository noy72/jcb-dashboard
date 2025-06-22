import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import prisma from '@/lib/prisma';

// CSVのヘッダーから情報を抽出するための正規表現
const paymentDateRegex = /今回のお支払日,(\d{4}\/\d{2}\/\d{2})/;
const totalAmountRegex = /今回のお支払金額合計,([\d,]+)円/;

// 明細の型定義
interface TransactionRow {
  'ご利用日': string;
  'ご利用先など': string;
  'ご利用金額(￥)': string;
  '支払区分': string;
  '摘要': string;
}

export async function POST(req: Request) {
  try {
    const csvText = await req.text();
    const lines = csvText.split('\n');

    // 1. ヘッダーと明細を分離
    const headerLines = lines.slice(0, 5).join('\n');
    const detailLines = lines.slice(4).join('\n');

    // 2. ヘッダーからサマリー情報を抽出
    const paymentDateMatch = headerLines.match(paymentDateRegex);
    const totalAmountMatch = headerLines.match(totalAmountRegex);

    if (!paymentDateMatch || !totalAmountMatch) {
      return NextResponse.json({ error: 'Invalid CSV header format.' }, { status: 400 });
    }

    const paymentDate = new Date(paymentDateMatch[1]);
    const totalAmount = parseInt(totalAmountMatch[1].replace(/,/g, ''), 10);

    // 3. statementsテーブルに登録
    const statement = await prisma.statement.create({
      data: {
        payment_date: paymentDate,
        total_amount: totalAmount,
      },
    });

    // 4. 明細をパースして登録
    const parseResult = Papa.parse<TransactionRow>(detailLines, {
      header: true,
      skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0) {
        console.error('CSV Parse Errors:', parseResult.errors);
        return NextResponse.json({ error: 'Failed to parse CSV details.', details: parseResult.errors }, { status: 400 });
    }

    const transactionsData = parseResult.data;
    const storeCategoryMappings = await prisma.storeCategoryMapping.findMany();
    const mappingMap = new Map(storeCategoryMappings.map(m => [m.store_name, m.categoryId]));

    for (const row of transactionsData) {
      // 必須項目が空、または 'ご利用先など' が 'ＪＣＢ' で始まる場合はスキップ
      if (!row['ご利用日'] || !row['ご利用先など'] || !row['ご利用金額(￥)'] || row['ご利用先など'].startsWith('ＪＣＢ')) {
        continue;
      }

      const transactionDate = new Date(row['ご利用日']);
      const storeName = row['ご利用先など'];
      const amount = parseInt(row['ご利用金額(￥)'].replace(/,/g, ''), 10);
      const paymentType = row['支払区分'];
      const note = row['摘要'] || null;

      // 重複チェック
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          statementId: statement.id,
          transaction_date: transactionDate,
          store_name: storeName,
          amount: amount,
        },
      });

      if (existingTransaction) {
        continue;
      }
      
      // カテゴリ自動紐付け
      const categoryId = mappingMap.get(storeName);

      await prisma.transaction.create({
        data: {
          statementId: statement.id,
          transaction_date: transactionDate,
          store_name: storeName,
          amount: amount,
          payment_type: paymentType,
          note: note,
          categoryId: categoryId,
        },
      });
    }

    return NextResponse.json({
      message: 'CSV imported successfully.',
      statementId: statement.id,
    }, { status: 201 });

  } catch (error) {
    console.error('Import API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}