# Technical Development Guide: Grocery Ordering Web Interface (Simplified Batch Model)

**Document Purpose:** Complete technical specification with simplified batch management - batches are created automatically from completed orders for reordering purposes.

**Target Audience:** AI agents, developers, and QA engineers for implementation and testing.

---

## Project Overview

### Core Requirements (Updated)
- **Anonymous Access:** Users enter display name + shared secret code
- **Member Interface:** Submit grocery items with URL, quantity, and notes (no batch selection)
- **Admin Interface:** Order management, item selection, and Chrome extension integration
- **Automatic Batching:** System creates batches from items completed on the same date
- **Reorder Feature:** Users can reorder entire batches for convenience
- **Status Tracking:** pending → ordered → completed workflow
- **Chrome Extension Integration:** Export selected items for automation

### Updated Workflow
1. **Members:** Submit individual items (no batch awareness)
2. **Admin:** Select pending items and mark as ordered via Chrome extension
3. **System:** Automatically creates batches from items completed on the same date
4. **Reordering:** Members can browse historical batches and reorder items

---

## Database Architecture (Updated)

### Collection Schemas

#### AppSettings Collection
```json
{
  "_id": "ObjectId",
  "key": "string (e.g., 'member_access_code', 'admin_access_code')",
  "value": "string (the secret code)",
  "description": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Users Collection
```json
{
  "_id": "ObjectId",
  "displayName": "string (1-50 chars, user-chosen)",
  "role": "enum ['member', 'admin']",
  "sessionId": "string (unique session identifier)",
  "lastActive": "Date",
  "createdAt": "Date"
}
```

#### GroceryItems Collection (Updated)
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: Users)",
  "batchId": "ObjectId (ref: OrderBatches, auto-assigned after completion)",
  "productName": "string (required)",
  "productUrl": "string (URL validation required)",
  "quantity": "number (min: 1)",
  "price": "number (optional, min: 0)",
  "status": "enum ['pending', 'ordered', 'completed', 'failed']",
  "notes": "string (optional)",
  "errorMessage": "string (for failed orders)",
  "orderedAt": "Date (when admin marks as ordered)",
  "completedAt": "Date (when order fulfillment completes)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### OrderBatches Collection (Updated - Auto-generated)
```json
{
  "_id": "ObjectId",
  "batchName": "string (auto-generated: 'Order - YYYY-MM-DD')",
  "completionDate": "Date (date when items were completed)",
  "itemCount": "number (count of items in this batch)",
  "totalValue": "number (sum of item prices if available)",
  "createdBy": "string ('system' for auto-generated batches)",
  "notes": "string (optional admin notes)",
  "createdAt": "Date (when batch was auto-created)",
  "updatedAt": "Date"
}
```

### Database Indexes
- AppSettings: `{ key: 1 }`
- Users: `{ sessionId: 1 }`, `{ displayName: 1, role: 1 }`
- OrderBatches: `{ completionDate: -1 }`, `{ itemCount: 1 }`
- GroceryItems: `{ userId: 1, status: 1 }`, `{ status: 1, completedAt: 1 }`, `{ batchId: 1 }`

---

## API Endpoints Specification (Updated)

### Authentication Endpoints (Same as before)

#### POST `/api/auth/access`
- **Purpose:** Authenticate with access code and display name
- **Body:** `{ displayName, accessCode }`
- **Response:** `{ success: true, user: { displayName, role, sessionId } }`

### Items Management Endpoints (Updated)

#### GET `/api/items`
- **Auth Required:** Valid session
- **Query Params:**
  - `status` (optional): filter by item status
  - `userId` (optional, admin only): filter by specific user
- **Response:** Array of items with populated batch info for completed items
- **Permissions:** Members see only their items, admins see all

#### POST `/api/items`
- **Auth Required:** Valid session (member or admin)
- **Body:**
  ```json
  {
    "productName": "string (required)",
    "productUrl": "string (required, valid URL)",
    "quantity": "number (min: 1, default: 1)",
    "notes": "string (optional)"
  }
  ```
- **Logic:** Create item with status 'pending', no batchId assigned
- **Response:** Created item object

#### POST `/api/items/reorder-batch`
- **Auth Required:** Valid session
- **Body:** `{ batchId: "string" }`
- **Purpose:** Reorder all items from a historical batch
- **Logic:**
  1. Get all items from the specified batch
  2. Create new items with same details but status 'pending'
  3. Clear batchId (will be assigned when completed)
- **Response:** Array of newly created items

### Admin Order Management (Updated)

#### GET `/api/admin/pending-items`
- **Auth Required:** Admin session
- **Response:** All pending items from all users with user displayName
- **Sorting:** By creation date, grouped by user

#### POST `/api/admin/mark-ordered`
- **Auth Required:** Admin session
- **Body:** `{ itemIds: string[] }`
- **Purpose:** Mark selected items as ordered (for Chrome extension processing)
- **Actions:**
  - Update items status to 'ordered'
  - Set orderedAt timestamp
- **Response:** Extension-compatible export format

#### POST `/api/admin/update-status`
- **Auth Required:** Admin session
- **Body:**
  ```json
  {
    "updates": [
      {
        "itemId": "string",
        "status": "completed|failed",
        "errorMessage": "string (optional, for failed items)",
        "price": "number (optional)"
      }
    ]
  }
  ```
- **Purpose:** Update item statuses after Chrome extension processing
- **Logic:**
  - Update item status and completedAt timestamp
  - Trigger batch creation for newly completed items
- **Response:** `{ success: true, batchesCreated: number }`

### Batch Management (Updated - Read-only for users)

#### GET `/api/batches`
- **Auth Required:** Valid session
- **Query Params:**
  - `limit` (optional): number of batches to return (default: 20)
  - `offset` (optional): pagination offset
- **Response:** Array of batches ordered by completion date (newest first)
- **Include:** itemCount, totalValue, completionDate

#### GET `/api/batches/[id]/items`
- **Auth Required:** Valid session
- **Response:** All items in the batch with user displayNames
- **Purpose:** View batch contents for reordering

#### POST `/api/admin/batches/[id]/notes`
- **Auth Required:** Admin session
- **Body:** `{ notes: "string" }`
- **Purpose:** Add admin notes to existing batch

### System Batch Creation (Automatic)

#### Internal Function: `createBatchesFromCompletedItems()`
- **Trigger:** Called after items are marked as completed
- **Logic:**
  ```javascript
  async function createBatchesFromCompletedItems() {
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

    for (const dateGroup of itemsByDate) {
      // Create batch for this date
      const batch = await OrderBatch.create({
        batchName: `Order - ${dateGroup._id}`,
        completionDate: new Date(dateGroup._id),
        itemCount: dateGroup.count,
        totalValue: dateGroup.totalValue || 0,
        createdBy: 'system'
      });

      // Assign batchId to all items from this date
      await GroceryItem.updateMany(
        { _id: { $in: dateGroup.items.map(item => item._id) } },
        { batchId: batch._id }
      );
    }
  }
  ```

---

## Frontend Architecture (Updated)

### Page Structure

#### `/` - Access Page (Same as before)

#### `/dashboard` - Member Dashboard (Updated)
- **Components:**
  - WelcomeHeader
  - AddItemForm
  - ItemsList (pending, ordered, completed tabs)
  - RecentBatchesList
  - ReorderBatchButton
- **Features:**
  - Add new wishlist items
  - View items by status
  - Browse recent order batches
  - One-click reorder from previous batches

#### `/admin` - Admin Dashboard (Updated)
- **Components:**
  - AdminHeader
  - PendingItemsTable
  - BulkOrderActions
  - ExtensionExportButton
  - StatusUpdateForm
  - BatchesList (with notes)
- **Features:**
  - View all pending items from all users
  - Bulk select items for ordering
  - Export to Chrome extension
  - Update item statuses after ordering
  - View/annotate historical batches

#### `/batches` - Batch History Page
- **Auth Required:** Valid session
- **Components:**
  - BatchCard
  - BatchItemsList
  - ReorderButton
- **Features:**
  - Browse historical order batches
  - View items in each batch
  - Reorder entire batches

### Component Specifications (Updated)

#### AddItemForm Component (Simplified)
- **Fields:** productName, productUrl, quantity, notes
- **No batch selection:** Items automatically get status 'pending'
- **Validation:** Same as before
- **UX:** Focus on simplicity - just add items to wishlist

#### PendingItemsTable Component (Admin)
- **Features:**
  - Show all pending items from all users
  - Checkbox selection for bulk operations
  - User name column
  - Submission date column
  - Bulk "Mark as Ordered" action
- **Sorting:** By user, by date, by product name

#### RecentBatchesList Component
- **Props:** limit (default: 5)
- **Features:**
  - Show recent completed batches
  - Display batch date, item count, total value
  - Quick reorder button for each batch
- **Performance:** Paginated loading

#### StatusUpdateForm Component (Admin)
- **Purpose:** Update items after Chrome extension processing
- **Features:**
  - Bulk status updates (completed/failed)
  - Price entry for completed items
  - Error message entry for failed items
  - Automatic batch creation trigger

---

## Batch Auto-Creation Logic

### Batch Creation Rules
1. **Trigger:** When items are marked as 'completed'
2. **Grouping:** By completion date (same calendar day)
3. **Naming:** "Order - YYYY-MM-DD"
4. **Assignment:** Automatic batchId assignment to completed items

### Implementation Details

```javascript
// Batch creation service
class BatchService {
  static async processCompletedItems(completedItemIds) {
    const items = await GroceryItem.find({
      _id: { $in: completedItemIds },
      status: 'completed',
      batchId: null
    });

    // Group by completion date
    const itemsByDate = {};
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
}
```

---

## Reorder Feature Implementation

### Reorder Workflow
1. **Browse Batches:** User views historical batches
2. **Select Batch:** User clicks "Reorder this batch"
3. **Confirm Items:** System shows items that will be reordered
4. **Create New Items:** System creates new pending items with same details
5. **Dashboard Update:** New items appear in user's pending list

### API Implementation

```javascript
// POST /api/items/reorder-batch
export default async function handler(req, res) {
  const { batchId } = req.body;
  const session = await validateSession(req);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get all items from the batch
    const batchItems = await GroceryItem.find({ batchId })
      .populate('userId', 'displayName');

    // Create new pending items
    const newItems = batchItems.map(item => ({
      userId: session.user._id,
      productName: item.productName,
      productUrl: item.productUrl,
      quantity: item.quantity,
      notes: `Reordered from batch: ${item.batchId}`,
      status: 'pending'
      // batchId intentionally omitted - will be assigned when completed
    }));

    const createdItems = await GroceryItem.insertMany(newItems);

    res.json({
      success: true,
      itemsCreated: createdItems.length,
      items: createdItems
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder batch' });
  }
}
```

---

## Testing Strategy (Updated)

### Unit Tests

#### Batch Creation Tests
```javascript
describe('Automatic Batch Creation', () => {
  test('creates batch when items completed on same date', async () => {
    // Create items and mark as completed on same date
    // Verify batch is created and items are assigned
  });

  test('adds items to existing batch for same date', async () => {
    // Create batch for date X
    // Complete more items on date X
    // Verify items added to existing batch
  });

  test('creates separate batches for different dates', async () => {
    // Complete items on different dates
    // Verify separate batches created
  });
});
```

#### Reorder Tests
```javascript
describe('Batch Reordering', () => {
  test('reorder creates new pending items', async () => {
    // Create completed batch
    // Reorder batch
    // Verify new pending items created with same details
  });

  test('reordered items have no batchId initially', async () => {
    // Reorder batch
    // Verify new items have batchId = null
  });
});
```

### Integration Tests

#### Complete Order Workflow
```javascript
describe('End-to-end Order Workflow', () => {
  test('complete workflow: submit → order → complete → batch creation', async () => {
    // 1. Member submits items
    // 2. Admin marks as ordered
    // 3. Admin marks as completed
    // 4. Verify batch auto-created
    // 5. Verify items assigned to batch
  });

  test('reorder workflow creates new pending items', async () => {
    // 1. Complete above workflow
    // 2. Reorder the created batch
    // 3. Verify new pending items exist
    // 4. Complete reordered items
    // 5. Verify new batch created for reorder
  });
});
```