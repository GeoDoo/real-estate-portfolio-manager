import { NextRequest, NextResponse } from 'next/server';
import { dcfDB } from '@/db/database';
import { DCFInput } from '@/types/dcf';

export async function POST(req: NextRequest) {
  try {
    const data: DCFInput = await req.json();
    const id = dcfDB.saveCalculation(data);
    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json({ error: 'Failed to save calculation' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const data = dcfDB.getCalculations();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch calculations' }, { status: 500 });
  }
} 