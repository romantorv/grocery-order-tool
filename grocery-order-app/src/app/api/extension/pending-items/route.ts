import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GroceryItem from '@/models/GroceryItem';

export async function GET() {
  try {
    await connectDB();

    const pendingItems = await GroceryItem.find({ status: 'pending' })
      .populate('userId', 'displayName')
      .sort({ createdAt: 1 }); // Sort by creation date, oldest first

    // Format items for extension with consistent field names
    const formattedItems = pendingItems.map(item => ({
      _id: item._id.toString(),
      productName: item.productName,
      productUrl: item.productUrl,
      quantity: item.quantity,
      notes: item.notes,
      userName: (item.userId as { displayName: string })?.displayName || 'Unknown User',
      createdAt: item.createdAt,
      status: item.status
    }));

    const response = NextResponse.json({
      success: true,
      items: formattedItems,
      count: formattedItems.length
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
  } catch (error) {
    console.error('Get pending items error:', error);
    const errorResponse = NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );

    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}