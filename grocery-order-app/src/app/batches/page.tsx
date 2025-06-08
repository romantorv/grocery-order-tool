'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  displayName: string;
  role: string;
  sessionId: string;
}

interface OrderBatch {
  _id: string;
  batchName: string;
  completionDate: string;
  itemCount: number;
  totalValue: number;
  notes?: string;
  createdAt: string;
}

export default function BatchesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [batches, setBatches] = useState<OrderBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    setUser(JSON.parse(userData));
    fetchBatches();
  }, [router]);

  const fetchBatches = async (offset = 0) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/batches?limit=20&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (offset === 0) {
          setBatches(data);
        } else {
          setBatches(prev => [...prev, ...data]);
        }
        setHasMore(data.length === 20);
      } else {
        setError('Failed to fetch batches');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchBatches(batches.length);
  };

  const handleReorderBatch = async (batchId: string) => {
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
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to reorder batch');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleViewDetails = (batchId: string) => {
    router.push(`/batches/${batchId}`);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
              <p className="text-gray-600">Browse your completed order batches</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push(user?.role === 'admin' ? '/admin' : '/dashboard')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Back to Dashboard
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

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">All Order Batches</h2>

            {batches.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No completed orders yet</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {batches.map((batch) => (
                    <div key={batch._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-medium text-gray-900">{batch.batchName}</h3>
                        <span className="text-sm text-gray-500">
                          {new Date(batch.completionDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Items:</span>
                          <span className="font-medium">{batch.itemCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Value:</span>
                          <span className="font-medium">${batch.totalValue.toFixed(2)}</span>
                        </div>
                      </div>

                      {batch.notes && (
                        <p className="text-sm text-gray-700 mb-4 p-2 bg-gray-50 rounded">
                          {batch.notes}
                        </p>
                      )}

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(batch._id)}
                          className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm hover:bg-indigo-700"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleReorderBatch(batch._id)}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700"
                        >
                          Reorder
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div className="text-center mt-8">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}