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
  batchId?: {
    _id: string;
    batchName: string;
    completionDate: string;
  };
}

interface MemberItemsListProps {
  items: GroceryItem[];
  activeTab: 'pending' | 'ordered' | 'completed';
}

export default function MemberItemsList({ items, activeTab }: MemberItemsListProps) {
  const filteredItems = items.filter(item => item.status === activeTab);

  return (
    <div className="p-6">
      {filteredItems.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No {activeTab} items
        </p>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div key={item._id} className="border border-gray-200 rounded-md p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.productName}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Quantity: {item.quantity}
                    {item.price && ` • $${item.price.toFixed(2)}`}
                  </p>
                  {item.notes && (
                    <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                  )}
                  {item.errorMessage && (
                    <p className="text-sm text-red-600 mt-1">{item.errorMessage}</p>
                  )}
                  {item.batchId && (
                    <p className="text-xs text-gray-400 mt-1">
                      Batch: {item.batchId.batchName}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Added: {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="ml-4">
                  <a
                    href={item.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    View Product
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}