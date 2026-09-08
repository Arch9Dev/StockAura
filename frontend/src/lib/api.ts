const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (email: string, password: string, name: string) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),

  getProducts: () => request('/products'),
  getProduct: (id: number) => request(`/products/${id}`),
  createProduct: (data: any) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: number, data: any) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: number) => request(`/products/${id}`, { method: 'DELETE' }),
  archiveProduct: (id: number) => request(`/products/${id}/archive`, { method: 'PATCH' }),
  restoreProduct: (id: number) => request(`/products/${id}/restore`, { method: 'PATCH' }),

  getSuppliers: () => request('/suppliers'),
  createSupplier: (data: any) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),

  addStockMovement: (data: any) => request('/stock-movements', { method: 'POST', body: JSON.stringify(data) }),
  getStockMovements: (productId?: number) =>
    request(`/stock-movements${productId ? `?productId=${productId}` : ''}`),
};