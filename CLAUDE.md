# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js credit card statement dashboard application that imports JCB credit card CSV files and provides transaction management with categorization and visualization. The application uses TypeScript, Prisma with SQLite, and Chakra UI.

## Development Commands

### Core Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests with Vitest
- `npm test:ui` - Run tests with Vitest UI

### Database Commands
- `npx prisma migrate dev` - Run database migrations
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open Prisma Studio for database inspection
- `npx prisma generate` - Generate Prisma client

### Testing
- Tests use Vitest with jsdom environment
- Test helpers are available in `src/tests/helpers.ts`
- Single-threaded execution is configured for database operations

## Architecture

### Database Schema
The application uses a relational model with four main entities:

1. **Statement** - Represents monthly payment statements from CSV imports
   - Contains payment date, total amount, and import timestamp
   - One-to-many relationship with transactions

2. **Transaction** - Individual credit card transactions
   - Linked to statements and optionally to categories
   - Contains transaction date, store name, amount, payment type, and notes

3. **Category** - Expense categories for transaction classification
   - Unique names, linked to transactions and store mappings

4. **StoreCategoryMapping** - Automatic categorization rules
   - Maps store names to categories for future imports

### API Structure
- `POST /api/import` - CSV import endpoint for JCB statements
- `GET /api/transactions` - Fetch transactions with optional statement filtering
- `PUT /api/transactions/[id]` - Update transaction category

### CSV Import Logic
The import API handles JCB-specific CSV format:
- Extracts payment date and total amount from header lines (1-5)
- Parses transaction details from remaining lines
- Automatically categorizes transactions based on store mappings
- Prevents duplicate imports using statement ID, date, store name, and amount
- Skips transactions starting with "ＪＣＢ" (system entries)

### Key Libraries and Dependencies
- **Next.js 15** with App Router
- **Prisma** for database ORM with SQLite
- **Chakra UI** for component library
- **Papa Parse** for CSV parsing
- **Chart.js & react-chartjs-2** for data visualization
- **Vitest** for testing

### File Structure
- `src/app/api/` - API routes
- `src/lib/prisma.ts` - Prisma client instance
- `src/tests/` - Test utilities and helpers
- `prisma/` - Database schema and migrations
- `assets/data/` - Sample CSV data

### Development Workflow
The project includes AI agent workflow documentation in `AGENT_WORKFLOW.md` with specific guidelines for:
- Feature branch workflow
- Test execution in non-watch mode
- Debug logging practices
- Task completion reporting

## Important Notes

### Database
- Uses SQLite for development (`prisma/dev.db`)
- All monetary amounts stored as integers (yen)
- Automatic timestamps on all models

### CSV Format Expectations
- JCB-specific format with header information in first 5 lines
- Transaction details start from line 6
- Japanese column headers: ご利用日, ご利用先など, ご利用金額(￥), 支払区分, 摘要

### Testing Considerations
- Database operations use single-threaded execution
- Test helpers provide factory functions for creating test data
- Use `prisma.$disconnect()` in test cleanup when needed