'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminTabs from '@/components/admin/AdminTabs';
import ErrorAlert from '@/components/shared/ErrorAlert';
import ItemsTable from '@/components/admin/ItemsTable';
import BatchesList from '@/components/admin/BatchesList';

type TabType = 'pending' | 'ordered' | 'completed' | 'batches';

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
  const [activeTab, setActiveTab] = useState<TabType>('pending');


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



  const handleMarkCompleted = async () => {
    if (selectedItems.length === 0) {
      alert('Please select items to mark as completed');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const updates = selectedItems.map(itemId => ({
        itemId,
        status: 'completed'
      }));

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
        alert(`${data.itemsProcessed} items marked as completed. ${data.batchesCreated} batches created.`);
        setSelectedItems([]);
        fetchAllItems();
        fetchBatches();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to mark items as completed');
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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedItems([]); // Clear selections when switching tabs
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
      <AdminHeader
        displayName={user?.displayName || ''}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          pendingCount={allItems.filter(item => item.status === 'pending').length}
          orderedCount={allItems.filter(item => item.status === 'ordered').length}
          completedCount={allItems.filter(item => item.status === 'completed').length}
          batchesCount={batches.length}
        />

        {error && <ErrorAlert message={error} />}

        {activeTab !== 'batches' && (
          <div className="space-y-6">
            <ItemsTable
              activeTab={activeTab}
              items={filteredItems}
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onSelectAll={handleSelectAll}
              onMarkOrdered={handleMarkOrdered}
              onMarkCompleted={handleMarkCompleted}
            />


          </div>
        )}

        {activeTab === 'batches' && (
          <BatchesList batches={batches} />
        )}
      </div>
    </div>
  );
}