'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  lowStockAlert: number;
}

interface Movement {
  id: number;
  type: string;
  quantity: number;
  note: string | null;
  createdAt: string;
  product: { name: string; sku: string };
  user: { name: string };
}

interface Summary {
  totalProducts: number;
  lowStockCount: number;
  lowStockProducts: LowStockProduct[];
  recentMovements: Movement[];
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboardSummary()
      .then(setSummary)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-neutral-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
            <p className="text-sm text-neutral-400">Logged in as {user?.name} ({user?.role})</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/products"
              className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-800"
            >
              Products
            </Link>
            <button
              onClick={logout}
              className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-800"
            >
              Log out
            </button>
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {loading ? (
          <p className="text-neutral-400">Loading...</p>
        ) : summary ? (
          <>
            {/* Summary stats */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
                <p className="text-sm text-neutral-400">Active products</p>
                <p className="mt-1 text-3xl font-semibold text-white">{summary.totalProducts}</p>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
                <p className="text-sm text-neutral-400">Low stock items</p>
                <p className={`mt-1 text-3xl font-semibold ${summary.lowStockCount > 0 ? 'text-red-400' : 'text-white'}`}>
                  {summary.lowStockCount}
                </p>
              </div>
            </div>

            {/* Low stock list */}
            <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900">
              <div className="border-b border-neutral-800 px-4 py-3">
                <h2 className="text-sm font-semibold text-white">Low Stock Items</h2>
              </div>
              {summary.lowStockProducts.length === 0 ? (
                <p className="p-6 text-center text-sm text-neutral-500">Nothing is low on stock right now.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-neutral-400">
                    <tr>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">SKU</th>
                      <th className="px-4 py-2">Quantity</th>
                      <th className="px-4 py-2">Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {summary.lowStockProducts.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-2 text-white">{p.name}</td>
                        <td className="px-4 py-2 text-neutral-400">{p.sku}</td>
                        <td className="px-4 py-2 text-red-400">{p.quantity}</td>
                        <td className="px-4 py-2 text-neutral-400">{p.lowStockAlert}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Recent activity */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900">
              <div className="border-b border-neutral-800 px-4 py-3">
                <h2 className="text-sm font-semibold text-white">Recent Stock Activity</h2>
              </div>
              {summary.recentMovements.length === 0 ? (
                <p className="p-6 text-center text-sm text-neutral-500">No stock activity yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-neutral-400">
                    <tr>
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Qty</th>
                      <th className="px-4 py-2">By</th>
                      <th className="px-4 py-2">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {summary.recentMovements.map((m) => (
                      <tr key={m.id}>
                        <td className="px-4 py-2 text-white">{m.product.name}</td>
                        <td className="px-4 py-2 text-neutral-400">{m.type}</td>
                        <td className="px-4 py-2 text-neutral-400">{m.quantity}</td>
                        <td className="px-4 py-2 text-neutral-400">{m.user.name}</td>
                        <td className="px-4 py-2 text-neutral-500">
                          {new Date(m.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}