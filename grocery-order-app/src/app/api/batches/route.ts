import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import OrderBatch from '@/models/OrderBatch';

export async function GET(req: NextRequest) {
  try {
    const session = await validateSession(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const batches = await OrderBatch.find()
      .sort({ completionDate: -1 }) // Newest first
      .limit(limit)
      .skip(offset)
      .select('batchName completionDate itemCount totalValue createdBy notes createdAt');

    return NextResponse.json(batches);
  } catch (error) {
    console.error('Get batches error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}