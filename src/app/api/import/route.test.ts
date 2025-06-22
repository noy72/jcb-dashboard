import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('CSV Import API with InMemory DB', () => {
  beforeEach(async () => {
    // 各テストの前にデータをクリーンアップ
    await prisma.transaction.deleteMany();
    await prisma.statement.deleteMany();
    await prisma.storeCategoryMapping.deleteMany();
    await prisma.category.deleteMany();
  });

  afterEach(async () => {
      // 各テストの後にデータをクリーンアップ
      await prisma.transaction.deleteMany();
      await prisma.statement.deleteMany();
      await prisma.storeCategoryMapping.deleteMany();
      await prisma.category.deleteMany();
  });

  const generateCsv = (data: object[], header?: string) => {
    const defaultHeader = `カードご利用代金明細
,,,,
今回のお支払日,2025/07/10,,今回のお支払金額合計,10,000円
,,,,
ご利用日,ご利用先など,ご利用金額(￥),支払区分,摘要
`;
    const csvHeader = header ?? defaultHeader;
    const body = (data as Array<{date: string, store: string, amount: string, type: string, note: string}>)
      .map(d => `${d.date},"${d.store}",${d.amount},"${d.type}","${d.note}"`)
      .join('\n');
    return `${csvHeader}${body}`;
  };

  it('正常系: 正しい形式のCSVを処理し、データを登録すること', async () => {
    const csvData = [
      { date: '2025/06/15', store: 'テストストア', amount: '5000', type: '１回払い', note: '' },
      { date: '2025/06/16', store: '別のストア', amount: '5000', type: '１回払い', note: 'メモ' },
    ];
    const csv = generateCsv(csvData);
    const request = new Request('http://localhost/api/import', {
      method: 'POST',
      body: csv,
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.message).toBe('CSV imported successfully.');

    const statements = await prisma.statement.findMany();
    expect(statements).toHaveLength(1);
    expect(statements[0].total_amount).toBe(10000);

    const transactions = await prisma.transaction.findMany();
    expect(transactions).toHaveLength(2);
    expect(transactions[0].store_name).toBe('テストストア');
    expect(transactions[1].note).toBe('メモ');
  });

  it('重複チェック: 重複する明細は登録しないこと', async () => {
    const duplicatedData = { date: '2025/06/15', store: 'テストストア', amount: '5000', type: '１回払い', note: '' };
    const csvData = [duplicatedData, duplicatedData]; // 同じデータを2行含める
    const csv = generateCsv(csvData, `カードご利用代金明細\n,,,,\n今回のお支払日,2025/07/10,,今回のお支払金額合計,10,000円\n,,,,\nご利用日,ご利用先など,ご利用金額(￥),支払区分,摘要\n`);
    const request = new Request('http://localhost/api/import', {
      method: 'POST',
      body: csv,
    });

    await POST(request);

    // statementは1つだけ作成される
    const statements = await prisma.statement.findMany();
    expect(statements).toHaveLength(1);

    // transactionも1つだけ作成される
    const transactions = await prisma.transaction.findMany();
    expect(transactions).toHaveLength(1);
  });

  it('カテゴリ自動紐付け: マッピングが存在する場合にcategoryIdを付与すること', async () => {
    const category = await prisma.category.create({ data: { name: '食費' } });
    await prisma.storeCategoryMapping.create({
      data: { store_name: 'カテゴリ対象ストア', categoryId: category.id },
    });

    const csvData = [{ date: '2025/06/15', store: 'カテゴリ対象ストア', amount: '3000', type: '１回払い', note: '' }];
    const csv = generateCsv(csvData, `カードご利用代金明細\n,,,,\n今回のお支払日,2025/07/10,,今回のお支払金額合計,3,000円\n,,,,\nご利用日,ご利用先など,ご利用金額(￥),支払区分,摘要\n`);
    const request = new Request('http://localhost/api/import', {
      method: 'POST',
      body: csv,
    });

    await POST(request);

    const transaction = await prisma.transaction.findFirst();
    expect(transaction?.categoryId).toBe(category.id);
  });

  it('異常系: 不正なヘッダー形式のCSVでエラーを返すこと', async () => {
    const invalidHeader = `これは不正なヘッダーです\n,,,,`;
    const csv = generateCsv([], invalidHeader);
    const request = new Request('http://localhost/api/import', {
      method: 'POST',
      body: csv,
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid CSV header format.');

    const statements = await prisma.statement.findMany();
    expect(statements).toHaveLength(0);
  });
});