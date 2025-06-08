type TabType = 'pending' | 'ordered' | 'completed';

interface TabCount {
  pending: number;
  ordered: number;
  completed: number;
}

interface ItemsTabsNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  tabCounts: TabCount;
}

export default function ItemsTabsNavigation({
  activeTab,
  onTabChange,
  tabCounts
}: ItemsTabsNavigationProps) {
  const tabs: TabType[] = ['pending', 'ordered', 'completed'];

  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8 px-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
              activeTab === tab
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab} ({tabCounts[tab]})
          </button>
        ))}
      </nav>
    </div>
  );
}