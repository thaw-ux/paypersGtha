import { getSheetsClient } from './auth';
import { Transaction, TransactionFilter, FinancialStats } from '@/types/transaction';

export const SHEET_COLUMNS = [
  'ID',
  'Timestamp',
  'Date',
  'Time',
  'Type',
  'Category',
  'Merchant',
  'Tax_ID',
  'Subtotal',
  'VAT',
  'WHT',
  'Grand_Total',
  'Payment_Method',
  'Document_Type',
  'Items_JSON',
  'Drive_File_ID',
  'Drive_View_URL',
  'Source',
  'Created_By',
  'Status',
  'Notes',
];

export class SheetsService {
  private static get spreadsheetId(): string {
    const id = process.env.GOOGLE_SPREADSHEET_ID;
    if (!id) {
      throw new Error('GOOGLE_SPREADSHEET_ID is not defined in environment variables.');
    }
    const match = id.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) return match[1];
    return id.trim();
  }

  private static get sheetName(): string {
    return process.env.GOOGLE_SHEET_NAME || 'Transactions';
  }

  /**
   * Check and initialize header row in Google Sheet if empty
   */
  static async initializeSheet(): Promise<{ initialized: boolean; message: string }> {
    const sheets = await getSheetsClient();
    const spreadsheetId = this.spreadsheetId;
    const sheetName = this.sheetName;

    // Check if sheet exists or fetch first row
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:U1`,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0 || rows[0].length === 0) {
        // Sheet is empty, write header row
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1:U1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [SHEET_COLUMNS],
          },
        });
        return { initialized: true, message: 'Header row initialized successfully' };
      }

      return { initialized: false, message: 'Header row already exists' };
    } catch (error: any) {
      // If the sheet tab doesn't exist, try creating it
      if (error.message?.includes('Unable to parse range') || error.message?.includes('not found')) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title: sheetName },
                },
              },
            ],
          },
        });

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1:U1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [SHEET_COLUMNS],
          },
        });

        return { initialized: true, message: `Created sheet tab "${sheetName}" and initialized headers` };
      }
      throw error;
    }
  }

  /**
   * Append a new transaction row to Google Sheets
   */
  static async appendTransaction(txn: Transaction): Promise<boolean> {
    const sheets = await getSheetsClient();
    const spreadsheetId = this.spreadsheetId;
    const sheetName = this.sheetName;

    const rowData = [
      txn.id,
      txn.timestamp || new Date().toISOString(),
      txn.date,
      txn.time || '00:00:00',
      txn.type,
      txn.category,
      txn.merchant,
      txn.taxId || '',
      txn.subtotal ?? 0,
      txn.vat ?? 0,
      txn.wht ?? 0,
      txn.grandTotal ?? 0,
      txn.paymentMethod,
      txn.documentType,
      txn.items ? JSON.stringify(txn.items) : '[]',
      txn.driveFileId || '',
      txn.driveViewUrl || '',
      txn.source || 'web_app',
      txn.createdBy || 'System',
      txn.status || 'completed',
      txn.notes || '',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:U`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowData],
      },
    });

    return true;
  }

  /**
   * Get all transactions with optional filters
   */
  static async getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
    const sheets = await getSheetsClient();
    const spreadsheetId = this.spreadsheetId;
    const sheetName = this.sheetName;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:U`, // Skip header row
    });

    const rows = response.data.values || [];
    const transactions: Transaction[] = [];

    for (const row of rows) {
      if (!row || row.length === 0 || !row[0]) continue;

      let items = [];
      try {
        if (row[14]) {
          items = JSON.parse(row[14]);
        }
      } catch {
        items = [];
      }

      const txn: Transaction = {
        id: String(row[0] || ''),
        timestamp: String(row[1] || ''),
        date: String(row[2] || ''),
        time: String(row[3] || ''),
        type: (row[4] as any) === 'income' ? 'income' : 'expense',
        category: String(row[5] || 'ทั่วไป'),
        merchant: String(row[6] || 'ไม่ระบุร้านค้า'),
        taxId: row[7] ? String(row[7]) : null,
        subtotal: parseFloat(row[8]) || 0,
        vat: parseFloat(row[9]) || 0,
        wht: parseFloat(row[10]) || 0,
        grandTotal: parseFloat(row[11]) || 0,
        paymentMethod: (row[12] || 'other') as any,
        documentType: (row[13] || 'receipt') as any,
        items,
        driveFileId: row[15] ? String(row[15]) : null,
        driveViewUrl: row[16] ? String(row[16]) : null,
        source: (row[17] || 'web_app') as any,
        createdBy: String(row[18] || 'System'),
        status: (row[19] || 'completed') as any,
        notes: String(row[20] || ''),
      };

      // Filter logic
      if (filter?.status && txn.status !== filter.status) continue;
      if (filter?.type && filter.type !== 'all' && txn.type !== filter.type) continue;
      if (filter?.category && txn.category !== filter.category) continue;
      if (filter?.documentType && txn.documentType !== filter.documentType) continue;
      if (filter?.startDate && txn.date < filter.startDate) continue;
      if (filter?.endDate && txn.date > filter.endDate) continue;
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        const match =
          txn.merchant.toLowerCase().includes(q) ||
          txn.category.toLowerCase().includes(q) ||
          txn.id.toLowerCase().includes(q) ||
          (txn.taxId && txn.taxId.includes(q)) ||
          (txn.notes && txn.notes.toLowerCase().includes(q));
        if (!match) continue;
      }

      transactions.push(txn);
    }

    // Sort newest date first
    return transactions.sort((a, b) => {
      const dateA = `${a.date} ${a.time}`;
      const dateB = `${b.date} ${b.time}`;
      return dateB.localeCompare(dateA);
    });
  }

  /**
   * Get single transaction by ID
   */
  static async getTransactionById(id: string): Promise<Transaction | null> {
    const transactions = await this.getTransactions();
    return transactions.find((t) => t.id === id) || null;
  }

  /**
   * Update transaction by ID
   */
  static async updateTransaction(id: string, updates: Partial<Transaction>): Promise<boolean> {
    const sheets = await getSheetsClient();
    const spreadsheetId = this.spreadsheetId;
    const sheetName = this.sheetName;

    // 1. Find the row index
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`,
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === id) {
        rowIndex = i + 1; // 1-indexed row number in Google Sheets
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error(`Transaction with ID ${id} not found.`);
    }

    // 2. Fetch current row
    const currentRowRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A${rowIndex}:U${rowIndex}`,
    });

    const currentValues = currentRowRes.data.values?.[0] || [];

    // 3. Merge values
    const updatedRow = [
      id,
      updates.timestamp ?? currentValues[1] ?? new Date().toISOString(),
      updates.date ?? currentValues[2] ?? '',
      updates.time ?? currentValues[3] ?? '',
      updates.type ?? currentValues[4] ?? 'expense',
      updates.category ?? currentValues[5] ?? '',
      updates.merchant ?? currentValues[6] ?? '',
      updates.taxId !== undefined ? updates.taxId : (currentValues[7] ?? ''),
      updates.subtotal !== undefined ? updates.subtotal : (parseFloat(currentValues[8]) || 0),
      updates.vat !== undefined ? updates.vat : (parseFloat(currentValues[9]) || 0),
      updates.wht !== undefined ? updates.wht : (parseFloat(currentValues[10]) || 0),
      updates.grandTotal !== undefined ? updates.grandTotal : (parseFloat(currentValues[11]) || 0),
      updates.paymentMethod ?? currentValues[12] ?? 'other',
      updates.documentType ?? currentValues[13] ?? 'receipt',
      updates.items !== undefined ? JSON.stringify(updates.items) : (currentValues[14] ?? '[]'),
      updates.driveFileId !== undefined ? updates.driveFileId : (currentValues[15] ?? ''),
      updates.driveViewUrl !== undefined ? updates.driveViewUrl : (currentValues[16] ?? ''),
      updates.source ?? currentValues[17] ?? 'web_app',
      updates.createdBy ?? currentValues[18] ?? 'System',
      updates.status ?? currentValues[19] ?? 'completed',
      updates.notes !== undefined ? updates.notes : (currentValues[20] ?? ''),
    ];

    // 4. Update the row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${rowIndex}:U${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow],
      },
    });

    return true;
  }

  /**
   * Delete transaction (Soft delete by status or removal)
   */
  static async deleteTransaction(id: string, softDelete: boolean = true): Promise<boolean> {
    if (softDelete) {
      return this.updateTransaction(id, { status: 'deleted' });
    }

    const sheets = await getSheetsClient();
    const spreadsheetId = this.spreadsheetId;
    const sheetName = this.sheetName;

    // Find row index
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`,
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === id) {
        rowIndex = i; // 0-indexed for batchUpdate
        break;
      }
    }

    if (rowIndex === -1) return false;

    // Fetch sheetId
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = meta.data.sheets?.find((s) => s.properties?.title === sheetName);
    const sheetId = sheet?.properties?.sheetId || 0;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });

    return true;
  }

  /**
   * Calculate Financial Statistics for Dashboard
   */
  static async getFinancialStats(yearMonth?: string): Promise<FinancialStats> {
    const all = await this.getTransactions();
    // Exclude deleted items
    const active = all.filter((t) => t.status !== 'deleted');

    // Filter by yearMonth (YYYY-MM) if provided
    const txns = yearMonth ? active.filter((t) => t.date.startsWith(yearMonth)) : active;

    let totalExpense = 0;
    let totalIncome = 0;
    let totalVatClaimable = 0;
    let totalWht = 0;

    const categoryMap: Record<string, { amount: number; count: number }> = {};
    const methodMap: Record<string, number> = {};
    const monthlyTrendMap: Record<string, { expense: number; income: number }> = {};

    for (const t of txns) {
      const amount = t.grandTotal || 0;
      if (t.type === 'expense') {
        totalExpense += amount;
        totalVatClaimable += t.vat || 0;
        totalWht += t.wht || 0;

        // Category breakdown
        const cat = t.category || 'ทั่วไป';
        if (!categoryMap[cat]) categoryMap[cat] = { amount: 0, count: 0 };
        categoryMap[cat].amount += amount;
        categoryMap[cat].count += 1;
      } else {
        totalIncome += amount;
      }

      // Payment method
      const method = t.paymentMethod || 'other';
      methodMap[method] = (methodMap[method] || 0) + amount;

      // Monthly trend (from all active txns)
      const monthKey = t.date ? t.date.slice(0, 7) : 'Unknown';
      if (!monthlyTrendMap[monthKey]) {
        monthlyTrendMap[monthKey] = { expense: 0, income: 0 };
      }
      if (t.type === 'expense') {
        monthlyTrendMap[monthKey].expense += amount;
      } else {
        monthlyTrendMap[monthKey].income += amount;
      }
    }

    const categoryBreakdown = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);

    const monthlyTrends = Object.entries(monthlyTrendMap)
      .map(([month, data]) => ({
        month,
        expense: data.expense,
        income: data.income,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const paymentMethodBreakdown = Object.entries(methodMap).map(([method, amount]) => ({
      method,
      amount,
    }));

    return {
      totalExpense,
      totalIncome,
      netProfit: totalIncome - totalExpense,
      totalVatClaimable,
      totalWht,
      transactionCount: txns.length,
      categoryBreakdown,
      monthlyTrends,
      paymentMethodBreakdown,
    };
  }

  /**
   * Test connection to Google Sheets
   */
  static async testConnection(): Promise<{ success: boolean; sheetTitle?: string; rowCount?: number; error?: string }> {
    try {
      const sheets = await getSheetsClient();
      const spreadsheetId = this.spreadsheetId;
      const sheetName = this.sheetName;

      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const sheet = meta.data.sheets?.find((s) => s.properties?.title === sheetName);

      const rowsRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:A`,
      });

      return {
        success: true,
        sheetTitle: meta.data.properties?.title || spreadsheetId,
        rowCount: (rowsRes.data.values?.length || 1) - 1,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Sheets connection failed' };
    }
  }
}
