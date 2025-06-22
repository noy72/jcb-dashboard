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

// Expected header structure
const EXPECTED_HEADERS = {
  PAYMENT_DATE: '今回のお支払日',
  TOTAL_AMOUNT: '今回のお支払金額合計(￥)',
  DOMESTIC_AMOUNT: 'うち国内ご利用金額合計(￥)',
  OVERSEAS_AMOUNT: 'うち海外ご利用金額合計(￥)',
};

interface TransactionRow {
  'ご利用日': string;
  'ご利用先など': string;
  'ご利用金額(￥)': string;
  '支払区分': string;
  '摘要': string;
}

export function parseJCBCSV(csvText: string): ParsedCSVResult {
  const lines = csvText.split('\n');

  // Parse header information (first 4 lines) as CSV
  const headerRows = lines.slice(0, 4).map(line => line.split(',').map(cell => cell.slice(1, -1).trim())); // Remove leading/trailing quotes

  if (headerRows[0][2] !== EXPECTED_HEADERS.PAYMENT_DATE ||
      headerRows[1][2] !== EXPECTED_HEADERS.TOTAL_AMOUNT ||
      headerRows[2][2] !== EXPECTED_HEADERS.DOMESTIC_AMOUNT ||
      headerRows[3][2] !== EXPECTED_HEADERS.OVERSEAS_AMOUNT) {
    throw new Error('Invalid CSV header format: Missing expected headers');
  }

  const paymentDate = headerRows[0][3]?.trim();
  const totalAmount = headerRows[1][3]?.trim();
  const domesticAmount = headerRows[2][3]?.trim();
  const overseasAmount = headerRows[3][3]?.trim();
  
  // Validate that all required header information was found
  if (!paymentDate || !totalAmount || !domesticAmount || !overseasAmount) {
    throw new Error('Invalid CSV header format: Missing required fields (今回のお支払日, 今回のお支払金額合計, うち国内ご利用金額合計, うち海外ご利用金額合計)');
  }

  const statement: ParsedStatement = {
    payment_date: new Date(paymentDate),
    total_amount: parseInt(totalAmount, 10),
    domestic_amount: parseInt(domesticAmount, 10),
    overseas_amount: parseInt(overseasAmount, 10),
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