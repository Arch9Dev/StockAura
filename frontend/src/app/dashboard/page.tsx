'use client';

import { useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import NavBar from '@/components/NavBar';
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
    <div className="min-h-screen bg-slate-50 p-8 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto max-w-5xl">
        <NavBar />
        <h1 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>

        {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        ) : summary ? (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">Active products</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">{summary.totalProducts}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">Low stock items</p>
                <p className={`mt-1 text-3xl font-semibold ${summary.lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  {summary.lowStockCount}
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Low Stock Items</h2>
              </div>
              {summary.lowStockProducts.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">Nothing is low on stock right now.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">SKU</th>
                      <th className="px-4 py-2">Quantity</th>
                      <th className="px-4 py-2">Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {summary.lowStockProducts.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{p.name}</td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{p.sku}</td>
                        <td className="px-4 py-2 text-amber-600 dark:text-amber-400">{p.quantity}</td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{p.lowStockAlert}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Stock Activity</h2>
              </div>
              {summary.recentMovements.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">No stock activity yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Qty</th>
                      <th className="px-4 py-2">By</th>
                      <th className="px-4 py-2">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {summary.recentMovements.map((m) => (
                      <tr key={m.id}>
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{m.product.name}</td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{m.type}</td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{m.quantity}</td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{m.user.name}</td>
                        <td className="px-4 py-2 text-gray-400 dark:text-gray-500">
                          {new Date(m.createdAt).toLocaleString('en-GB')}
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