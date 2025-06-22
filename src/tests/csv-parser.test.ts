import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseJCBCSV } from '@/lib/csv-parser';

describe('parseJCBCSV', () => {
  it('should parse JCB CSV file correctly', () => {
    const csvPath = join(__dirname, 'assets', 'meisai.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    const result = parseJCBCSV(csvContent);

    // Check statement data
    expect(result.statement.payment_date).toEqual(new Date('2025/01/1'));
    expect(result.statement.total_amount).toBe(10);
    expect(result.statement.domestic_amount).toBe(10);
    expect(result.statement.overseas_amount).toBe(9);

    // Check transactions
    expect(result.transactions).toHaveLength(1);
    
    const transaction = result.transactions[0];
    expect(transaction.transaction_date).toEqual(new Date('2024/1/1'));
    expect(transaction.store_name).toBe('店');
    expect(transaction.amount).toBe(110);
    expect(transaction.payment_type).toBe('１回');
    expect(transaction.note).toBe('Ａｐｐｌｅ　Ｐａｙご利用分');
  });

  it('should throw error for invalid CSV format', () => {
    const invalidCsv = 'invalid,csv,format\n1,2,3';
    
    expect(() => parseJCBCSV(invalidCsv)).toThrow('Invalid CSV header format');
  });

  it('should skip transactions starting with JCB', () => {
    const csvWithJCB = `"","","今回のお支払日","2025/01/10"
"","","今回のお支払金額合計(￥)","1000"
"","","　うち国内ご利用金額合計(￥)","1000"
"","","　うち海外ご利用金額合計(￥)","0"
"【ご利用明細】"
"ご利用者","カテゴリ","ご利用日","ご利用先など","ご利用金額(￥)","支払区分","今回回数","訂正サイン","お支払い金額(￥)","国内／海外","摘要","備考"
"****-****-****-***","≪ショッピング取組（国内）≫","2024/12/01","ＪＣＢカード","500","１回","","","500","国内","","* 1"
"****-****-****-***","≪ショッピング取組（国内）≫","2024/12/02","テスト店舗","1000","１回","","","1000","国内","","* 2"`;

    const result = parseJCBCSV(csvWithJCB);
    
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].store_name).toBe('テスト店舗');
  });

  it('should handle empty note fields', () => {
    const csvWithEmptyNote = `"","","今回のお支払日","2025/01/10"
"","","今回のお支払金額合計(￥)","1000"
"","","　うち国内ご利用金額合計(￥)","1000"
"","","　うち海外ご利用金額合計(￥)","0"
"【ご利用明細】"
"ご利用者","カテゴリ","ご利用日","ご利用先など","ご利用金額(￥)","支払区分","今回回数","訂正サイン","お支払い金額(￥)","国内／海外","摘要","備考"
"****-****-****-***","≪ショッピング取組（国内）≫","2024/12/01","テスト店舗","1000","１回","","","1000","国内","","* 1"`;

    const result = parseJCBCSV(csvWithEmptyNote);
    
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].note).toBeNull();
  });
});