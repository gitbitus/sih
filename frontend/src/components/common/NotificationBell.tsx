import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Bell } from 'lucide-react';

export default function NotificationBell() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="p-2 text-gray-400 hover:text-gray-500 relative focus:outline-none">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="w-80 bg-white rounded-md shadow-lg border border-gray-200 p-2 mr-2 z-50">
          <div className="px-3 py-2 text-sm font-semibold text-gray-900 border-b border-gray-100">
            Notifications
          </div>
          <div className="py-2">
            <DropdownMenu.Item className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none rounded">
              <p className="font-medium text-gray-900">Application Approved</p>
              <p className="text-gray-500 text-xs mt-1">Your instrument #123 has been certified.</p>
            </DropdownMenu.Item>
            <DropdownMenu.Item className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none rounded">
              <p className="font-medium text-gray-900">New Visit Assigned</p>
              <p className="text-gray-500 text-xs mt-1">You have a new inspection visit scheduled for tomorrow.</p>
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}