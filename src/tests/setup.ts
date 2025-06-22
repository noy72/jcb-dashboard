import { execSync } from 'child_process';
import { afterAll, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const dbPath = path.join(__dirname, '../../prisma/test.db');

beforeAll(() => {
  // テスト用のDBファイルを指すように環境変数を設定
  process.env.DATABASE_URL = `file:${dbPath}`;
  // テストDBのマイグレーションを実行
  execSync('npx prisma migrate deploy', {
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
    },
  });
});

afterAll(async () => {
  // テスト後にDB接続を切り、ファイルを削除
  await prisma.$disconnect();
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  const dbWalPath = dbPath + '-wal';
  if (fs.existsSync(dbWalPath)) {
    fs.unlinkSync(dbWalPath);
  }
  const dbShmPath = dbPath + '-shm';
    if (fs.existsSync(dbShmPath)) {
    fs.unlinkSync(dbShmPath);
  }
});