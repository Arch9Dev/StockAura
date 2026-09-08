'use client';

import { useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
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
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
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

  const canManage = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const canArchive = user?.role === 'ADMIN';

  async function loadProducts() {
    setLoading(true);
    try {
      const result = await api.getProducts({ search, status: statusFilter, page, pageSize: 10, sortBy, sortDir });
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
  }, [search, statusFilter, page, sortBy, sortDir]);

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

  async function handleArchive(id: number) {
    if (!confirm('Archive this product? It will be hidden but its history is preserved.')) return;
    try {
      await api.archiveProduct(id);
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
    <div className="min-h-screen bg-neutral-950 p-8 text-neutral-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Products</h1>
            <p className="text-sm text-neutral-400">Logged in as {user?.name} ({user?.role})</p>
          </div>
          <div className="flex gap-2">
            {canManage && (
              <button
                onClick={() => setShowAddProduct(true)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                Add Product
              </button>
            )}
            <button
              onClick={logout}
              className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-800"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="mb-4 flex gap-3">
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {loading ? (
          <p className="text-neutral-400">Loading...</p>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
              <table className="w-full text-sm">
                <thead className="bg-neutral-900 text-left text-neutral-400">
                  <tr>
                    <th className="cursor-pointer select-none px-4 py-3 hover:text-white" onClick={() => handleSort('name')}>
                      Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="cursor-pointer select-none px-4 py-3 hover:text-white" onClick={() => handleSort('sku')}>
                      SKU {sortBy === 'sku' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="cursor-pointer select-none px-4 py-3 hover:text-white" onClick={() => handleSort('price')}>
                      Price {sortBy === 'price' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="cursor-pointer select-none px-4 py-3 hover:text-white" onClick={() => handleSort('quantity')}>
                      Quantity {sortBy === 'quantity' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                      <td className="px-4 py-3 text-neutral-400">{p.sku}</td>
                      <td className="px-4 py-3 text-neutral-400">${Number(p.price).toFixed(2)}</td>
                      <td className="px-4 py-3 text-neutral-400">{p.quantity}</td>
                      <td className="px-4 py-3">
                        {!p.isActive ? (
                          <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-400">
                            Archived
                          </span>
                        ) : p.quantity <= p.lowStockAlert ? (
                          <span className="rounded-full bg-red-950 px-2 py-0.5 text-xs font-medium text-red-400">
                            Low stock
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-950 px-2 py-0.5 text-xs font-medium text-green-400">
                            In stock
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setStockModalProduct(p)}
                          className="mr-3 text-blue-400 hover:underline"
                        >
                          Adjust stock
                        </button>
                        {canManage && (
                          <button
                            onClick={() => openEditModal(p)}
                            className="mr-3 text-neutral-300 hover:underline"
                          >
                            Edit
                          </button>
                        )}
                        {canArchive && p.isActive && (
                          <button
                            onClick={() => handleArchive(p.id)}
                            className="text-orange-400 hover:underline"
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
                <p className="p-6 text-center text-neutral-500">No products found.</p>
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-neutral-400">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Add Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-900 p-6 shadow-lg">
              <h2 className="mb-4 text-lg font-semibold text-white">Add Product</h2>
              <form onSubmit={handleAddProduct} className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                  className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500"
                />
                <input
                  type="text"
                  placeholder="SKU"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  required
                  className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  required
                  className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500"
                />
                <input
                  type="number"
                  placeholder="Starting quantity"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="rounded-md px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Adjust Stock Modal */}
        {stockModalProduct && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-900 p-6 shadow-lg">
              <h2 className="mb-1 text-lg font-semibold text-white">Adjust Stock</h2>
              <p className="mb-4 text-sm text-neutral-400">{stockModalProduct.name}</p>
              <form onSubmit={handleStockSubmit} className="space-y-3">
                <select
                  value={stockType}
                  onChange={(e) => setStockType(e.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white"
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
                  className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500"
                />
                <input
                  type="text"
                  placeholder="Note (optional)"
                  value={stockNote}
                  onChange={(e) => setStockNote(e.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStockModalProduct(null)}
                    className="rounded-md px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {editModalProduct && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-900 p-6 shadow-lg">
              <h2 className="mb-4 text-lg font-semibold text-white">Edit Product</h2>
              <form onSubmit={handleEditSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500"
                />
                <input
                  type="text"
                  placeholder="SKU"
                  value={editForm.sku}
                  onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                  required
                  className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  required
                  className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500"
                />
                <div>
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                    required
                    className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500"
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    Changing quantity here isn't recorded in stock history. Use "Adjust stock" for tracked changes.
                  </p>
                </div>
                <input
                  type="number"
                  placeholder="Low stock threshold"
                  value={editForm.lowStockAlert}
                  onChange={(e) => setEditForm({ ...editForm, lowStockAlert: e.target.value })}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder-neutral-500"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditModalProduct(null)}
                    className="rounded-md px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}