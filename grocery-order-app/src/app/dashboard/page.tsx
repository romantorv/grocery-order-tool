'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

interface OrderBatch {
  _id: string;
  batchName: string;
  completionDate: string;
  itemCount: number;
  totalValue: number;
  createdAt: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [batches, setBatches] = useState<OrderBatch[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'ordered' | 'completed'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [productUrl, setProductUrl] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'member') {
      router.push('/admin');
      return;
    }

    setUser(parsedUser);
    fetchItems();
    fetchBatches();
  }, [router]);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/items', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data);
      } else {
        setError('Failed to fetch items');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/batches?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      }
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    }
  };

  // Auto-generate product name from URL
  const generateProductName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);

      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        // Clean up the last part of the path for a readable name
        return lastPart.replace(/[-_]/g, ' ').replace(/\.(html|htm|php)$/i, '');
      }

      return `Product from ${hostname}`;
    } catch {
      return 'Product Item';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const productName = generateProductName(productUrl);

      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productName,
          productUrl,
          quantity,
          notes: notes || undefined,
        }),
      });

      if (response.ok) {
        // Reset form
        setProductUrl('');
        setQuantity(1);
        setNotes('');

        // Refresh items
        fetchItems();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add item');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
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
        fetchItems();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to reorder batch');
      }
    } catch {
      setError('Network error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const filteredItems = items.filter(item => item.status === activeTab);

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
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome, {user?.displayName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Item Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Item</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product URL *
                  </label>
                  <input
                    type="url"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                    placeholder="https://example.com/product"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                    placeholder="Optional notes about this item"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Item'}
                </button>
              </form>
            </div>

            {/* Recent Batches */}
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
                          onClick={() => handleReorderBatch(batch._id)}
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
          </div>

          {/* Items List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {(['pending', 'ordered', 'completed'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                        activeTab === tab
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab} ({items.filter(item => item.status === tab).length})
                    </button>
                  ))}
                </nav>
              </div>

              {/* Items */}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}