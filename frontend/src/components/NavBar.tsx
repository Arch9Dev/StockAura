'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import Image from 'next/image';

export default function NavBar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  function linkClass(path: string) {
    return pathname === path
      ? 'text-gray-900 dark:text-white font-medium'
      : 'text-gray-500 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white';
  }

  return (
    <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Image src="/icon-transparent.png" alt="" width={45} height={45} />
          <span className="text-lg font-semibold text-gray-900 dark:text-white">StockAura</span>
        </div>
        <nav className="flex gap-4 text-sm">
          <Link href="/dashboard" className={linkClass('/dashboard')}>Dashboard</Link>
          <Link href="/products" className={linkClass('/products')}>Products</Link>
          {user?.role === 'ADMIN' && (
            <>
              <Link href="/archive" className={linkClass('/archive')}>Archive</Link>
              <Link href="/users" className={linkClass('/users')}>Users</Link>
            </>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 dark:text-gray-200">{user?.name} ({user?.role})</span>
        <ThemeToggle />
        <button
          onClick={logout}
          className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
        >
          Log out
        </button>
      </div>
    </div>
  );
}