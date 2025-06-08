import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import GroceryItem from '@/models/GroceryItem';
import { BatchService } from '@/lib/batchService';

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
    const { updates } = body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Updates array is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const completedItemIds: string[] = [];

    // Process each update
    for (const update of updates) {
      const { itemId, status, errorMessage, price } = update;

      if (!itemId || !status) {
        continue; // Skip invalid updates
      }

      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (status === 'completed') {
        updateData.completedAt = new Date();
        if (price !== undefined) {
          updateData.price = price;
        }
        completedItemIds.push(itemId);
      } else if (status === 'failed' && errorMessage) {
        updateData.errorMessage = errorMessage;
      }

      await GroceryItem.findByIdAndUpdate(itemId, updateData);
    }

    // Trigger batch creation for completed items
    let batchesCreated = 0;
    if (completedItemIds.length > 0) {
      const createdBatches = await BatchService.processCompletedItems(completedItemIds);
      batchesCreated = createdBatches.length;
    }

    return NextResponse.json({
      success: true,
      itemsProcessed: updates.length,
      batchesCreated
    });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}