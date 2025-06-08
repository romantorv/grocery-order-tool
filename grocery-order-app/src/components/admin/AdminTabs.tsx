type TabType = 'pending' | 'ordered' | 'completed' | 'batches';

interface AdminTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingCount: number;
  orderedCount: number;
  completedCount: number;
  batchesCount: number;
}

export default function AdminTabs({
  activeTab,
  onTabChange,
  pendingCount,
  orderedCount,
  completedCount,
  batchesCount
}: AdminTabsProps) {
  const tabs = [
    { id: 'pending' as const, label: 'Pending', count: pendingCount },
    { id: 'ordered' as const, label: 'Ordered', count: orderedCount },
    { id: 'completed' as const, label: 'Completed', count: completedCount },
    { id: 'batches' as const, label: 'Order History', count: batchesCount },
  ];

  return (
    <div className="mb-8">
      <nav className="flex space-x-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </nav>
    </div>
  );
}