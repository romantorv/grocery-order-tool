import connectDB from './mongodb';
import GroceryItem, { IGroceryItem } from '@/models/GroceryItem';
import OrderBatch from '@/models/OrderBatch';

export class BatchService {
  static async processCompletedItems(completedItemIds: string[]) {
    await connectDB();

    const items = await GroceryItem.find({
      _id: { $in: completedItemIds },
      status: 'completed',
      batchId: null
    });

    if (items.length === 0) {
      return [];
    }

    // Group items by completion date
    const itemsByDate: { [key: string]: IGroceryItem[] } = {};
    items.forEach(item => {
      const dateKey = item.completedAt.toISOString().split('T')[0];
      if (!itemsByDate[dateKey]) {
        itemsByDate[dateKey] = [];
      }
      itemsByDate[dateKey].push(item);
    });

    const createdBatches = [];

    for (const [dateKey, dateItems] of Object.entries(itemsByDate)) {
      // Check if batch already exists for this date
      let batch = await OrderBatch.findOne({
        completionDate: new Date(dateKey)
      });

      if (!batch) {
        // Create new batch
        batch = await OrderBatch.create({
          batchName: `Order - ${dateKey}`,
          completionDate: new Date(dateKey),
          itemCount: dateItems.length,
          totalValue: dateItems.reduce((sum, item) => sum + (item.price || 0), 0),
          createdBy: 'system'
        });
        createdBatches.push(batch);
      } else {
        // Update existing batch counts
        batch.itemCount += dateItems.length;
        batch.totalValue += dateItems.reduce((sum, item) => sum + (item.price || 0), 0);
        await batch.save();
      }

      // Assign batchId to items
      await GroceryItem.updateMany(
        { _id: { $in: dateItems.map(item => item._id) } },
        { batchId: batch._id }
      );
    }

    return createdBatches;
  }

  static async createBatchesFromCompletedItems() {
    await connectDB();

    // Find completed items without batchId, grouped by completion date
    const itemsByDate = await GroceryItem.aggregate([
      { $match: { status: 'completed', batchId: null } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          items: { $push: "$$ROOT" },
          count: { $sum: 1 },
          totalValue: { $sum: "$price" }
        }
      }
    ]);

    const createdBatches = [];

    for (const dateGroup of itemsByDate) {
      // Create batch for this date
      const batch = await OrderBatch.create({
        batchName: `Order - ${dateGroup._id}`,
        completionDate: new Date(dateGroup._id),
        itemCount: dateGroup.count,
        totalValue: dateGroup.totalValue || 0,
        createdBy: 'system'
      });

      createdBatches.push(batch);

      // Assign batchId to all items from this date
      await GroceryItem.updateMany(
        { _id: { $in: dateGroup.items.map((item: IGroceryItem) => item._id) } },
        { batchId: batch._id }
      );
    }

    return createdBatches;
  }
}