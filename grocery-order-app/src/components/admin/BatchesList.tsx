interface OrderBatch {
  _id: string;
  batchName: string;
  completionDate: string;
  itemCount: number;
  totalValue: number;
  notes?: string;
  createdAt: string;
}

interface BatchesListProps {
  batches: OrderBatch[];
}

export default function BatchesList({ batches }: BatchesListProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Order History</h2>

      {batches.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No completed batches</p>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <div key={batch._id} className="border border-gray-200 rounded-md p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{batch.batchName}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {batch.itemCount} items • ${batch.totalValue.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Completed: {new Date(batch.completionDate).toLocaleDateString()}
                  </p>
                  {batch.notes && (
                    <p className="text-sm text-gray-500 mt-1">{batch.notes}</p>
                  )}
                </div>
                <a
                  href={`/batches/${batch._id}`}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  View Details
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}