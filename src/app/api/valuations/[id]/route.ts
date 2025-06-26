import { NextRequest, NextResponse } from 'next/server';
import { dcfDB } from '@/db/database';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = Number(id);
    const data = dcfDB.getCalculation(idNum);
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch calculation' }, { status: 500 });
  }
} 