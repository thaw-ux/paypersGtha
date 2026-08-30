import { NextRequest, NextResponse } from 'next/server';
import { SheetsService } from '@/lib/google/sheets.service';
import { Transaction, TransactionFilter } from '@/types/transaction';
import { generateTransactionId } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter: TransactionFilter = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      type: (searchParams.get('type') as any) || undefined,
      status: searchParams.get('status') || undefined,
      documentType: searchParams.get('documentType') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    };

    const transactions = await SheetsService.getTransactions(filter);
    return NextResponse.json({ success: true, data: transactions });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id || generateTransactionId();
    const timestamp = body.timestamp || new Date().toISOString();

    const transaction: Transaction = {
      id,
      timestamp,
      date: body.date || timestamp.slice(0, 10),
      time: body.time || new Date().toTimeString().slice(0, 8),
      type: body.type || 'expense',
      category: body.category || 'ค่าใช้จ่ายทั่วไป',
      merchant: body.merchant || 'ไม่ระบุร้านค้า',
      taxId: body.taxId || null,
      subtotal: parseFloat(body.subtotal) || 0,
      vat: parseFloat(body.vat) || 0,
      wht: parseFloat(body.wht) || 0,
      grandTotal: parseFloat(body.grandTotal) || 0,
      paymentMethod: body.paymentMethod || 'other',
      documentType: body.documentType || 'receipt',
      items: Array.isArray(body.items) ? body.items : [],
      driveFileId: body.driveFileId || null,
      driveViewUrl: body.driveViewUrl || null,
      source: body.source || 'web_app',
      createdBy: body.createdBy || 'Web Admin',
      status: body.status || 'completed',
      notes: body.notes || '',
    };

    await SheetsService.appendTransaction(transaction);
    return NextResponse.json({ success: true, data: transaction });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
