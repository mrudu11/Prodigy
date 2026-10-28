// All calls go through here. Vite proxies /api to the Express server.
async function request(url, options) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

export const api = {
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request(`/api/products?${qs}`);
  },
  getCategories: () => request('/api/products/categories'),
  getProduct: (id) => request(`/api/products/${id}`),
  addReview: (id, body) => request(`/api/products/${id}/reviews`, { method: 'POST', body: JSON.stringify(body) }),
  placeOrder: (body) => request('/api/orders', { method: 'POST', body: JSON.stringify(body) }),
  trackOrder: (id, phone) => request(`/api/orders/${id}?phone=${encodeURIComponent(phone)}`),
  sendSupport: (body) => request('/api/support', { method: 'POST', body: JSON.stringify(body) }),
};

export const money = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
