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
  lowStockAlert: number;
  isActive: boolean;
}

export default function ProductsPage() {
  return (
    <RequireAuth>
      <ProductsContent />
    </RequireAuth>
  );
}

function ProductsContent() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', price: '', quantity: '' });

  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
  const [stockAmount, setStockAmount] = useState('');
  const [stockType, setStockType] = useState('RESTOCK');
  const [stockNote, setStockNote] = useState('');

  const [editModalProduct, setEditModalProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ name: '', sku: '', price: '', quantity: '', lowStockAlert: '' });

  const [archiveConfirmProduct, setArchiveConfirmProduct] = useState<Product | null>(null);

  const canManage = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const canArchive = user?.role === 'ADMIN';

  async function loadProducts() {
    setLoading(true);
    try {
      const result = await api.getProducts({ search, status: 'active', page, pageSize: 10, sortBy, sortDir });
      setProducts(result.data);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, page, sortBy, sortDir]);

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(1);
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createProduct({
        name: newProduct.name,
        sku: newProduct.sku,
        price: parseFloat(newProduct.price),
        quantity: parseInt(newProduct.quantity) || 0,
      });
      setNewProduct({ name: '', sku: '', price: '', quantity: '' });
      setShowAddProduct(false);
      loadProducts();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function confirmArchive() {
    if (!archiveConfirmProduct) return;
    try {
      await api.archiveProduct(archiveConfirmProduct.id);
      setArchiveConfirmProduct(null);
      loadProducts();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleStockSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stockModalProduct) return;
    try {
      await api.addStockMovement({
        productId: stockModalProduct.id,
        type: stockType,
        quantity: parseInt(stockAmount),
        note: stockNote,
      });
      setStockModalProduct(null);
      setStockAmount('');
      setStockNote('');
      loadProducts();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function openEditModal(p: Product) {
    setEditForm({
      name: p.name,
      sku: p.sku,
      price: String(p.price),
      quantity: String(p.quantity),
      lowStockAlert: String(p.lowStockAlert),
    });
    setEditModalProduct(p);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editModalProduct) return;
    try {
      await api.updateProduct(editModalProduct.id, {
        name: editForm.name,
        sku: editForm.sku,
        price: parseFloat(editForm.price),
        quantity: parseInt(editForm.quantity),
        lowStockAlert: parseInt(editForm.lowStockAlert),
      });
      setEditModalProduct(null);
      loadProducts();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="mx-auto max-w-5xl">
        <NavBar />

        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Products</h1>
          {canManage && (
            <button
              onClick={() => setShowAddProduct(true)}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Add Product
            </button>
          )}
        </div>

        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="mb-4 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
        />

        {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  <tr>
                    <th className="cursor-pointer select-none px-4 py-3 hover:text-gray-900 dark:hover:text-gray-100" onClick={() => handleSort('name')}>
                      Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="cursor-pointer select-none px-4 py-3 hover:text-gray-900 dark:hover:text-gray-100" onClick={() => handleSort('sku')}>
                      SKU {sortBy === 'sku' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="cursor-pointer select-none px-4 py-3 hover:text-gray-900 dark:hover:text-gray-100" onClick={() => handleSort('price')}>
                      Price {sortBy === 'price' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="cursor-pointer select-none px-4 py-3 hover:text-gray-900 dark:hover:text-gray-100" onClick={() => handleSort('quantity')}>
                      Quantity {sortBy === 'quantity' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3">Status</th>
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
                      <td className="px-4 py-3">
                        {p.quantity <= p.lowStockAlert ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                            Low stock
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600 dark:bg-green-950 dark:text-green-400">
                            In stock
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setStockModalProduct(p)}
                          className="mr-3 text-emerald-600 hover:underline dark:text-emerald-400"
                        >
                          Adjust stock
                        </button>
                        {canManage && (
                          <button
                            onClick={() => openEditModal(p)}
                            className="mr-3 text-gray-500 hover:underline dark:text-gray-400"
                          >
                            Edit
                          </button>
                        )}
                        {canArchive && (
                          <button
                            onClick={() => setArchiveConfirmProduct(p)}
                            className="text-amber-600 hover:underline dark:text-amber-400"
                          >
                            Archive
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && (
                <p className="p-6 text-center text-gray-400 dark:text-gray-500">No products found.</p>
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {showAddProduct && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900/40">
            <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Add Product</h2>
              <form onSubmit={handleAddProduct} className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
                <input
                  type="text"
                  placeholder="SKU"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  required
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  required
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
                <input
                  type="number"
                  placeholder="Starting quantity"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="rounded-md px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {stockModalProduct && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900/40">
            <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">Adjust Stock</h2>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{stockModalProduct.name}</p>
              <form onSubmit={handleStockSubmit} className="space-y-3">
                <select
                  value={stockType}
                  onChange={(e) => setStockType(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                >
                  <option value="RESTOCK">Restock (add stock)</option>
                  <option value="SALE">Sale (remove stock)</option>
                  <option value="RETURN">Return (add stock)</option>
                  <option value="ADJUSTMENT">Manual adjustment</option>
                </select>
                <input
                  type="number"
                  placeholder="Quantity"
                  value={stockAmount}
                  onChange={(e) => setStockAmount(e.target.value)}
                  required
                  min={1}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
                <input
                  type="text"
                  placeholder="Note (optional)"
                  value={stockNote}
                  onChange={(e) => setStockNote(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStockModalProduct(null)}
                    className="rounded-md px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editModalProduct && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900/40">
            <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Product</h2>
              <form onSubmit={handleEditSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
                <input
                  type="text"
                  placeholder="SKU"
                  value={editForm.sku}
                  onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                  required
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  required
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
                <div>
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                    required
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Changing quantity here isn't recorded in stock history. Use "Adjust stock" for tracked changes.
                  </p>
                </div>
                <input
                  type="number"
                  placeholder="Low stock threshold"
                  value={editForm.lowStockAlert}
                  onChange={(e) => setEditForm({ ...editForm, lowStockAlert: e.target.value })}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditModalProduct(null)}
                    className="rounded-md px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {archiveConfirmProduct && (
          <ConfirmModal
            title="Archive Product"
            message={`Archive "${archiveConfirmProduct.name}"? It will be hidden from active inventory but its stock history is preserved.`}
            confirmLabel="Archive"
            danger
            onConfirm={confirmArchive}
            onCancel={() => setArchiveConfirmProduct(null)}
          />
        )}
      </div>
    </div>
  );
}