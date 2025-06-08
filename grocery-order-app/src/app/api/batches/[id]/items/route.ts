import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import GroceryItem from '@/models/GroceryItem';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateSession(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const items = await GroceryItem.find({ batchId: id })
      .populate('userId', 'displayName')
      .sort({ createdAt: 1 });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Get batch items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}