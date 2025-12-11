'use client';

import React from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { useAuthStore } from '@/store/auth';
import { useRouter, usePathname } from 'next/navigation';
import { organizationsAPI } from '@/lib/api';
import Link from 'next/link';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Contactos', href: '/dashboard/contacts', icon: '👥' },
  { name: 'Conversaciones', href: '/dashboard/conversations', icon: '💬' },
  { name: 'WhatsApp', href: '/dashboard/whatsapp', icon: '📱' },
  { name: 'Equipos', href: '/dashboard/teams', icon: '👨‍👩‍👧‍👦' },
  { name: 'Usuarios', href: '/dashboard/users', icon: '👤' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, organization, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">OpenTalkWisp</h1>
                <p className="text-sm text-gray-500">{organization?.name}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 py-4">
            {/* Navigation */}
            <nav className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 py-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
