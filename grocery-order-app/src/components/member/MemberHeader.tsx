interface MemberHeaderProps {
  displayName: string;
  onLogout: () => void;
}

export default function MemberHeader({ displayName, onLogout }: MemberHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome, {displayName}</p>
          </div>
          <button
            onClick={onLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}