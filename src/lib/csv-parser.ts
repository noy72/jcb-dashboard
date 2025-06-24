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


export function parseJCBCSV(csvText: string): ParsedCSVResult {
  const parseResult = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: false,
  });
  
  if (parseResult.errors.length > 0) {
    throw new Error(`CSV parse error: ${parseResult.errors.map(e => e.message).join(', ')}`);
  }
  
  const allRows = parseResult.data as string[][];

  // Extract header information (first 4 rows)
  const headerRows = allRows.slice(0, 4);

  // Validate header row structure
  if (headerRows.length < 4 || 
      !headerRows[0] || headerRows[0].length < 4 ||
      !headerRows[1] || headerRows[1].length < 4 ||
      !headerRows[2] || headerRows[2].length < 4 ||
      !headerRows[3] || headerRows[3].length < 4) {
    throw new Error(`Invalid CSV header format: Insufficient header rows or columns. Found ${headerRows.length} rows`);
  }

  if (headerRows[0][2].trim() !== EXPECTED_HEADERS.PAYMENT_DATE ||
      headerRows[1][2].trim() !== EXPECTED_HEADERS.TOTAL_AMOUNT ||
      headerRows[2][2].trim() !== EXPECTED_HEADERS.DOMESTIC_AMOUNT ||
      headerRows[3][2].trim() !== EXPECTED_HEADERS.OVERSEAS_AMOUNT) {
    throw new Error(`Invalid CSV header format: Expected headers not found. Found: [${headerRows[0][2]}, ${headerRows[1][2]}, ${headerRows[2][2]}, ${headerRows[3][2]}]`);
  }

  const paymentDate = headerRows[0][3]?.trim();
  const totalAmount = headerRows[1][3]?.trim();
  const domesticAmount = headerRows[2][3]?.trim();
  const overseasAmount = headerRows[3][3]?.trim();
  
  // Validate that all required header information was found
  if (!paymentDate || !totalAmount || !domesticAmount || !overseasAmount) {
    throw new Error(`Invalid CSV header format: Missing required fields. Found values: paymentDate='${paymentDate}', totalAmount='${totalAmount}', domesticAmount='${domesticAmount}', overseasAmount='${overseasAmount}'`);
  }

  const statement: ParsedStatement = {
    payment_date: new Date(paymentDate),
    total_amount: parseInt(totalAmount, 10),
    domestic_amount: parseInt(domesticAmount, 10),
    overseas_amount: parseInt(overseasAmount, 10),
  };

  // Extract transaction rows (from row 5 onwards, excluding header row at index 5)
  const transactionRows = allRows.slice(6);
  const transactionHeaders = allRows[5];

  const transactions: ParsedTransaction[] = [];

  for (const row of transactionRows) {
    if (!row || row.length === 0) continue;

    // Create object from headers and row data
    const transactionData: { [key: string]: string } = {};
    transactionHeaders.forEach((header, index) => {
      transactionData[header] = row[index] || '';
    });

    // Skip if required fields are empty or if store name starts with 'ＪＣＢ'
    if (!transactionData['ご利用日'] || !transactionData['ご利用先など'] || !transactionData['ご利用金額(￥)'] || 
        transactionData['ご利用先など'].startsWith('ＪＣＢ')) {
      continue;
    }

    try {
      const transactionDate = new Date(transactionData['ご利用日'].trim());
      const storeName = transactionData['ご利用先など'].trim();
      const amount = parseInt(transactionData['ご利用金額(￥)'].replace(/,/g, ''), 10);
      const paymentType = transactionData['支払区分'].trim();
      const note = transactionData['摘要']?.trim() || null;

      if (isNaN(amount)) {
        throw new Error(`Invalid amount value: '${transactionData['ご利用金額(￥)']}'`);
      }
      if (isNaN(transactionDate.getTime())) {
        throw new Error(`Invalid date value: '${transactionData['ご利用日']}'`);
      }

      transactions.push({
        transaction_date: transactionDate,
        store_name: storeName,
        amount: amount,
        payment_type: paymentType,
        note: note,
      });
    } catch (error) {
      throw new Error(`Error parsing transaction row: ${error instanceof Error ? error.message : error}. Row data: ${JSON.stringify(transactionData)}`);
    }
  }

  return {
    statement,
    transactions,
  };
}