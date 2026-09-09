'use client';

import { useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import NavBar from '@/components/NavBar';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface Product {
  id: number;
  name: string;
  sku: string;
  price: string;
  quantity: number;
  _count: { stockMovements: number };
}

export default function ArchivePage() {
  return (
    <RequireAuth>
      <ArchiveContent />
    </RequireAuth>
  );
}

function ArchiveContent() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  async function loadArchived() {
    setLoading(true);
    try {
      const result = await api.getProducts({ search, status: 'archived', page: 1, pageSize: 50 });
      setProducts(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(loadArchived, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  async function handleRestore(id: number) {
    try {
      await api.restoreProduct(id);
      loadArchived();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function confirmPermanentDelete() {
    if (!deleteConfirmProduct) return;
    try {
      await api.deleteProduct(deleteConfirmProduct.id);
      setDeleteConfirmProduct(null);
      loadArchived();
    } catch (err: any) {
      setError(err.message);
      setDeleteConfirmProduct(null);
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <div className="mx-auto max-w-5xl">
          <NavBar />
          <p className="text-gray-500 dark:text-gray-400">Only admins can view the archive.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto max-w-5xl">
        <NavBar />
        <h1 className="mb-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Archive</h1>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Archived products are hidden from active inventory but keep their stock history. Restore them to bring them back, or delete permanently if they have no history.
        </p>

        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
        />

        {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.sku}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">${Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRestore(p.id)}
                        className="mr-3 text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        Restore
                      </button>
                      {p._count.stockMovements > 0 ? (
                        <span
                          className="cursor-not-allowed text-gray-300 dark:text-gray-600"
                          title="Cannot delete — this product has stock movement history"
                        >
                          Delete permanently
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmProduct(p)}
                          className="text-red-600 hover:underline dark:text-red-400"
                        >
                          Delete permanently
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
            {products.length === 0 && (
          <p className="p-6 text-center text-gray-400 dark:text-gray-500">No archived products.</p>
        )}
      </div>
        )}

      {deleteConfirmProduct && (
        <ConfirmModal
          title="Delete Permanently"
          message={`Permanently delete "${deleteConfirmProduct.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmPermanentDelete}
          onCancel={() => setDeleteConfirmProduct(null)}
        />
      )}
    </div>
    </div >
  );
}