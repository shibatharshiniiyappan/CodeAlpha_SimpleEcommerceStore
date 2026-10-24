/**
 * LUMEN Studio - Main Frontend Application Logic
 * Pure Vanilla JavaScript (Zero Frameworks)
 * Compliant with CodeAlpha Internship requirements
 */

(function () {
  'use strict';

  // ==========================================
  // Application State
  // ==========================================
  const state = {
    user: null,
    products: [],
    categories: ['All'],
    activeCategory: 'All',
    searchQuery: '',
    sortOrder: 'featured',
    cart: [],
    activeCoupon: null,
    currentProductView: null,
  };

  // Helper: Format Currency
  const formatMoney = (amount) => {
    return '$' + Number(amount || 0).toFixed(2);
  };

  // Toast Notification
  function showToast(message, type = 'normal') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // ==========================================
  // Storage & State Sync
  // ==========================================
  function loadCartFromStorage() {
    try {
      const stored = localStorage.getItem('lumen_cart');
      if (stored) {
        state.cart = JSON.parse(stored);
      }
    } catch {
      state.cart = [];
    }
    updateCartUI();
  }

  function saveCartToStorage() {
    localStorage.setItem('lumen_cart', JSON.stringify(state.cart));
    updateCartUI();
  }

  function loadUserFromStorage() {
    try {
      const stored = localStorage.getItem('lumen_user');
      if (stored) {
        state.user = JSON.parse(stored);
      }
    } catch {
      state.user = null;
    }
    updateAuthUI();
  }

  function saveUserToStorage(user) {
    state.user = user;
    if (user) {
      localStorage.setItem('lumen_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('lumen_user');
    }
    updateAuthUI();
  }

  // ==========================================
  // Product Catalog & Rendering
  // ==========================================
  async function fetchProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px; color: var(--text-muted);">
        Loading curated catalog...
      </div>
    `;

    try {
      const res = await API.products.getAll({
        category: state.activeCategory,
        search: state.searchQuery,
        sort: state.sortOrder,
      });

      state.products = res.products || [];
      renderProducts();
    } catch (err) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px; color: var(--status-error);">
          Unable to load products. Please check server status.
        </div>
      `;
    }
  }

  async function fetchCategories() {
    try {
      const res = await API.products.getCategories();
      if (res.categories && res.categories.length) {
        state.categories = res.categories;
        renderCategoryTabs();
      }
    } catch (err) {
      console.warn('Failed to fetch categories:', err);
    }
  }

  function renderCategoryTabs() {
    const tabsContainer = document.getElementById('categoryTabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = '';
    state.categories.forEach((cat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `tab-btn ${state.activeCategory.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`;
      btn.textContent = cat;
      btn.addEventListener('click', () => {
        state.activeCategory = cat;
        renderCategoryTabs();
        fetchProducts();
      });
      tabsContainer.appendChild(btn);
    });
  }

  function renderProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    if (state.products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 64px 20px; background: #fff; border: 1px solid var(--border-hairline); border-radius: var(--radius-lg);">
          <h3 style="font-size: 1.25rem; margin-bottom: 8px;">No products found</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 16px;">
            No items matched your current search or category filter.
          </p>
          <button id="resetFiltersBtn" class="btn btn-secondary">Clear Filters</button>
        </div>
      `;
      const resetBtn = document.getElementById('resetFiltersBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          state.activeCategory = 'All';
          state.searchQuery = '';
          const searchInput = document.getElementById('searchInput');
          if (searchInput) searchInput.value = '';
          renderCategoryTabs();
          fetchProducts();
        });
      }
      return;
    }

    grid.innerHTML = '';

    state.products.forEach((product) => {
      const card = document.createElement('article');
      card.className = 'product-card';

      const tagHtml = product.tags && product.tags.length ? `<span class="card-tag">${product.tags[0]}</span>` : '';
      const comparePriceHtml = product.compareAtPrice ? `<span class="compare-price">${formatMoney(product.compareAtPrice)}</span>` : '';

      card.innerHTML = `
        <div class="card-media" data-id="${product._id}">
          <img src="${product.image}" alt="${product.title}" class="card-img" loading="lazy" onerror="this.src='/images/vase.jpg';" />
          ${tagHtml}
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span>${product.category}</span>
            <span aria-hidden="true">·</span>
            <span>${product.countInStock > 0 ? `${product.countInStock} In Stock` : 'Out of Stock'}</span>
          </div>
          <h3 class="card-title" data-id="${product._id}">${product.title}</h3>
          <div class="card-rating">
            <span class="card-stars">★★★★★</span>
            <span class="tabular-nums">${product.rating.toFixed(1)} (${product.numReviews})</span>
          </div>
          <div class="card-bottom">
            <div class="card-pricing">
              <span class="current-price tabular-nums">${formatMoney(product.price)}</span>
              ${comparePriceHtml}
            </div>
            <button class="btn-card-add" data-id="${product._id}" ${product.countInStock === 0 ? 'disabled' : ''}>
              ${product.countInStock > 0 ? '+ Add' : 'Sold Out'}
            </button>
          </div>
        </div>
      `;

      // Click on image or title opens PDP
      const mediaEl = card.querySelector('.card-media');
      const titleEl = card.querySelector('.card-title');
      const openPdp = () => openProductDetail(product);
      mediaEl.addEventListener('click', openPdp);
      titleEl.addEventListener('click', openPdp);

      // Add to Cart button
      const addBtn = card.querySelector('.btn-card-add');
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(product, 1);
      });

      grid.appendChild(card);
    });
  }

  // ==========================================
  // Product Detail Modal (PDP)
  // ==========================================
  function openProductDetail(product) {
    state.currentProductView = product;
    const modal = document.getElementById('pdpModal');
    const container = document.getElementById('pdpContent');
    if (!modal || !container) return;

    let specsHtml = '';
    if (product.specs && product.specs.length) {
      specsHtml = `
        <table class="pdp-specs-table">
          <tbody>
            ${product.specs.map((s) => `<tr><td>${s.key}</td><td>${s.value}</td></tr>`).join('')}
          </tbody>
        </table>
      `;
    }

    container.innerHTML = `
      <div class="pdp-grid">
        <div class="pdp-gallery-main">
          <img src="${product.image}" alt="${product.title}" class="pdp-gallery-img" onerror="this.src='/images/vase.jpg';" />
        </div>
        <div>
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent-gold); font-weight: 600; margin-bottom: 8px;">
            ${product.category}
          </div>
          <h2 style="font-size: 1.85rem; line-height: 1.25; margin-bottom: 12px;">${product.title}</h2>
          
          <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 1.5rem; font-weight: 700;" class="tabular-nums">${formatMoney(product.price)}</span>
            ${product.compareAtPrice ? `<span style="text-decoration: line-through; color: var(--text-muted); font-size: 1.05rem;">${formatMoney(product.compareAtPrice)}</span>` : ''}
          </div>

          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">
            <span style="color: var(--accent-gold);">★★★★★</span>
            <span class="tabular-nums">${product.rating.toFixed(1)} · ${product.numReviews} Verified Reviews</span>
          </div>

          <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.65; margin-bottom: 24px;">
            ${product.description}
          </p>

          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 28px;">
            <div class="cart-stepper" style="padding: 4px;">
              <button class="cart-stepper-btn" id="pdpQtyMinus" style="padding: 6px 12px;">−</button>
              <span class="cart-stepper-qty" id="pdpQtyVal" style="padding: 0 12px; font-size: 0.95rem;">1</span>
              <button class="cart-stepper-btn" id="pdpQtyPlus" style="padding: 6px 12px;">+</button>
            </div>
            <button class="btn btn-primary" id="pdpAddBtn" style="flex-grow: 1;" ${product.countInStock === 0 ? 'disabled' : ''}>
              ${product.countInStock > 0 ? 'Add to Bag' : 'Out of Stock'}
            </button>
          </div>

          <div style="border-top: 1px solid var(--border-hairline); padding-top: 16px;">
            <div style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
              Specifications & Craftsmanship
            </div>
            ${specsHtml}
          </div>
        </div>
      </div>
    `;

    let qty = 1;
    const qtyVal = container.querySelector('#pdpQtyVal');
    const minusBtn = container.querySelector('#pdpQtyMinus');
    const plusBtn = container.querySelector('#pdpQtyPlus');
    const addBtn = container.querySelector('#pdpAddBtn');

    minusBtn.addEventListener('click', () => {
      if (qty > 1) {
        qty--;
        qtyVal.textContent = qty;
      }
    });

    plusBtn.addEventListener('click', () => {
      if (qty < product.countInStock) {
        qty++;
        qtyVal.textContent = qty;
      } else {
        showToast(`Maximum available stock is ${product.countInStock}.`);
      }
    });

    addBtn.addEventListener('click', () => {
      addToCart(product, qty);
      closeModal('pdpModal');
    });

    openModal('pdpModal');
  }

  // ==========================================
  // Shopping Cart Logic & Drawer
  // ==========================================
  function addToCart(product, qty = 1) {
    const existingIndex = state.cart.findIndex((item) => item.product === product._id);

    if (existingIndex > -1) {
      const newQty = state.cart[existingIndex].qty + qty;
      if (newQty > product.countInStock) {
        showToast(`Cannot add more than ${product.countInStock} items in stock.`, 'error');
        return;
      }
      state.cart[existingIndex].qty = newQty;
    } else {
      state.cart.push({
        product: product._id,
        title: product.title,
        price: product.price,
        image: product.image,
        qty: qty,
        countInStock: product.countInStock,
      });
    }

    saveCartToStorage();
    showToast(`Added "${product.title}" to your bag.`, 'success');
    openCartDrawer();
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter((item) => item.product !== productId);
    saveCartToStorage();
  }

  function updateItemQty(productId, delta) {
    const item = state.cart.find((i) => i.product === productId);
    if (!item) return;

    const newQty = item.qty + delta;
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > item.countInStock) {
      showToast(`Only ${item.countInStock} items in stock.`, 'error');
      return;
    }

    item.qty = newQty;
    saveCartToStorage();
  }

  function calculateCartTotals() {
    const itemsPrice = state.cart.reduce((acc, item) => acc + item.price * item.qty, 0);

    let discount = 0;
    if (state.activeCoupon && state.activeCoupon.code === 'CODEALPHA10') {
      discount = itemsPrice * 0.10;
    }

    const discountedSubtotal = Math.max(0, itemsPrice - discount);
    // Free shipping over $150
    const shippingPrice = itemsPrice >= 150 || itemsPrice === 0 ? 0 : 15;
    const taxPrice = discountedSubtotal * 0.08;
    const totalPrice = discountedSubtotal + shippingPrice + taxPrice;

    return {
      itemsPrice,
      discount,
      shippingPrice,
      taxPrice,
      totalPrice,
      count: state.cart.reduce((acc, item) => acc + item.qty, 0),
    };
  }

  function updateCartUI() {
    const totals = calculateCartTotals();

    // Update Header Badges
    const badgeEl = document.getElementById('cartBadge');
    if (badgeEl) {
      badgeEl.textContent = totals.count;
      badgeEl.style.display = totals.count > 0 ? 'flex' : 'none';
    }

    // Update Drawer
    const listEl = document.getElementById('cartItemsList');
    if (!listEl) return;

    if (state.cart.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 48px 12px; color: var(--text-secondary);">
          <p style="font-size: 1.1rem; margin-bottom: 8px;">Your shopping bag is empty</p>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">
            Explore our curated home and lifestyle collections.
          </p>
          <button id="cartExploreBtn" class="btn btn-secondary">Browse Products</button>
        </div>
      `;
      const browseBtn = document.getElementById('cartExploreBtn');
      if (browseBtn) {
        browseBtn.addEventListener('click', () => {
          closeCartDrawer();
          const catalogEl = document.getElementById('catalogSection');
          if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
        });
      }

      document.getElementById('cartFooter').style.display = 'none';
      return;
    }

    document.getElementById('cartFooter').style.display = 'block';

    listEl.innerHTML = '';
    state.cart.forEach((item) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <img src="${item.image}" alt="${item.title}" class="cart-item-thumb" onerror="this.src='/images/vase.jpg';" />
        <div>
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-price tabular-nums">${formatMoney(item.price)}</div>
          <div class="cart-stepper">
            <button class="cart-stepper-btn btn-minus" data-id="${item.product}">−</button>
            <span class="cart-stepper-qty tabular-nums">${item.qty}</span>
            <button class="cart-stepper-btn btn-plus" data-id="${item.product}">+</button>
          </div>
        </div>
        <button class="cart-remove-btn" data-id="${item.product}" title="Remove item">✕</button>
      `;

      itemEl.querySelector('.btn-minus').addEventListener('click', () => updateItemQty(item.product, -1));
      itemEl.querySelector('.btn-plus').addEventListener('click', () => updateItemQty(item.product, 1));
      itemEl.querySelector('.cart-remove-btn').addEventListener('click', () => removeFromCart(item.product));

      listEl.appendChild(itemEl);
    });

    // Update Totals Summary
    document.getElementById('cartSubtotal').textContent = formatMoney(totals.itemsPrice);
    document.getElementById('cartShipping').textContent = totals.shippingPrice === 0 ? 'FREE' : formatMoney(totals.shippingPrice);
    document.getElementById('cartTax').textContent = formatMoney(totals.taxPrice);
    document.getElementById('cartTotal').textContent = formatMoney(totals.totalPrice);

    const discountRow = document.getElementById('cartDiscountRow');
    if (totals.discount > 0) {
      discountRow.style.display = 'flex';
      document.getElementById('cartDiscount').textContent = `-${formatMoney(totals.discount)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  function openCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer && overlay) {
      drawer.classList.add('open');
      overlay.classList.add('active');
    }
  }

  function closeCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer && overlay) {
      drawer.classList.remove('open');
      overlay.classList.remove('active');
    }
  }

  // ==========================================
  // Generic Modal Helpers
  // ==========================================
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  // ==========================================
  // Authentication UI & Forms
  // ==========================================
  function updateAuthUI() {
    const container = document.getElementById('headerUserActions');
    if (!container) return;

    if (state.user) {
      container.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <button id="orderHistoryBtn" class="user-menu-btn">
            <span>Orders</span>
          </button>
          <div class="user-menu-btn" style="cursor: default; font-weight: 600;">
            <span>${state.user.name}</span>
          </div>
          <button id="signOutBtn" class="btn-icon" title="Sign Out">
            <span style="font-size: 0.8rem; font-weight: 600;">Logout</span>
          </button>
        </div>
      `;

      document.getElementById('orderHistoryBtn').addEventListener('click', openOrderHistoryModal);
      document.getElementById('signOutBtn').addEventListener('click', () => {
        API.auth.logout();
        saveUserToStorage(null);
        showToast('You have signed out.');
      });
    } else {
      container.innerHTML = `
        <button id="signInBtn" class="btn btn-secondary" style="padding: 8px 16px; font-size: 0.8rem;">
          Sign In
        </button>
      `;
      document.getElementById('signInBtn').addEventListener('click', () => {
        openModal('authModal');
      });
    }
  }

  function setupAuthForms() {
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');

    if (!tabLogin || !tabRegister) return;

    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      formLogin.style.display = 'block';
      formRegister.style.display = 'none';
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      formLogin.style.display = 'none';
      formRegister.style.display = 'block';
    });

    // Handle Login Submit
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const errorEl = document.getElementById('loginError');

      errorEl.classList.remove('visible');

      try {
        const res = await API.auth.login({ email, password });
        saveUserToStorage(res.user);
        closeModal('authModal');
        showToast(`Welcome back, ${res.user.name}!`, 'success');
        formLogin.reset();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.add('visible');
      }
    });

    // Handle Register Submit
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const errorEl = document.getElementById('regError');

      errorEl.classList.remove('visible');

      try {
        const res = await API.auth.register({ name, email, password });
        saveUserToStorage(res.user);
        closeModal('authModal');
        showToast(`Account created! Welcome, ${res.user.name}.`, 'success');
        formRegister.reset();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.add('visible');
      }
    });
  }

  // ==========================================
  // Checkout & Order Processing
  // ==========================================
  function openCheckoutModal() {
    if (state.cart.length === 0) {
      showToast('Your bag is empty.');
      return;
    }

    if (!state.user) {
      showToast('Please sign in or register to complete checkout.');
      openModal('authModal');
      return;
    }

    closeCartDrawer();

    const totals = calculateCartTotals();
    document.getElementById('checkoutItemsCount').textContent = totals.count;
    document.getElementById('checkoutSubtotal').textContent = formatMoney(totals.itemsPrice);
    document.getElementById('checkoutShipping').textContent = totals.shippingPrice === 0 ? 'FREE' : formatMoney(totals.shippingPrice);
    document.getElementById('checkoutTax').textContent = formatMoney(totals.taxPrice);
    document.getElementById('checkoutTotal').textContent = formatMoney(totals.totalPrice);

    // Pre-fill user name if available
    const fullNameInput = document.getElementById('shippingFullName');
    if (fullNameInput && !fullNameInput.value) {
      fullNameInput.value = state.user.name;
    }

    openModal('checkoutModal');
  }

  function setupCheckoutForm() {
    const form = document.getElementById('checkoutForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = document.getElementById('placeOrderBtn');
      btn.disabled = true;
      btn.textContent = 'Processing Order...';

      const shippingAddress = {
        fullName: document.getElementById('shippingFullName').value.trim(),
        address: document.getElementById('shippingAddress').value.trim(),
        city: document.getElementById('shippingCity').value.trim(),
        postalCode: document.getElementById('shippingPostal').value.trim(),
        country: document.getElementById('shippingCountry').value.trim(),
        phone: document.getElementById('shippingPhone').value.trim(),
      };

      const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'Credit / Debit Card';

      try {
        const res = await API.orders.create({
          orderItems: state.cart,
          shippingAddress,
          paymentMethod,
          couponCode: state.activeCoupon?.code,
        });

        // Clear cart
        state.cart = [];
        saveCartToStorage();

        closeModal('checkoutModal');
        showOrderConfirmation(res.order);
        showToast('Order confirmed successfully!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Place Order & Pay';
      }
    });
  }

  function showOrderConfirmation(order) {
    const container = document.getElementById('orderConfirmContent');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 56px; height: 56px; background: var(--status-success-bg); color: var(--status-success); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 1.5rem;">
          ✓
        </div>
        <h2 style="font-size: 1.75rem; margin-bottom: 6px;">Thank You, ${order.shippingAddress.fullName}!</h2>
        <p style="color: var(--text-secondary); font-size: 0.95rem;">
          Your order has been placed and confirmed.
        </p>
        <div style="margin-top: 12px; font-family: monospace; font-size: 1rem; color: var(--text-primary); font-weight: 700;">
          Order ID: ${order._id}
        </div>
      </div>

      <div style="background: var(--bg-surface-subtle); padding: 18px; border-radius: var(--radius-md); margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem;">
          <span style="color: var(--text-muted);">Payment Method:</span>
          <strong>${order.paymentMethod}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem;">
          <span style="color: var(--text-muted);">Delivery Address:</span>
          <span>${order.shippingAddress.address}, ${order.shippingAddress.city}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.95rem; font-weight: 700; border-top: 1px solid var(--border-hairline); padding-top: 8px; margin-top: 8px;">
          <span>Total Paid:</span>
          <span class="tabular-nums">${formatMoney(order.totalPrice)}</span>
        </div>
      </div>

      <div style="display: flex; gap: 12px;">
        <button id="viewHistoryFromConfirm" class="btn btn-secondary" style="flex: 1;">View All Orders</button>
        <button id="continueShopFromConfirm" class="btn btn-primary" style="flex: 1;">Continue Shopping</button>
      </div>
    `;

    document.getElementById('viewHistoryFromConfirm').addEventListener('click', () => {
      closeModal('orderConfirmModal');
      openOrderHistoryModal();
    });

    document.getElementById('continueShopFromConfirm').addEventListener('click', () => {
      closeModal('orderConfirmModal');
    });

    openModal('orderConfirmModal');
  }

  // ==========================================
  // Order History UI
  // ==========================================
  async function openOrderHistoryModal() {
    const list = document.getElementById('orderHistoryList');
    if (!list) return;

    list.innerHTML = `
      <div style="text-align: center; padding: 36px; color: var(--text-muted);">
        Loading past orders...
      </div>
    `;

    openModal('orderHistoryModal');

    try {
      const res = await API.orders.getMyOrders();
      const orders = res.orders || [];

      if (orders.length === 0) {
        list.innerHTML = `
          <div style="text-align: center; padding: 48px; color: var(--text-secondary);">
            <p style="font-size: 1.1rem; margin-bottom: 8px;">No orders found</p>
            <p style="font-size: 0.85rem; color: var(--text-muted);">You have not placed any orders yet.</p>
          </div>
        `;
        return;
      }

      list.innerHTML = '';
      orders.forEach((order) => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';

        const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });

        const itemsSummary = order.orderItems
          .map((i) => `${i.title} × ${i.qty}`)
          .join(', ');

        orderCard.innerHTML = `
          <div class="order-card-header">
            <div>
              <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 2px;">#${order._id}</div>
              <div style="font-size: 0.775rem; color: var(--text-muted);">Placed on ${dateStr}</div>
            </div>
            <span class="order-badge confirmed">${order.status || 'Confirmed'}</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.4;">
            ${itemsSummary}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-hairline); padding-top: 10px; font-size: 0.85rem;">
            <span style="color: var(--text-muted);">${order.orderItems.length} item(s) · ${order.paymentMethod}</span>
            <span style="font-weight: 700; font-size: 1rem;" class="tabular-nums">${formatMoney(order.totalPrice)}</span>
          </div>
        `;

        list.appendChild(orderCard);
      });
    } catch (err) {
      list.innerHTML = `
        <div style="text-align: center; padding: 36px; color: var(--status-error);">
          Failed to load orders: ${err.message}
        </div>
      `;
    }
  }

  // ==========================================
  // MongoDB Atlas Diagnostics Modal
  // ==========================================
  async function openDiagnosticsModal() {
    const content = document.getElementById('diagnosticsContent');
    if (!content) return;

    content.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--text-muted);">
        Checking MongoDB Atlas cluster connection...
      </div>
    `;

    openModal('diagnosticsModal');

    try {
      const res = await API.config.getStatus();
      const db = res.database;

      const whitelistNoticeHtml = db.ipWhitelistRequired ? `
        <div style="background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 14px 16px; border-radius: var(--radius-md); margin-bottom: 18px; font-size: 0.825rem; line-height: 1.5;">
          <div style="font-weight: 700; margin-bottom: 4px;">
            ⚠️ MongoDB Atlas IP Access Whitelist Notice
          </div>
          <p style="margin-bottom: 8px;">
            Your cluster rejected the connection because the cloud IP is not yet on your Atlas IP whitelist. To permit access:
          </p>
          <ol style="padding-left: 18px; margin-bottom: 10px;">
            <li>Go to <strong>MongoDB Atlas &gt; Security &gt; Network Access</strong>.</li>
            <li>Click <strong>+ Add IP Address</strong> and select <strong>Allow Access From Anywhere</strong> (<code>0.0.0.0/0</code>).</li>
            <li>Click <strong>Confirm</strong>. Your cluster will immediately connect.</li>
          </ol>
          <div style="font-size: 0.775rem; color: #78350f;">
            ✓ The store is fully operational right now using in-memory persistence.
          </div>
        </div>
      ` : '';

      content.innerHTML = `
        ${whitelistNoticeHtml}
        <div style="background: var(--bg-surface-subtle); padding: 18px; border-radius: var(--radius-md); margin-bottom: 20px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <span style="font-weight: 600; font-size: 0.95rem;">Database Engine</span>
            <span style="font-size: 0.8rem; padding: 4px 10px; border-radius: var(--radius-sm); font-weight: 600; background: ${db.isConnectedToAtlas ? '#dcfce7; color: #15803d;' : '#fef3c7; color: #92400e;'}">
              ${db.isConnectedToAtlas ? '● MongoDB Atlas Connected' : '● In-Memory Persistence Active'}
            </span>
          </div>
          <div style="font-size: 0.825rem; color: var(--text-secondary); margin-bottom: 6px;">
            <strong>Cluster Host:</strong> ${db.host}
          </div>
          <div style="font-size: 0.825rem; color: var(--text-secondary); margin-bottom: 12px;">
            <strong>Database:</strong> ${db.databaseName}
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center; border-top: 1px solid var(--border-hairline); padding-top: 12px;">
            <div>
              <div style="font-size: 1.2rem; font-weight: 700;">${db.counts.users}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Users</div>
            </div>
            <div>
              <div style="font-size: 1.2rem; font-weight: 700;">${db.counts.products}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Products</div>
            </div>
            <div>
              <div style="font-size: 1.2rem; font-weight: 700;">${db.counts.orders}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Orders</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 8px;">CodeAlpha Internship Compliance</h4>
          <ul style="font-size: 0.825rem; color: var(--text-secondary); line-height: 1.6; padding-left: 20px;">
            <li>Frontend: Plain HTML5, CSS3, and Vanilla JavaScript (No React/JSX/TS).</li>
            <li>Backend: Node.js with Express.js REST API architecture.</li>
            <li>Database: MongoDB Atlas with Mongoose ODM models.</li>
            <li>Security: Bcrypt password hashing & JWT token authentication.</li>
            <li>Deployment: Ready for Vercel / Render deployment.</li>
          </ul>
        </div>

        <form id="atlasConnectForm">
          <label class="form-label">Connect Custom MongoDB Atlas URI (Optional)</label>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="customAtlasUri" class="form-input" placeholder="mongodb+srv://user:pass@cluster0..." style="font-size: 0.8rem;" />
            <button type="submit" class="btn btn-primary" style="padding: 8px 16px; font-size: 0.8rem;">Connect</button>
          </div>
          <div id="atlasFormMsg" style="font-size: 0.8rem; margin-top: 6px;"></div>
        </form>
      `;

      document.getElementById('atlasConnectForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const uri = document.getElementById('customAtlasUri').value.trim();
        const msgEl = document.getElementById('atlasFormMsg');
        if (!uri) return;

        msgEl.textContent = 'Connecting...';
        msgEl.style.color = 'var(--text-muted)';

        try {
          const connectRes = await API.config.connectAtlas(uri);
          msgEl.textContent = connectRes.message;
          msgEl.style.color = 'var(--status-success)';
          showToast('Connected to MongoDB Atlas!', 'success');
          setTimeout(openDiagnosticsModal, 1500);
        } catch (err) {
          msgEl.textContent = err.message;
          msgEl.style.color = 'var(--status-error)';
        }
      });
    } catch (err) {
      content.innerHTML = `<div style="color: var(--status-error);">Failed to load diagnostics: ${err.message}</div>`;
    }
  }

  // ==========================================
  // Global Event Listeners & Initialization
  // ==========================================
  function init() {
    loadCartFromStorage();
    loadUserFromStorage();
    fetchCategories();
    fetchProducts();
    setupAuthForms();
    setupCheckoutForm();

    // Top Bar Announcement / Promo trigger
    const promoCodeLink = document.getElementById('promoCodeLink');
    if (promoCodeLink) {
      promoCodeLink.addEventListener('click', (e) => {
        e.preventDefault();
        const couponInput = document.getElementById('couponCodeInput');
        openCartDrawer();
        if (couponInput) {
          couponInput.value = 'CODEALPHA10';
          document.getElementById('applyCouponBtn').click();
        }
      });
    }

    // Hero CTA
    const heroCta = document.getElementById('heroCtaBtn');
    if (heroCta) {
      heroCta.addEventListener('click', () => {
        const catalog = document.getElementById('catalogSection');
        if (catalog) catalog.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Search input (debounced)
    const searchInput = document.getElementById('searchInput');
    let searchTimeout = null;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          state.searchQuery = e.target.value.trim();
          fetchProducts();
        }, 300);
      });
    }

    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sortOrder = e.target.value;
        fetchProducts();
      });
    }

    // Cart Drawer Triggers
    const cartBtn = document.getElementById('cartBtn');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartOverlay = document.getElementById('cartOverlay');

    if (cartBtn) cartBtn.addEventListener('click', openCartDrawer);
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

    // Coupon Code in Cart
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    if (applyCouponBtn) {
      applyCouponBtn.addEventListener('click', () => {
        const code = document.getElementById('couponCodeInput').value.trim().toUpperCase();
        if (code === 'CODEALPHA10') {
          state.activeCoupon = { code: 'CODEALPHA10', discountPercent: 0.10 };
          saveCartToStorage();
          showToast('Coupon "CODEALPHA10" applied! 10% discount added.', 'success');
        } else {
          showToast('Invalid coupon code. Try CODEALPHA10', 'error');
        }
      });
    }

    // Checkout Modal Trigger
    const checkoutBtn = document.getElementById('cartCheckoutBtn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckoutModal);

    // Diagnostics / MongoDB Atlas Status trigger
    const dbStatusBtn = document.getElementById('dbStatusBtn');
    if (dbStatusBtn) dbStatusBtn.addEventListener('click', openDiagnosticsModal);

    const footerDbStatusBtn = document.getElementById('footerDbStatusBtn');
    if (footerDbStatusBtn) footerDbStatusBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openDiagnosticsModal();
    });

    // Close buttons on all modals
    document.querySelectorAll('.modal-close-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    // Close modal when clicking on overlay background
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    // Listen for auth expiration
    window.addEventListener('auth:expired', () => {
      saveUserToStorage(null);
      showToast('Session expired. Please sign in again.', 'error');
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
