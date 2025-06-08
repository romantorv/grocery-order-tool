interface OrderBatch {
  _id: string;
  batchName: string;
  completionDate: string;
  itemCount: number;
  totalValue: number;
  createdAt: string;
}

interface RecentBatchesListProps {
  batches: OrderBatch[];
  onReorder: (batchId: string) => Promise<void>;
}

export default function RecentBatchesList({ batches, onReorder }: RecentBatchesListProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>

      {batches.length === 0 ? (
        <p className="text-gray-500 text-sm">No completed orders yet</p>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <div key={batch._id} className="border border-gray-200 rounded-md p-3">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">{batch.batchName}</h3>
                <button
                  onClick={() => onReorder(batch._id)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Reorder
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {batch.itemCount} items • ${batch.totalValue.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(batch.completionDate).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}