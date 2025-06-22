import Papa from 'papaparse';

export interface ParsedStatement {
  payment_date: Date;
  total_amount: number;
  domestic_amount: number;
  overseas_amount: number;
}

export interface ParsedTransaction {
  transaction_date: Date;
  store_name: string;
  amount: number;
  payment_type: string;
  note: string | null;
}

export interface ParsedCSVResult {
  statement: ParsedStatement;
  transactions: ParsedTransaction[];
}

const paymentDateRegex = /今回のお支払日.*"(\d{4}\/\d{1,2}\/\d{1,2})"/;
const totalAmountRegex = /今回のお支払金額合計.*"(\d+)"/;
const domesticAmountRegex = /うち国内ご利用金額合計.*"(\d+)"/;
const overseasAmountRegex = /うち海外ご利用金額合計.*"(\d+)"/;

interface TransactionRow {
  'ご利用日': string;
  'ご利用先など': string;
  'ご利用金額(￥)': string;
  '支払区分': string;
  '摘要': string;
}

export function parseJCBCSV(csvText: string): ParsedCSVResult {
  const lines = csvText.split('\n');

  // Extract header information (first 5 lines)
  const headerLines = lines.slice(0, 5).join('\n');
  
  const paymentDateMatch = headerLines.match(paymentDateRegex);
  const totalAmountMatch = headerLines.match(totalAmountRegex);
  const domesticAmountMatch = headerLines.match(domesticAmountRegex);
  const overseasAmountMatch = headerLines.match(overseasAmountRegex);

  if (!paymentDateMatch || !totalAmountMatch || !domesticAmountMatch || !overseasAmountMatch) {
    throw new Error('Invalid CSV header format');
  }

  const statement: ParsedStatement = {
    payment_date: new Date(paymentDateMatch[1]),
    total_amount: parseInt(totalAmountMatch[1], 10),
    domestic_amount: parseInt(domesticAmountMatch[1], 10),
    overseas_amount: parseInt(overseasAmountMatch[1], 10),
  };

  // Parse transaction details (starting from line 6)
  const detailLines = lines.slice(5).join('\n');
  const parseResult = Papa.parse<TransactionRow>(detailLines, {
    header: true,
    skipEmptyLines: true,
  });

  if (parseResult.errors.length > 0) {
    throw new Error(`CSV parse error: ${parseResult.errors.map(e => e.message).join(', ')}`);
  }

  const transactions: ParsedTransaction[] = [];

  for (const row of parseResult.data) {
    // Skip if required fields are empty or if store name starts with 'ＪＣＢ'
    if (!row['ご利用日'] || !row['ご利用先など'] || !row['ご利用金額(￥)'] || 
        row['ご利用先など'].startsWith('ＪＣＢ')) {
      continue;
    }

    const transactionDate = new Date(row['ご利用日'].trim());
    const storeName = row['ご利用先など'].trim();
    const amount = parseInt(row['ご利用金額(￥)'].replace(/,/g, ''), 10);
    const paymentType = row['支払区分'].trim();
    const note = row['摘要']?.trim() || null;

    transactions.push({
      transaction_date: transactionDate,
      store_name: storeName,
      amount: amount,
      payment_type: paymentType,
      note: note,
    });
  }

  return {
    statement,
    transactions,
  };
}