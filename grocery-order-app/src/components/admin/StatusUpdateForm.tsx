interface GroceryItem {
  _id: string;
  productName: string;
  productUrl: string;
  quantity: number;
  price?: number;
  status: 'pending' | 'ordered' | 'completed' | 'failed';
  notes?: string;
  errorMessage?: string;
  createdAt: string;
  userId: {
    _id: string;
    displayName: string;
  };
  batchId?: {
    _id: string;
    batchName: string;
    completionDate: string;
  };
}

interface StatusUpdate {
  status: 'completed' | 'failed';
  price?: number;
  errorMessage?: string;
}

interface StatusUpdateFormProps {
  items: GroceryItem[];
  statusUpdates: { [key: string]: StatusUpdate };
  onStatusUpdate: (itemId: string, field: string, value: string | number) => void;
  onRemoveUpdate: (itemId: string) => void;
  onSubmitUpdates: () => void;
}

export default function StatusUpdateForm({
  items,
  statusUpdates,
  onStatusUpdate,
  onRemoveUpdate,
  onSubmitUpdates,
}: StatusUpdateFormProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Order Status</h2>
      <p className="text-sm text-gray-600 mb-4">
        After processing orders, update their status to completed or failed.
      </p>

      <div className="space-y-4">
        {Object.keys(statusUpdates).length === 0 ? (
          <p className="text-gray-500">No status updates pending</p>
        ) : (
          Object.entries(statusUpdates).map(([itemId, update]) => {
            const item = items.find(i => i._id === itemId);
            return (
              <div key={itemId} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">{item?.productName}</span>
                  <button
                    onClick={() => onRemoveUpdate(itemId)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={update.status || ''}
                      onChange={(e) => onStatusUpdate(itemId, 'status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    >
                      <option value="">Select status</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  {update.status === 'completed' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={update.price || ''}
                        onChange={(e) => onStatusUpdate(itemId, 'price', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                  {update.status === 'failed' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Error Message
                      </label>
                      <input
                        type="text"
                        value={update.errorMessage || ''}
                        onChange={(e) => onStatusUpdate(itemId, 'errorMessage', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                        placeholder="Describe the error"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {Object.keys(statusUpdates).length > 0 && (
          <button
            onClick={onSubmitUpdates}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Submit Status Updates ({Object.keys(statusUpdates).length})
          </button>
        )}
      </div>
    </div>
  );
}