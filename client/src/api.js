const BASE = process.env.REACT_APP_API_URL || '';

function toQuery(params) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''));
  const q = new URLSearchParams(clean).toString();
  return q ? '?' + q : '';
}

async function req(method, path, body, isFormData = false) {
  const opts = { method, headers: {} };
  if (body) {
    if (isFormData) {
      opts.body = body;
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(`${BASE}/api${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Fel');
  }
  return res.json();
}

export const api = {
  // Settings
  getSettings: () => req('GET', '/settings'),
  verifyPin: (pin) => req('POST', '/settings/verify-pin', { pin }),
  updateSettings: (data) => req('PUT', '/settings', data),

  // Categories
  getCategories: () => req('GET', '/categories'),
  createCategory: (data) => req('POST', '/categories', data),
  updateCategory: (id, data) => req('PUT', `/categories/${id}`, data),
  deleteCategory: (id) => req('DELETE', `/categories/${id}`),

  // Products
  getProducts: () => req('GET', '/products'),
  createProduct: (formData) => req('POST', '/products', formData, true),
  updateProduct: (id, formData) => req('PUT', `/products/${id}`, formData, true),
  toggleAvailable: (id, available) => {
    const fd = new FormData();
    fd.append('available', String(available));
    return req('PUT', `/products/${id}`, fd, true);
  },
  deleteProduct: (id) => req('DELETE', `/products/${id}`),

  // Orders
  createOrder: (data) => req('POST', '/orders', data),
  getOrders: (params = {}) => {
    const q = toQuery(params);
    return req('GET', `/orders${q}`);
  },
  deleteOrder: (id) => req('DELETE', `/orders/${id}`),
  deleteOrders: (ids) => req('DELETE', '/orders', { ids }),

  // Statistics
  getStatistics: (params = {}) => {
    const q = toQuery(params);
    return req('GET', `/statistics${q}`);
  },
};
