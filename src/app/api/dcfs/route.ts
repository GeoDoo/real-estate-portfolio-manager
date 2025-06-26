import { NextResponse } from 'next/server';
import { dcfDB } from '@/db/database';

export async function GET() {
  try {
    const data = dcfDB.getCalculations();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch calculations' }, { status: 500 });
  }
} 