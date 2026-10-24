/**
 * LUMEN Studio - Frontend API Client
 * Vanilla JavaScript wrapper for backend REST endpoints
 */

const API = {
  getToken() {
    return localStorage.getItem('lumen_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('lumen_token', token);
    } else {
      localStorage.removeItem('lumen_token');
    }
  },

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({
        success: false,
        message: 'Invalid server response.',
      }));

      if (!response.ok) {
        // If 401 Unauthorized, remove expired token
        if (response.status === 401 && endpoint !== '/api/auth/login') {
          this.setToken(null);
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err.message);
      throw err;
    }
  },

  // Auth Endpoints
  auth: {
    async register({ name, email, password }) {
      const res = await API.request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      if (res.token) API.setToken(res.token);
      return res;
    },

    async login({ email, password }) {
      const res = await API.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.token) API.setToken(res.token);
      return res;
    },

    async getMe() {
      return await API.request('/api/auth/me', {
        method: 'GET',
      });
    },

    logout() {
      API.setToken(null);
      localStorage.removeItem('lumen_user');
      window.dispatchEvent(new CustomEvent('auth:change'));
    },
  },

  // Product Catalog Endpoints
  products: {
    async getAll({ category, search, sort } = {}) {
      const params = new URLSearchParams();
      if (category && category !== 'All') params.append('category', category);
      if (search) params.append('search', search);
      if (sort) params.append('sort', sort);

      const qs = params.toString();
      return await API.request(`/api/products${qs ? '?' + qs : ''}`);
    },

    async getById(id) {
      return await API.request(`/api/products/${id}`);
    },

    async getCategories() {
      return await API.request('/api/products/categories');
    },
  },

  // Order & Checkout Endpoints
  orders: {
    async create(orderData) {
      return await API.request('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
    },

    async getMyOrders() {
      return await API.request('/api/orders/my-orders');
    },

    async getById(id) {
      return await API.request(`/api/orders/${id}`);
    },
  },

  // Database and Internship Diagnostics
  config: {
    async getStatus() {
      return await API.request('/api/config/status');
    },

    async connectAtlas(uri) {
      return await API.request('/api/config/connect', {
        method: 'POST',
        body: JSON.stringify({ uri }),
      });
    },
  },
};

// Expose API to window
window.API = API;
