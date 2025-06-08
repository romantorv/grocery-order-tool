import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import GroceryItem from '@/models/GroceryItem';

export async function POST(req: NextRequest) {
  try {
    const session = await validateSession(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { batchId } = body;

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get all items from the batch
    const batchItems = await GroceryItem.find({ batchId })
      .populate('userId', 'displayName');

    if (batchItems.length === 0) {
      return NextResponse.json(
        { error: 'Batch not found or empty' },
        { status: 404 }
      );
    }

    // Create new pending items
    const newItemsData = batchItems.map(item => ({
      userId: session._id,
      productName: item.productName,
      productUrl: item.productUrl,
      quantity: item.quantity,
      notes: `Reordered from batch: ${batchId}`,
      status: 'pending' as const
      // batchId intentionally omitted - will be assigned when completed
    }));

    const createdItems = await GroceryItem.insertMany(newItemsData);

    // Populate the created items for response
    const populatedItems = await GroceryItem.find({
      _id: { $in: createdItems.map(item => item._id) }
    }).populate('userId', 'displayName');

    return NextResponse.json({
      success: true,
      itemsCreated: createdItems.length,
      items: populatedItems
    });
  } catch (error) {
    console.error('Reorder batch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}