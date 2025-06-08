'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MemberHeader from '@/components/member/MemberHeader';
import AddItemForm from '@/components/member/AddItemForm';
import RecentBatchesList from '@/components/member/RecentBatchesList';
import ItemsTabsNavigation from '@/components/shared/ItemsTabsNavigation';
import MemberItemsList from '@/components/member/MemberItemsList';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

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

  const handleSubmit = async (formData: { productUrl: string; quantity: number; notes: string }) => {
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const productName = generateProductName(formData.productUrl);

      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productName,
          productUrl: formData.productUrl,
          quantity: formData.quantity,
          notes: formData.notes || undefined,
        }),
      });

      if (response.ok) {
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MemberHeader
        displayName={user?.displayName || ''}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Item Form */}
          <div className="lg:col-span-1">
            <AddItemForm
              onSubmit={handleSubmit}
              submitting={submitting}
              error={error}
            />

            <RecentBatchesList
              batches={batches}
              onReorder={handleReorderBatch}
            />
          </div>

          {/* Items List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <ItemsTabsNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabCounts={{
                  pending: items.filter(item => item.status === 'pending').length,
                  ordered: items.filter(item => item.status === 'ordered').length,
                  completed: items.filter(item => item.status === 'completed').length
                }}
              />
              <MemberItemsList
                items={items}
                activeTab={activeTab}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}