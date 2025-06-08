import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import GroceryItem from '@/models/GroceryItem';

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
    const status = searchParams.get('status');

    const query: { userId?: string; status?: string } = {};


    // Apply status filter if provided
    if (status && ['pending', 'ordered', 'completed', 'failed'].includes(status)) {
      query.status = status;
    }

    const items = await GroceryItem.find(query)
      .populate('userId', 'displayName')
      .populate('batchId', 'batchName completionDate')
      .sort({ createdAt: -1 });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Get items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { productName, productUrl, quantity = 1, notes } = body;

    // Validation
    if (!productName || !productUrl) {
      return NextResponse.json(
        { error: 'Product name and URL are required' },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(productUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    await connectDB();

    const item = await GroceryItem.create({
      userId: session._id,
      productName: productName.trim(),
      productUrl,
      quantity,
      notes: notes?.trim(),
      status: 'pending'
    });

    const populatedItem = await GroceryItem.findById(item._id)
      .populate('userId', 'displayName');

    return NextResponse.json(populatedItem, { status: 201 });
  } catch (error) {
    console.error('Create item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}