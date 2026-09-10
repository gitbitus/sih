import React from 'react';
import { Bell, Menu, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuthStore();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="p-2 -ml-2 mr-2 text-gray-400 hover:text-gray-500 md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-primary">MIVC System</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-500 relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <div className="relative">
              <button className="flex items-center space-x-2 text-sm focus:outline-none">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <span className="hidden md:block font-medium">{user?.name || 'User'}</span>
              </button>
            </div>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">Logout</button>
          </div>
        </div>
      </div>
    </header>
  );
}