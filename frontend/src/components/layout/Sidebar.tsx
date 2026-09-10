import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, FileText, CheckSquare, Users, Settings, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Sidebar({ isOpen }: { isOpen: boolean }) {
  const { role } = useAuthStore();

  const getLinks = () => {
    switch (role) {
      case 'merchant':
        return [
          { name: 'Dashboard', href: '/merchant/dashboard', icon: LayoutDashboard },
          { name: 'My Applications', href: '/merchant/applications', icon: FileText },
          { name: 'Certificates', href: '/merchant/certificates', icon: CheckSquare },
        ];
      case 'admin':
        return [
          { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Requests', href: '/admin/requests', icon: FileText },
          { name: 'Sub Admins', href: '/admin/sub-admins', icon: Users },
          { name: 'Complaints', href: '/admin/complaints', icon: AlertTriangle },
          { name: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldCheck },
        ];
      case 'sub_admin':
        return [
          { name: 'Dashboard', href: '/sub-admin/dashboard', icon: LayoutDashboard },
          { name: 'My Visits', href: '/sub-admin/visits', icon: CheckSquare },
          { name: 'Availability', href: '/sub-admin/availability', icon: Settings },
          { name: 'History', href: '/sub-admin/history', icon: FileText },
        ];
      case 'head_admin':
        return [
          { name: 'Dashboard', href: '/head-admin/dashboard', icon: LayoutDashboard },
          { name: 'Admins', href: '/head-admin/admins', icon: Users },
          { name: 'Sub Admins', href: '/head-admin/sub-admins', icon: Users },
          { name: 'All Requests', href: '/head-admin/requests', icon: FileText },
          { name: 'Audit Logs', href: '/head-admin/audit-logs', icon: ShieldCheck },
        ];
      default:
        return [];
    }
  };

  return (
    <div className={cn("fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:flex-shrink-0", isOpen ? "translate-x-0" : "-translate-x-full")}>
      <div className="h-full flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {getLinks().map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  isActive ? 'bg-gray-100 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                )
              }
            >
              <item.icon className="mr-3 flex-shrink-0 h-6 w-6" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}