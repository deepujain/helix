import { NextRequest, NextResponse } from 'next/server';
import { getDailyRecords, getDailyRecordByDate, saveDailyRecord } from '@/lib/db';
import type { DailyRecord } from '@/lib/definitions';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    
    if (date) {
      const record = await getDailyRecordByDate(date);
      return NextResponse.json(record);
    }
    
    const records = await getDailyRecords();
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stock records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const record: DailyRecord = await request.json();
    const saved = await saveDailyRecord(record);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save stock record' }, { status: 500 });
  }
}
