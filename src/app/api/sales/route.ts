import { NextRequest, NextResponse } from 'next/server';
import { getSalesRecords, getSalesRecordByDate, saveSalesRecord } from '@/lib/db';
import type { SalesRecord } from '@/lib/definitions';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    
    if (date) {
      const record = await getSalesRecordByDate(date);
      return NextResponse.json(record);
    }
    
    const records = await getSalesRecords();
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sales records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const record: SalesRecord = await request.json();
    const saved = await saveSalesRecord(record);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save sales record' }, { status: 500 });
  }
}
