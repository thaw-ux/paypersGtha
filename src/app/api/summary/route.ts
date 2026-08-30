import { NextRequest, NextResponse } from 'next/server';
import { SheetsService } from '@/lib/google/sheets.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || undefined; // YYYY-MM

    const stats = await SheetsService.getFinancialStats(month);
    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching summary stats:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
