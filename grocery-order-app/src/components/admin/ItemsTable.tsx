type TabType = 'pending' | 'ordered' | 'completed' | 'batches';

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

interface ItemsTableProps {
  activeTab: TabType;
  items: GroceryItem[];
  selectedItems: string[];
  onSelectItem: (itemId: string) => void;
  onSelectAll: () => void;
  onMarkOrdered: () => void;
  onMarkCompleted?: () => void;
}

export default function ItemsTable({
  activeTab,
  items,
  selectedItems,
  onSelectItem,
  onSelectAll,
  onMarkOrdered,
  onMarkCompleted
}: ItemsTableProps) {
  if (activeTab === 'batches') {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 capitalize">{activeTab} Items</h2>
        {(activeTab === 'pending' || activeTab === 'ordered') && (
          <div className="flex space-x-4">
            <button
              onClick={onSelectAll}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              {selectedItems.length === items.length ? 'Deselect All' : 'Select All'}
            </button>
            {activeTab === 'pending' && (
              <button
                onClick={onMarkOrdered}
                disabled={selectedItems.length === 0}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark Selected as Ordered ({selectedItems.length})
              </button>
            )}
            {activeTab === 'ordered' && onMarkCompleted && (
              <button
                onClick={onMarkCompleted}
                disabled={selectedItems.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark as Success Batch Order ({selectedItems.length})
              </button>
            )}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No {activeTab} items</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {(activeTab === 'pending' || activeTab === 'ordered') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                {activeTab === 'completed' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                {activeTab === 'ordered' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item._id}>
                  {(activeTab === 'pending' || activeTab === 'ordered') && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item._id)}
                        onChange={() => onSelectItem(item._id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.userId.displayName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-gray-500 text-xs">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity}
                  </td>
                  {activeTab === 'completed' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.price ? `$${item.price.toFixed(2)}` : '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.notes || '-'}
                    {item.errorMessage && (
                      <div className="text-red-600 text-xs mt-1">{item.errorMessage}</div>
                    )}
                  </td>
                  {activeTab === 'ordered' && (
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.batchId ? item.batchId.batchName : '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <a
                      href={item.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      View Product
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}