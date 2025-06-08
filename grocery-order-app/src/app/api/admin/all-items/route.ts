import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import GroceryItem from '@/models/GroceryItem';

export async function GET(req: NextRequest) {
  try {
    const session = await validateSession(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const query: { status?: string } = {};
    if (status) {
      query.status = status;
    }

    const items = await GroceryItem.find(query)
      .populate('userId', 'displayName')
      .populate('batchId', 'batchName completionDate')
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    return NextResponse.json(items);
  } catch (error) {
    console.error('Get all items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}