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

interface OrderBatch {
  _id: string;
  batchName: string;
  completionDate: string;
  itemCount: number;
  totalValue: number;
  notes?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [allItems, setAllItems] = useState<GroceryItem[]>([]);
  const [batches, setBatches] = useState<OrderBatch[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'ordered' | 'completed' | 'batches'>('pending');

  // Status update form
  const [statusUpdates, setStatusUpdates] = useState<{[key: string]: {
    status: 'completed' | 'failed';
    price?: number;
    errorMessage?: string;
  }}>({});

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchAllItems();
    fetchBatches();
  }, [router]);

  const fetchAllItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/all-items', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllItems(data);
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
      const response = await fetch('/api/batches?limit=10', {
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

  // Get filtered items based on active tab
  const getFilteredItems = () => {
    if (activeTab === 'batches') return [];
    return allItems.filter(item => item.status === activeTab);
  };

  const filteredItems = getFilteredItems();

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    const currentItems = filteredItems;
    if (selectedItems.length === currentItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(currentItems.map(item => item._id));
    }
  };

  const handleMarkOrdered = async () => {
    if (selectedItems.length === 0) {
      alert('Please select items to mark as ordered');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/mark-ordered', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ itemIds: selectedItems }),
      });

      if (response.ok) {
        const data = await response.json();

        // Show extension data for copying
        const extensionDataText = JSON.stringify(data.extensionData, null, 2);

        // Copy to clipboard
        navigator.clipboard.writeText(extensionDataText).then(() => {
          alert(`${data.itemsUpdated} items marked as ordered. Extension data copied to clipboard!`);
        }).catch(() => {
          alert(`${data.itemsUpdated} items marked as ordered. Extension data:\n\n${extensionDataText}`);
        });

        setSelectedItems([]);
        fetchAllItems();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to mark items as ordered');
      }
    } catch {
      setError('Network error');
    }
  };

  const handleStatusUpdate = (itemId: string, field: string, value: string | number) => {
    setStatusUpdates(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const handleSubmitStatusUpdates = async () => {
    const updates = Object.entries(statusUpdates).map(([itemId, update]) => ({
      itemId,
      ...update
    }));

    if (updates.length === 0) {
      alert('No status updates to submit');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ updates }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${data.itemsProcessed} items updated. ${data.batchesCreated} batches created.`);
        setStatusUpdates({});
        fetchAllItems();
        fetchBatches();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update statuses');
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
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
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
        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending ({allItems.filter(item => item.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('ordered')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ordered'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Ordered ({allItems.filter(item => item.status === 'ordered').length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'completed'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Completed ({allItems.filter(item => item.status === 'completed').length})
            </button>
            <button
              onClick={() => setActiveTab('batches')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'batches'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Order History ({batches.length})
            </button>
          </nav>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {activeTab !== 'batches' && (
          <div className="space-y-6">
            {/* Items List */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 capitalize">{activeTab} Items</h2>
                {activeTab === 'pending' && (
                  <div className="flex space-x-4">
                    <button
                      onClick={handleSelectAll}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      {selectedItems.length === filteredItems.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                      onClick={handleMarkOrdered}
                      disabled={selectedItems.length === 0}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark Selected as Ordered ({selectedItems.length})
                    </button>
                  </div>
                )}
              </div>

              {filteredItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No {activeTab} items</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {activeTab === 'pending' && (
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
                      {filteredItems.map((item) => (
                        <tr key={item._id}>
                          {activeTab === 'pending' && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(item._id)}
                                onChange={() => handleSelectItem(item._id)}
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

            {/* Status Update Form - Only show for ordered items */}
            {activeTab === 'ordered' && (
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
                      const item = filteredItems.find(i => i._id === itemId);
                      return (
                        <div key={itemId} className="border border-gray-200 rounded-md p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">{item?.productName}</span>
                            <button
                              onClick={() => {
                                const newUpdates = { ...statusUpdates };
                                delete newUpdates[itemId];
                                setStatusUpdates(newUpdates);
                              }}
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
                                onChange={(e) => handleStatusUpdate(itemId, 'status', e.target.value)}
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
                                  onChange={(e) => handleStatusUpdate(itemId, 'price', parseFloat(e.target.value))}
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
                                  onChange={(e) => handleStatusUpdate(itemId, 'errorMessage', e.target.value)}
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
                      onClick={handleSubmitStatusUpdates}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Submit Status Updates ({Object.keys(statusUpdates).length})
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Batches Tab */}
        {activeTab === 'batches' && (
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
        )}
      </div>
    </div>
  );
}