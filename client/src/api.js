const BASE = process.env.REACT_APP_API_URL || '';

function toQuery(params) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''));
  const q = new URLSearchParams(clean).toString();
  return q ? '?' + q : '';
}

// Token management
let _token = sessionStorage.getItem('admin_token') || null;
export const setAdminToken = (t) => { _token = t; if (t) sessionStorage.setItem('admin_token', t); else sessionStorage.removeItem('admin_token'); };
export const getAdminToken = () => _token;
export const clearAdminToken = () => setAdminToken(null);

async function req(method, path, body, auth = false) {
  const opts = { method, headers: {} };
  if (auth && _token) opts.headers['Authorization'] = `Bearer ${_token}`;
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}/api${path}`, opts);
  if (res.status === 401) { clearAdminToken(); throw new Error('SESSION_EXPIRED'); }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Fel');
  }
  return res.json();
}

export const api = {
  // Settings (public reads, auth writes)
  getSettings: () => req('GET', '/settings'),
  verifyPin: (pin) => req('POST', '/settings/verify-pin', { pin }),
  updateSettings: (data) => req('PUT', '/settings', data, true),

  // Categories
  getCategories: () => req('GET', '/categories'),
  createCategory: (data) => req('POST', '/categories', data, true),
  updateCategory: (id, data) => req('PUT', `/categories/${id}`, data, true),
  deleteCategory: (id) => req('DELETE', `/categories/${id}`, null, true),

  // Products (GET public, mutations auth)
  getProducts: () => req('GET', '/products'),
  createProduct: (data) => req('POST', '/products', data, true),
  updateProduct: (id, data) => req('PUT', `/products/${id}`, data, true),
  toggleAvailable: (id, available) => req('PUT', `/products/${id}`, { available }, true),
  deleteProduct: (id) => req('DELETE', `/products/${id}`, null, true),

  // Orders (POST public, rest auth)
  createOrder: (data) => req('POST', '/orders', data),
  getOrders: (params = {}) => req('GET', `/orders${toQuery(params)}`, null, true),
  getOrderItems: (id) => req('GET', `/orders/${id}/items`, null, true),
  deleteOrder: (id) => req('DELETE', `/orders/${id}`, null, true),
  deleteOrders: (ids) => req('DELETE', '/orders', { ids }, true),

  // Statistics
  getStatistics: (params = {}) => req('GET', `/statistics${toQuery(params)}`, null, true),
};
