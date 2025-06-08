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

    const pendingItems = await GroceryItem.find({ status: 'pending' })
      .populate('userId', 'displayName')
      .sort({ createdAt: 1 }); // Sort by creation date, oldest first

    return NextResponse.json(pendingItems);
  } catch (error) {
    console.error('Get pending items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
