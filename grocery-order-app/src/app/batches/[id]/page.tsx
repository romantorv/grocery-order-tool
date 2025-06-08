'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface User {
  displayName: string;
  role: string;
  sessionId: string;
}

interface GroceryItem {
  _id: string;
  productName: string;
  productUrl: string;
  quantity: number;
  price?: number;
  status: string;
  notes?: string;
  createdAt: string;
  userId: {
    _id: string;
    displayName: string;
  };
}

interface OrderBatch {
  _id: string;
  batchName: string;
  completionDate: string;
  itemCount: number;
  totalValue: number;
  notes?: string;
}

export default function BatchDetailsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [batch, setBatch] = useState<OrderBatch | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const router = useRouter();
  const params = useParams();
  const batchId = params.id as string;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    setUser(JSON.parse(userData));
    if (batchId) {
      fetchBatchDetails();
    }
  }, [router, batchId]);

  const fetchBatchDetails = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch batch info
      const batchResponse = await fetch(`/api/batches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Fetch batch items
      const itemsResponse = await fetch(`/api/batches/${batchId}/items`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (batchResponse.ok && itemsResponse.ok) {
        const batchesData = await batchResponse.json();
        const itemsData = await itemsResponse.json();

        // Find the specific batch
        const currentBatch = batchesData.find((b: OrderBatch) => b._id === batchId);
        setBatch(currentBatch);
        setItems(itemsData);
      } else {
        setError('Failed to fetch batch details');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleReorderBatch = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/items/reorder-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ batchId }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Successfully reordered ${data.itemsCreated} items!`);
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to reorder batch');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Batch not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{batch.batchName}</h1>
              <p className="text-gray-600">
                Completed on {new Date(batch.completionDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/batches')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to History
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Batch Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{batch.itemCount}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">${batch.totalValue.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
            <div className="text-center">
              <button
                onClick={handleReorderBatch}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-medium"
              >
                Reorder This Batch
              </button>
            </div>
          </div>

          {batch.notes && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Notes:</h3>
              <p className="text-sm text-gray-700">{batch.notes}</p>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Items in this batch</h2>

            {items.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No items found</p>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item._id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.productName}</h3>
                        <div className="mt-1 text-sm text-gray-600">
                          <span>Quantity: {item.quantity}</span>
                          {item.price && <span> • Price: ${item.price.toFixed(2)}</span>}
                          <span> • Ordered by: {item.userId.displayName}</span>
                        </div>
                        {item.notes && (
                          <p className="mt-2 text-sm text-gray-500">{item.notes}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">
                          Added: {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4">
                        <a
                          href={item.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
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
        </div>
      </div>
    </div>
  );
}