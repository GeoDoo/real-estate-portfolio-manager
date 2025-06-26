import { NextRequest, NextResponse } from 'next/server';
import { dcfDB } from '@/db/database';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = dcfDB.getCalculation(id);
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch calculation' }, { status: 500 });
  }
} 