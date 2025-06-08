import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GroceryItem from '@/models/GroceryItem';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemIds } = body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Item IDs array is required' },
        { status: 400 }
      );

      // Add CORS headers to error response
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');

      return errorResponse;
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

    const response = NextResponse.json({
      success: true,
      itemsUpdated: result.modifiedCount,
      message: `${result.modifiedCount} items marked as ordered`
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
  } catch (error) {
    console.error('Mark ordered error:', error);
    const errorResponse = NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );

    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return errorResponse;
  }
}

// Enable CORS for Chrome extension
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}