import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import GroceryItem from '@/models/GroceryItem';

export async function POST(req: NextRequest) {
  try {
    const session = await validateSession(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { itemIds } = body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'Item IDs array is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Update items status to ordered
    const result = await GroceryItem.updateMany(
      {
        _id: { $in: itemIds },
        status: 'pending'
      },
      {
        status: 'ordered',
        orderedAt: new Date()
      }
    );

    // Get updated items for Chrome extension export
    const orderedItems = await GroceryItem.find({
      _id: { $in: itemIds },
      status: 'ordered'
    }).populate('userId', 'displayName');

    // Format for Chrome extension
    const extensionData = orderedItems.map(item => ({
      id: item._id.toString(),
      productName: item.productName,
      productUrl: item.productUrl,
      quantity: item.quantity,
      notes: item.notes,
      userDisplayName: item.userId?.displayName ?? 'Unknown User'
    }));

    return NextResponse.json({
      success: true,
      itemsUpdated: result.modifiedCount,
      extensionData
    });
  } catch (error) {
    console.error('Mark ordered error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}