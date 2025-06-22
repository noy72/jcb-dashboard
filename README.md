# JCB利用明細管理ダッシュボード

JCBクレジットカードの利用明細CSVファイルを管理・分析するためのNext.jsアプリケーションです。SHIFT-JISエンコーディングに対応し、階層カテゴリシステムによる詳細な支出分析が可能です。

## 主な機能

### 📊 ダッシュボード
- **期間別分析**: 全期間、直近1年、半年、3ヶ月の期間選択
- **階層カテゴリ表示**: 大カテゴリ・小カテゴリの2階層での支出分析
- **視覚的チャート**:
  - 全期間カテゴリ別支出割合（ドーナツチャート）
  - 月別カテゴリ別支出割合（月選択可能）
  - 月別カテゴリ別利用金額（積み上げ棒グラフ）
- **詳細表示切り替え**: 大カテゴリのみ ⇔ 詳細（大+小）カテゴリ表示

### 💳 取引管理
- **CSVインポート**: JCB利用明細CSVファイルの直接アップロード
- **エンコーディング対応**: SHIFT-JIS・UTF-8の自動判定
- **店舗ベースカテゴリ**: 店舗ごとに階層カテゴリを自動適用
- **月別フィルタ**: 利用月（取引日）による絞り込み

### 🏷️ 階層カテゴリシステム
- **大カテゴリ**: 食費、交通費、娯楽費などの主要分類
- **小カテゴリ**: 大カテゴリ内での詳細分類（例：食費 > 外食、食費 > 食材）
- **柔軟な管理**: 大カテゴリのみでの分類も可能
- **重複対応**: 異なる大カテゴリ内で同名小カテゴリが使用可能

## 技術スタック

- **Frontend**: Next.js 13+ (App Router), React, TypeScript
- **UI**: Chakra UI, Chart.js (react-chartjs-2)
- **Backend**: Next.js Server Actions
- **Database**: SQLite + Prisma ORM
- **Testing**: Vitest
- **CSV Processing**: Papa Parse

## データベース設計

```
MajorCategory (大カテゴリ)
├── MinorCategory (小カテゴリ)
└── StoreHierarchicalCategoryMapping (店舗マッピング)

Statement (明細書)
└── Transaction (取引)
```

## セットアップ

### 前提条件
- Node.js 18+
- npm/yarn/pnpm

### インストール

```bash
# リポジトリクローン
git clone <repository-url>
cd jcb-dashboard

# 依存関係インストール
npm install

# データベース初期化
npx prisma migrate dev

# 開発サーバー起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションにアクセスします。

## 使用方法

### 1. CSVファイルのインポート
1. 明細管理ページ（`/transactions`）にアクセス
2. JCBから取得したCSVファイルをアップロード
3. SHIFT-JISエンコーディングを自動判定してインポート

### 2. カテゴリ設定
1. 「階層カテゴリを管理」ボタンで大・小カテゴリを作成
2. 各店舗に対してカテゴリを割り当て
3. 同じ店舗の全取引に自動適用

### 3. 分析・レポート
1. ダッシュボードで期間とカテゴリ詳細度を選択
2. 各種チャートで支出パターンを分析
3. 月別・カテゴリ別の詳細データを確認

## ファイル構成

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # ダッシュボード
│   └── transactions/page.tsx    # 取引管理
├── components/                   # UIコンポーネント
│   ├── Dashboard.tsx            # メインダッシュボード
│   ├── HierarchicalTransactionsList.tsx  # 取引一覧
│   ├── MonthlyCategoryChart.tsx # 月別チャート
│   └── HierarchicalCategoryModal.tsx     # カテゴリ管理
├── lib/
│   ├── actions/                 # Server Actions
│   │   ├── hierarchical-categories.ts
│   │   └── import.ts
│   ├── csv-parser.ts           # CSV解析ロジック
│   ├── hierarchical-dashboard-utils.ts   # ダッシュボード計算
│   └── prisma.ts               # データベース接続
└── prisma/
    ├── schema.prisma           # データベーススキーマ
    └── migrations/             # マイグレーションファイル
```

## 開発コマンド

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# テスト実行
npm run test

# データベースリセット
npx prisma migrate reset

# Prisma Studio (DB管理画面)
npx prisma studio
```

## 環境変数

`.env`ファイルを作成し、以下を設定：

```bash
DATABASE_URL="file:./main.db"
```

## CSVファイル形式

JCBから提供される利用明細CSVファイルに対応：
- **ヘッダー情報**: 支払日、合計金額、国内・海外金額
- **取引詳細**: 利用日、店名、金額、支払区分、摘要
- **エンコーディング**: SHIFT-JIS（UTF-8フォールバック対応）

## ライセンス

MIT License

---

このプロジェクトは [Next.js](https://nextjs.org) をベースに、[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) でブートストラップされました。
