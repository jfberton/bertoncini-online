/**
 * Bertoncini Online - Main Web Application
 * Industrial Yellow & Black theme with Catalog, Cart, WhatsApp Ordering,
 * Mercado Libre Smart Matching, Light/Dark Mode Switcher & Analytics Dashboard.
 */

// Configuration
const CONFIG = {
  WHATSAPP_PHONE: '5493624608000', // Bertoncini Sales WhatsApp
  ML_STORE_URL: 'https://www.mercadolibre.com.ar/pagina/higiniobertonciniyciasa',
  ML_SEARCH_BASE: 'https://listado.mercadolibre.com.ar/pagina/higiniobertonciniyciasa/',
  STORE_NAME: 'Bertoncini Herramientas & Suministros Industriales',
  LOCATION: 'Av. Alvear 2100, Resistencia, Chaco',
  DEFAULT_PAGE_SIZE: 24
};

// Global State
const state = {
  products: [],
  filteredProducts: [],
  categories: [],
  cart: [],
  currentCategory: 'all',
  currentBrand: 'all',
  searchQuery: '',
  sortBy: 'featured',
  currentPage: 1,
  selectedProduct: null,
  theme: 'dark',
  toastTimeout: null
};

// ==========================================
// 1. ANALYTICS & METRICS TRACKING ENGINE
// ==========================================
// 1. ANALYTICS & STATS TRACKER (Local + GA4)
// ==========================================
const Analytics = {
  STORAGE_KEY: 'bertoncini_metrics_data',
  GA_STORAGE_KEY: 'bertoncini_ga_measurement_id',

  getGaId() {
    return localStorage.getItem(this.GA_STORAGE_KEY) || CONFIG.GA_MEASUREMENT_ID || '';
  },

  setGaId(id) {
    const cleanId = (id || '').trim();
    if (cleanId) {
      localStorage.setItem(this.GA_STORAGE_KEY, cleanId);
      this.initGA(cleanId);
      showToast(`🟢 Google Analytics 4 conectado (${cleanId})`);
    } else {
      localStorage.removeItem(this.GA_STORAGE_KEY);
      showToast('⚪ Tag de Google Analytics desactivado');
    }
    renderAnalyticsDashboard();
  },

  initGA(gaId) {
    const id = gaId || this.getGaId();
    if (!id) return;

    // Load gtag.js if not already present
    if (!document.getElementById('ga-gtag-script')) {
      const script = document.createElement('script');
      script.id = 'ga-gtag-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      document.head.appendChild(script);
    }

    if (typeof window.gtag === 'function') {
      window.gtag('config', id, {
        send_page_view: true,
        cookie_flags: 'SameSite=None;Secure'
      });
    }
  },

  sendGA(eventName, params = {}) {
    try {
      if (typeof window.gtag === 'function' && this.getGaId()) {
        window.gtag('event', eventName, params);
      }
    } catch (e) {
      console.warn('GA4 dispatch warning:', e);
    }
  },

  getData() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error loading analytics', e);
    }
    return {
      totalPageViews: 0,
      totalMlBannerClicks: 0,
      totalMlProductClicks: 0,
      totalWhatsAppOrders: 0,
      totalCartAdds: 0,
      firstVisit: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
      productClicks: {}, // { [productId]: { name, sku, count, lastClicked } }
      history: [] // log of last 50 events
    };
  },

  saveData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving analytics', e);
    }
  },

  trackPageView() {
    const data = this.getData();
    data.totalPageViews = (data.totalPageViews || 0) + 1;
    data.lastVisit = new Date().toISOString();
    this.saveData(data);

    this.sendGA('page_view', {
      page_title: 'Bertoncini | Catálogo Ferretería Industrial',
      page_location: window.location.href
    });
  },

  trackMlBannerClick() {
    const data = this.getData();
    data.totalMlBannerClicks = (data.totalMlBannerClicks || 0) + 1;
    data.history.unshift({
      type: 'ML_BANNER_CLICK',
      title: 'Click en Banner Principal Mercado Libre',
      time: new Date().toISOString()
    });
    if (data.history.length > 50) data.history.pop();
    this.saveData(data);

    this.sendGA('select_content', {
      content_type: 'mercado_libre_banner',
      item_id: 'banner_tienda_oficial_higiniobertoncini'
    });
  },

  trackMlProductClick(product) {
    if (!product) return;
    const data = this.getData();
    data.totalMlProductClicks = (data.totalMlProductClicks || 0) + 1;
    
    if (!data.productClicks[product.id]) {
      data.productClicks[product.id] = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        brand: product.brand,
        count: 0
      };
    }
    data.productClicks[product.id].count += 1;
    data.productClicks[product.id].lastClicked = new Date().toISOString();

    data.history.unshift({
      type: 'ML_PRODUCT_CLICK',
      productId: product.id,
      title: `Click ML en "${product.name}"`,
      sku: product.sku,
      time: new Date().toISOString()
    });
    if (data.history.length > 50) data.history.pop();

    this.saveData(data);

    this.sendGA('select_item', {
      item_list_name: 'Búsqueda Tienda Mercado Libre',
      items: [{
        item_id: product.sku,
        item_name: product.name,
        item_brand: product.brand || 'Bertoncini',
        item_category: product.category || 'General'
      }]
    });
  },

  trackWhatsAppOrder(itemCount) {
    const data = this.getData();
    data.totalWhatsAppOrders = (data.totalWhatsAppOrders || 0) + 1;
    data.history.unshift({
      type: 'WHATSAPP_ORDER',
      title: `Pedido WhatsApp generado (${itemCount} ítems)`,
      time: new Date().toISOString()
    });
    if (data.history.length > 50) data.history.pop();
    this.saveData(data);

    this.sendGA('generate_lead', {
      currency: 'ARS',
      value: itemCount,
      lead_type: 'whatsapp_catalog_order'
    });
  },

  trackAddToCart(product) {
    if (!product) return;
    const data = this.getData();
    data.totalCartAdds = (data.totalCartAdds || 0) + 1;
    this.saveData(data);

    this.sendGA('add_to_cart', {
      items: [{
        item_id: product.sku,
        item_name: product.name,
        item_brand: product.brand || 'Bertoncini',
        item_category: product.category || 'General'
      }]
    });
  },

  resetStats() {
    if (confirm('¿Desea reiniciar todas las estadísticas y métricas acumuladas?')) {
      localStorage.removeItem(this.STORAGE_KEY);
      renderAnalyticsDashboard();
      showToast('📊 Métricas locales reiniciadas');
    }
  }
};

// ==========================================
// 2. THEME CONTROLLER (Dark & Light Mode)
// ==========================================
function initTheme() {
  const saved = localStorage.getItem('bertoncini_theme');
  if (saved === 'light' || saved === 'dark') {
    state.theme = saved;
  } else {
    // Default to dark mode for industrial feel
    state.theme = 'dark';
  }
  applyTheme();
}

function applyTheme() {
  const html = document.documentElement;
  const themeIcons = document.querySelectorAll('.theme-toggle-icon');
  const themeLabels = document.querySelectorAll('.theme-toggle-label');

  if (state.theme === 'dark') {
    html.classList.add('dark');
    themeIcons.forEach(icon => {
      icon.setAttribute('data-lucide', 'sun');
    });
    themeLabels.forEach(label => label.textContent = 'Modo Claro');
  } else {
    html.classList.remove('dark');
    themeIcons.forEach(icon => {
      icon.setAttribute('data-lucide', 'moon');
    });
    themeLabels.forEach(label => label.textContent = 'Modo Oscuro');
  }

  localStorage.setItem('bertoncini_theme', state.theme);
  lucide.createIcons();
}

window.toggleTheme = function() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  showToast(state.theme === 'dark' ? '🌙 Modo Oscuro Activado' : '☀️ Modo Claro Activado');
};

// ==========================================
// 3. MERCADO LIBRE SMART MATCHING
// ==========================================

// Normalize Spanish accents to plain ASCII for ML URLs
function mlSlugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')                          // decompose accented chars
    .replace(/[\u0300-\u036f]/g, '')           // strip diacritics (á→a, ñ→n, etc.)
    .replace(/[^a-z0-9\s-]/g, ' ')            // keep only letters, digits, spaces, dashes
    .replace(/\s+/g, '-')                      // spaces to dashes
    .replace(/-+/g, '-')                       // collapse multiple dashes
    .replace(/^-|-$/g, '');                    // trim leading/trailing dashes
}

function getMercadoLibreUrl(product) {
  if (!product) return CONFIG.ML_STORE_URL;

  // 1. Direct mapped link on product object or mapping dictionary
  if (product.ml_url) return product.ml_url;
  if (window.BERTONCINI_ML_MAPPING && product.sku && window.BERTONCINI_ML_MAPPING[product.sku.trim()]) {
    return window.BERTONCINI_ML_MAPPING[product.sku.trim()];
  }

  // 2. Search within Bertoncini's official ML store page.
  //    Confirmed working format (discovered from real search):
  //    /pagina/higiniobertonciniyciasa/{slug}?sb=storefront_url#D[A:{query}]
  const cleanName = product.name
    .replace(/\(.*?\)/g, '')       // drop parenthetical notes
    .replace(/[+&/|\\]/g, ' ')
    .replace(/sku.*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Slug: clean ASCII with dashes (for the URL path)
  const slug = mlSlugify(cleanName).split('-').slice(0, 5).join('-');

  // Query: short natural-language terms (for the #D[A:...] fragment)
  const query = cleanName.split(/\s+/).slice(0, 4).join(' ');

  return `https://listado.mercadolibre.com.ar/pagina/higiniobertonciniyciasa/${slug}?sb=storefront_url#D[A:${encodeURIComponent(query)}]`;
}

window.openMercadoLibreBanner = function() {
  Analytics.trackMlBannerClick();
  window.open(CONFIG.ML_STORE_URL, '_blank');
};

window.openMercadoLibreProduct = function(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  Analytics.trackMlProductClick(product);
  const targetUrl = getMercadoLibreUrl(product);
  window.open(targetUrl, '_blank');
  showToast(`🔍 Buscando "${product.name}" en nuestra tienda oficial de ML...`);
};

// ==========================================
// 4. APP INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  Analytics.initGA();
  initData();
  initCart();
  initEventListeners();
  renderCategories();
  renderBrands();
  applyFilters();
  updateCartBadge();
  Analytics.trackPageView();
  lucide.createIcons();
});

function initData() {
  if (window.BERTONCINI_CATALOG && Array.isArray(window.BERTONCINI_CATALOG)) {
    state.products = window.BERTONCINI_CATALOG;
    state.filteredProducts = [...state.products];
  }
  if (window.BERTONCINI_CATEGORIES && Array.isArray(window.BERTONCINI_CATEGORIES)) {
    state.categories = window.BERTONCINI_CATEGORIES;
  }
  
  const totalCountEls = document.querySelectorAll('.total-products-count');
  totalCountEls.forEach(el => el.textContent = state.products.length.toLocaleString());
}

// ==========================================
// 5. CART & ORDERS WITH OBSERVATIONS
// ==========================================
function initCart() {
  try {
    const saved = localStorage.getItem('bertoncini_cart');
    if (saved) state.cart = JSON.parse(saved);
  } catch (e) {
    state.cart = [];
  }
}

function saveCart() {
  try {
    localStorage.setItem('bertoncini_cart', JSON.stringify(state.cart));
  } catch (e) {
    console.error('Error saving cart', e);
  }
  updateCartBadge();
  renderCartDrawer();
}

function addToCart(productId, quantity = 1, selectedVariant = null, note = '') {
  const prod = state.products.find(p => p.id === productId);
  if (!prod) return;

  const cleanNote = (note || '').trim();
  const existingIndex = state.cart.findIndex(item => 
    item.id === productId && 
    item.selectedVariant === selectedVariant && 
    (item.note || '').trim() === cleanNote
  );

  if (existingIndex > -1) {
    state.cart[existingIndex].quantity += quantity;
  } else {
    const uniqueKey = `${productId}_${selectedVariant || 'def'}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    state.cart.push({
      cartKey: uniqueKey,
      id: prod.id,
      name: prod.name,
      sku: prod.sku,
      category: prod.category,
      brand: prod.brand,
      image: prod.image,
      quantity: quantity,
      selectedVariant: selectedVariant,
      note: cleanNote
    });
  }

  saveCart();
  Analytics.trackAddToCart(prod);

  const noteInfo = cleanNote ? ` (Obs: "${cleanNote}")` : '';
  showToast(`✅ "${prod.name}" añadido al pedido (${quantity} u.)${noteInfo}`);
  
  const cartBtns = document.querySelectorAll('.cart-btn-indicator');
  cartBtns.forEach(btn => {
    btn.classList.add('cart-bounce');
    setTimeout(() => btn.classList.remove('cart-bounce'), 500);
  });
}

function updateCartQuantity(cartKey, newQty) {
  const itemIndex = state.cart.findIndex(item => item.cartKey === cartKey);
  if (itemIndex === -1) return;

  if (newQty <= 0) {
    removeFromCart(cartKey);
  } else {
    state.cart[itemIndex].quantity = newQty;
    saveCart();
  }
}

function updateItemNote(cartKey, newNote) {
  const itemIndex = state.cart.findIndex(item => item.cartKey === cartKey);
  if (itemIndex === -1) return;

  state.cart[itemIndex].note = (newNote || '').trim();
  saveCart();
  showToast('✏️ Observación de artículo actualizada');
}

function removeFromCart(cartKey) {
  const item = state.cart.find(i => i.cartKey === cartKey);
  const itemName = item ? item.name : 'Artículo';
  state.cart = state.cart.filter(item => item.cartKey !== cartKey);
  saveCart();
  showToast(`🗑️ "${itemName}" eliminado`);
}

function clearCart() {
  if (state.cart.length === 0) return;
  if (confirm('¿Desea vaciar todos los artículos de su pedido?')) {
    state.cart = [];
    saveCart();
    showToast('🗑️ Carrito vaciado');
  }
}

function updateCartBadge() {
  const count = state.cart.reduce((total, item) => total + item.quantity, 0);
  const badges = document.querySelectorAll('.cart-badge-count');
  badges.forEach(badge => {
    badge.textContent = count;
    if (count > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  });

  const cartSummaryCount = document.getElementById('cart-drawer-item-count');
  if (cartSummaryCount) {
    cartSummaryCount.textContent = `${count} ${count === 1 ? 'artículo' : 'artículos'}`;
  }
}

// ==========================================
// 6. CATEGORIES & BRANDS RENDER
// ==========================================
function buildCategoryCountsFromCatalog() {
  // Count products by their actual `category` field in the catalog
  const counts = {};
  state.products.forEach(p => {
    const cat = (p.category || '').trim();
    if (cat) counts[cat] = (counts[cat] || 0) + 1;
  });
  // Sort by count descending, then alphabetically
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function renderCategories() {
  const filterContainer = document.getElementById('category-filter-list');
  if (!filterContainer) return;

  // Always compute real counts from the catalog
  const realCats = buildCategoryCountsFromCatalog();
  const topCats = realCats.slice(0, 20); // show top 20 by count

  let html = `
    <button onclick="setCategory('all')" class="cat-pill px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${state.currentCategory === 'all' ? 'bg-yellow-400 text-black shadow-md font-bold' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'}">
      Todos (${state.products.length})
    </button>
  `;

  topCats.forEach(cat => {
    const isSelected = state.currentCategory === cat.name;
    html += `
      <button onclick="setCategory('${cat.name.replace(/'/g, "\\'")}')" class="cat-pill px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${isSelected ? 'bg-yellow-400 text-black shadow-md font-bold' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'}">
        ${cat.name} <span class="opacity-60 text-[10px]">(${cat.count})</span>
      </button>
    `;
  });

  filterContainer.innerHTML = html;

  // Also populate the mobile select
  const catSelect = document.getElementById('category-select-mobile');
  if (catSelect) {
    let selectHtml = `<option value="all">Todas las Categorías (${state.products.length})</option>`;
    realCats.forEach(c => {
      selectHtml += `<option value="${c.name}">${c.name} (${c.count})</option>`;
    });
    catSelect.innerHTML = selectHtml;
    if (state.currentCategory !== 'all') catSelect.value = state.currentCategory;
  }
}

function renderBrands() {
  const brandContainer = document.getElementById('brand-filter-select');
  if (!brandContainer) return;

  const brands = [...new Set(state.products.map(p => p.brand).filter(Boolean))].sort();
  
  let html = '<option value="all">Todas las Marcas</option>';
  brands.forEach(b => {
    html += `<option value="${b}">${b}</option>`;
  });
  brandContainer.innerHTML = html;
}

window.setCategory = function(catName) {
  state.currentCategory = catName;
  state.currentPage = 1;
  renderCategories();
  
  const catSelect = document.getElementById('category-select-mobile');
  if (catSelect) catSelect.value = catName;

  applyFilters();
  
  const catalogEl = document.getElementById('catalogo');
  if (catalogEl && window.scrollY < catalogEl.offsetTop - 150) {
    catalogEl.scrollIntoView({ behavior: 'smooth' });
  }
};

// Global function exposed for brand card buttons in HTML
window.selectBrand = function(brandName) {
  state.currentBrand = brandName;
  state.currentCategory = 'all';
  state.searchQuery = '';
  state.currentPage = 1;

  // Sync the brand <select> element
  const brandSelect = document.getElementById('brand-filter-select');
  if (brandSelect) brandSelect.value = brandName;

  // Clear the search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  const headerSearch = document.getElementById('header-search-input');
  if (headerSearch) headerSearch.value = '';

  renderCategories();
  applyFilters();

  // Scroll to catalog
  const catalogEl = document.getElementById('catalogo');
  if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
};

// ==========================================
// 7. SEARCH & FILTER PIPELINE
// ==========================================
function applyFilters() {
  const query = state.searchQuery.toLowerCase().trim();
  
  state.filteredProducts = state.products.filter(product => {
    let matchesQuery = true;
    if (query) {
      const nameMatch = product.name && product.name.toLowerCase().includes(query);
      const skuMatch = product.sku && product.sku.toLowerCase().includes(query);
      const descMatch = product.description && product.description.toLowerCase().includes(query);
      const brandMatch = product.brand && product.brand.toLowerCase().includes(query);
      const catMatch = product.categories && product.categories.some(c => c.toLowerCase().includes(query));
      
      matchesQuery = nameMatch || skuMatch || descMatch || brandMatch || catMatch;
    }

    let matchesCategory = true;
    if (state.currentCategory !== 'all') {
      matchesCategory = (product.category === state.currentCategory) || 
                        (product.categories && product.categories.includes(state.currentCategory));
    }

    let matchesBrand = true;
    if (state.currentBrand !== 'all') {
      const bQuery = state.currentBrand.toLowerCase();
      const directBrand = product.brand && product.brand.toLowerCase() === bQuery;
      const nameContains = product.name && product.name.toLowerCase().includes(bQuery);
      const descContains = product.description && product.description.toLowerCase().includes(bQuery);
      matchesBrand = directBrand || nameContains || descContains;
    }

    return matchesQuery && matchesCategory && matchesBrand;
  });

  if (state.sortBy === 'name-asc') {
    state.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  } else if (state.sortBy === 'name-desc') {
    state.filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
  } else if (state.sortBy === 'sku') {
    state.filteredProducts.sort((a, b) => (a.sku || '').localeCompare(b.sku || ''));
  }

  const resultCount = document.getElementById('catalog-results-count');
  if (resultCount) {
    resultCount.textContent = `Mostrando ${state.filteredProducts.length} de ${state.products.length} productos`;
  }

  renderProductsGrid();
}

// Helper: check if an item is a raw steel/metal material eligible for custom cuts (excluding tools, wheels, hardware)
function isProductCuttable(product) {
  if (!product) return false;
  const name = (product.name || '').toLowerCase();
  const cat = (product.category || '').toLowerCase();

  // Explicitly exclude manufactured products, tools, hardware, and wheels
  const isExcluded = /rueda|rodado|carro|carretilla|disco|tijera|cutter|tornillo|bulon|tuerca|arandela|bisagra|cerradura|candado|llave|pinza|alicate|martillo|taladro|amoladora|soldadora|guante|careta|mascara|escuadra|nivel|cinta|pincel|rodillo|cepillo|adhesivo|sellador|electrodo|caja|bolso|soporte|grampa|morsa|prensa|mecha|fresa|extractor|bomba|compresor|grupo/i.test(name);
  if (isExcluded) return false;

  // Match actual cuttable stock: tubes, angles, plates, profiles, mesh
  const isRawMaterial = /planchuela|perfil\s+[cu]|perfil\s+ipn|perfil\s+upn|tubo\s+estructural|caño\s+estructural|chapa\s+(lisa|antideslizante|negra|galvanizada|estampada|perforada|semilla)|hierro\s+(angulo|ángulo|redondo|cuadrado|torsionado)|malla\s+sima|barra\s+(redonda|cuadrada|de\s+hierro)/i.test(name);
  const isSteelCategory = /hierros,\s*chapas\s*y\s*aceros|metalurgica/i.test(cat);

  return isRawMaterial || (isSteelCategory && !isExcluded);
}

// ==========================================
// 8. RENDER PRODUCTS WITH ML BUTTON
// ==========================================
function renderProductsGrid() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  if (state.filteredProducts.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center text-zinc-500 dark:text-zinc-400">
        <div class="inline-flex p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-yellow-500 dark:text-yellow-400 mb-4">
          <i data-lucide="search-x" class="w-10 h-10"></i>
        </div>
        <h3 class="text-xl font-bold text-zinc-900 dark:text-white mb-2">No se encontraron productos</h3>
        <p class="text-sm max-w-md mx-auto mb-6">No encontramos resultados para tu búsqueda. Probá con otra palabra clave o código SKU.</p>
        <button onclick="resetFilters()" class="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg transition-colors">
          Restablecer Filtros
        </button>
      </div>
    `;
    lucide.createIcons();
    renderPagination();
    return;
  }

  const start = (state.currentPage - 1) * CONFIG.DEFAULT_PAGE_SIZE;
  const end = start + CONFIG.DEFAULT_PAGE_SIZE;
  const pageProducts = state.filteredProducts.slice(start, end);

  let html = '';

  pageProducts.forEach(product => {
    const isCustomCutEligible = isProductCuttable(product);
    const measureAttr = product.attributes ? product.attributes.find(a => a.name.toLowerCase().includes('medid')) : null;
    
    html += `
      <div class="product-card group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl dark:shadow-none hover:border-yellow-400 transition-all duration-300">
        
        <!-- Top Badge Bar -->
        <div class="p-3 pb-0 flex items-center justify-between gap-2 z-10">
          <span class="inline-flex items-center px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-[11px] font-mono font-medium tracking-tight truncate max-w-[140px]">
            SKU: ${escapeHtml(product.sku)}
          </span>
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 border border-yellow-400/30">
            ${escapeHtml(product.brand || 'Bertoncini')}
          </span>
        </div>

        <!-- Image Container -->
        <div class="relative w-full aspect-square bg-zinc-50 dark:bg-zinc-950/80 p-4 flex items-center justify-center overflow-hidden cursor-pointer" onclick="openProductModal(${product.id})">
          <img 
            src="${escapeHtml(product.image)}" 
            alt="${escapeHtml(product.name)}" 
            loading="lazy" 
            onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'"
            class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <span class="px-3 py-1.5 bg-yellow-400 text-black text-xs font-bold rounded-lg shadow-lg flex items-center gap-1">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i> Ficha Técnica
            </span>
          </div>
          ${isCustomCutEligible ? `
            <span class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-[10px] font-semibold flex items-center gap-1">
              <i data-lucide="scissors" class="w-2.5 h-2.5"></i> Corte a medida
            </span>
          ` : ''}
        </div>

        <!-- Product Content -->
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <span class="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block mb-1 truncate">
              ${escapeHtml(product.category)}
            </span>
            <h3 class="text-sm font-bold text-zinc-900 dark:text-white leading-snug group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 cursor-pointer" onclick="openProductModal(${product.id})">
              ${escapeHtml(product.name)}
            </h3>
          </div>

          <div class="mt-3">
            <!-- Measures selector if available -->
            ${measureAttr && measureAttr.options && measureAttr.options.length > 0 ? `
              <div class="mb-2">
                <label class="text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">Medida / Variante:</label>
                <select id="prod-measure-${product.id}" class="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-yellow-400 font-medium">
                  ${measureAttr.options.map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('')}
                </select>
              </div>
            ` : ''}

            <!-- Quick observation / cut input -->
            <div class="mb-2.5">
              <input 
                type="text" 
                id="prod-note-${product.id}" 
                placeholder="${isCustomCutEligible ? '✂️ Indicar corte / medida (opcional)...' : '📝 Observación / nota (opcional)...'}" 
                class="w-full bg-zinc-50 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-800 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg px-2.5 py-1.5 focus:border-yellow-400 focus:outline-none"
              />
            </div>

            <!-- Card Actions -->
            <div class="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <div class="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden">
                  <button type="button" onclick="adjustQtyInput('qty-${product.id}', -1)" class="px-2.5 py-1.5 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    -
                  </button>
                  <input type="number" id="qty-${product.id}" value="1" min="1" max="999" class="w-9 bg-transparent text-center text-xs font-bold text-zinc-900 dark:text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                  <button type="button" onclick="adjustQtyInput('qty-${product.id}', 1)" class="px-2.5 py-1.5 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    +
                  </button>
                </div>

                <button 
                  onclick="addProductFromCard(${product.id})"
                  class="flex-1 px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95">
                  <i data-lucide="plus-circle" class="w-4 h-4"></i>
                  <span>Al Pedido</span>
                </button>
              </div>

              <!-- ML Search Button -->
              <button 
                onclick="openMercadoLibreProduct(${product.id})" 
                class="w-full py-1.5 px-2 bg-[#FFE600]/15 hover:bg-[#FFE600] text-zinc-800 dark:text-yellow-300 hover:text-black border border-[#FFE600]/40 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 group/ml"
                title="Buscar este artículo en nuestra tienda oficial de Mercado Libre">
                <img src="assets/images/mercadolibre-handshake.png" alt="ML" class="w-3.5 h-3.5 object-contain">
                <span>Buscar en nuestra tienda</span>
                <i data-lucide="external-link" class="w-3 h-3 opacity-60"></i>
              </button>
            </div>
          </div>

        </div>

      </div>
    `;
  });

  grid.innerHTML = html;
  lucide.createIcons();
  renderPagination();
}

window.adjustQtyInput = function(inputId, delta) {
  const input = document.getElementById(inputId);
  if (!input) return;
  let val = parseInt(input.value) || 1;
  val = Math.max(1, val + delta);
  input.value = val;
};

window.addProductFromCard = function(productId) {
  const qtyInput = document.getElementById(`qty-${productId}`);
  const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;
  
  const measureSelect = document.getElementById(`prod-measure-${productId}`);
  const selectedVariant = measureSelect ? measureSelect.value : null;

  const noteInput = document.getElementById(`prod-note-${productId}`);
  const note = noteInput ? noteInput.value : '';

  addToCart(productId, qty, selectedVariant, note);
  if (noteInput) noteInput.value = '';
};

// ==========================================
// 9. PAGINATION
// ==========================================
function renderPagination() {
  const paginationContainer = document.getElementById('catalog-pagination');
  if (!paginationContainer) return;

  const totalPages = Math.ceil(state.filteredProducts.length / CONFIG.DEFAULT_PAGE_SIZE);

  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  let html = `
    <div class="flex items-center justify-center gap-1.5 flex-wrap">
      <button 
        onclick="goToPage(${state.currentPage - 1})" 
        ${state.currentPage === 1 ? 'disabled class="opacity-40 cursor-not-allowed px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 rounded-lg text-xs font-bold"' : 'class="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg text-xs font-bold transition-colors"'}
      >
        &larr; Anterior
      </button>
  `;

  const maxButtons = 5;
  let startPage = Math.max(1, state.currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  if (startPage > 1) {
    html += `<button onclick="goToPage(1)" class="w-8 h-8 rounded-lg text-xs font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300">1</button>`;
    if (startPage > 2) html += `<span class="text-zinc-400 px-1">...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === state.currentPage;
    html += `
      <button 
        onclick="goToPage(${i})" 
        class="w-8 h-8 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-yellow-400 text-black shadow-lg font-extrabold' : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300'}"
      >
        ${i}
      </button>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span class="text-zinc-400 px-1">...</span>`;
    html += `<button onclick="goToPage(${totalPages})" class="w-8 h-8 rounded-lg text-xs font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300">${totalPages}</button>`;
  }

  html += `
      <button 
        onclick="goToPage(${state.currentPage + 1})" 
        ${state.currentPage === totalPages ? 'disabled class="opacity-40 cursor-not-allowed px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 rounded-lg text-xs font-bold"' : 'class="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg text-xs font-bold transition-colors"'}
      >
        Siguiente &rarr;
      </button>
    </div>
  `;

  paginationContainer.innerHTML = html;
}

window.goToPage = function(page) {
  const totalPages = Math.ceil(state.filteredProducts.length / CONFIG.DEFAULT_PAGE_SIZE);
  if (page < 1 || page > totalPages) return;
  state.currentPage = page;
  renderProductsGrid();
  
  const catalogEl = document.getElementById('catalogo');
  if (catalogEl) {
    catalogEl.scrollIntoView({ behavior: 'smooth' });
  }
};

window.resetFilters = function() {
  state.searchQuery = '';
  state.currentCategory = 'all';
  state.currentBrand = 'all';
  state.currentPage = 1;
  
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  const headerSearch = document.getElementById('header-search-input');
  if (headerSearch) headerSearch.value = '';

  const brandSelect = document.getElementById('brand-filter-select');
  if (brandSelect) brandSelect.value = 'all';

  renderCategories();
  applyFilters();
};

// ==========================================
// 10. CART DRAWER RENDER
// ==========================================
function renderCartDrawer() {
  const container = document.getElementById('cart-items-container');
  const emptyState = document.getElementById('cart-empty-state');
  const footer = document.getElementById('cart-drawer-footer');
  if (!container) return;

  if (state.cart.length === 0) {
    if (container) container.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    if (footer) footer.classList.add('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (footer) footer.classList.remove('hidden');

  let html = '';
  state.cart.forEach(item => {
    html += `
      <div class="p-3.5 bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-xl space-y-2.5 group relative shadow-sm">
        
        <div class="flex gap-3 items-start">
          <img 
            src="${escapeHtml(item.image)}" 
            alt="${escapeHtml(item.name)}" 
            class="w-14 h-14 rounded-lg object-contain bg-white dark:bg-zinc-950 p-1 border border-zinc-300 dark:border-zinc-700 shrink-0"
            onerror="this.src='https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=200&q=80'"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-1">
              <h4 class="text-xs font-bold text-zinc-900 dark:text-white leading-tight">${escapeHtml(item.name)}</h4>
              <button onclick="removeFromCart('${item.cartKey}')" class="text-zinc-400 hover:text-red-500 transition-colors p-1" title="Eliminar artículo">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
            
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              <span class="text-[10px] font-mono text-yellow-700 dark:text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/30">
                SKU: ${escapeHtml(item.sku)}
              </span>
              ${item.selectedVariant ? `
                <span class="text-[10px] text-zinc-700 dark:text-zinc-200 bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded font-medium">
                  Medida: ${escapeHtml(item.selectedVariant)}
                </span>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Cut / Observation Box -->
        <div class="bg-white dark:bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
          <div class="flex items-center justify-between mb-1">
            <label class="text-[10px] font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider flex items-center gap-1">
              <i data-lucide="scissors" class="w-3 h-3"></i>
              <span>Corte / Medida / Observación:</span>
            </label>
            <span class="text-[9px] text-zinc-400">Editable</span>
          </div>
          <input 
            type="text" 
            value="${escapeHtml(item.note || '')}" 
            placeholder="Ej: Cortar a 1.20 x 2.40 mts / Fraccionar..." 
            onchange="updateItemNote('${item.cartKey}', this.value)" 
            class="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 focus:border-yellow-400 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 rounded px-2.5 py-1.5 focus:outline-none transition-colors"
          />
        </div>

        <!-- Quantity & Controls -->
        <div class="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-zinc-700/50">
          <span class="text-[11px] text-zinc-500 dark:text-zinc-400">Cantidad solicitada:</span>
          <div class="flex items-center bg-white dark:bg-zinc-900 rounded border border-zinc-300 dark:border-zinc-700">
            <button onclick="updateCartQuantity('${item.cartKey}', ${item.quantity - 1})" class="px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white">-</button>
            <span class="px-2 text-xs font-bold text-zinc-900 dark:text-white min-w-[24px] text-center">${item.quantity} u.</span>
            <button onclick="updateCartQuantity('${item.cartKey}', ${item.quantity + 1})" class="px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white">+</button>
          </div>
        </div>

      </div>
    `;
  });

  container.innerHTML = html;
  lucide.createIcons();
}

// ==========================================
// 11. PRODUCT DETAIL MODAL
// ==========================================
window.openProductModal = function(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;
  state.selectedProduct = product;

  const modal = document.getElementById('product-detail-modal');
  const modalContent = document.getElementById('product-modal-content');
  if (!modal || !modalContent) return;

  const measureAttr = product.attributes ? product.attributes.find(a => a.name.toLowerCase().includes('medid')) : null;
  const isMetalOrCut = isProductCuttable(product);

  modalContent.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
      
      <!-- Image Column (5 cols) -->
      <div class="md:col-span-5 flex flex-col gap-3">
        <div class="aspect-square bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-4 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 overflow-hidden relative shadow-inner">
          <img 
            id="modal-main-img" 
            src="${escapeHtml(product.image)}" 
            alt="${escapeHtml(product.name)}" 
            class="max-h-full max-w-full object-contain"
            onerror="this.src='https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'"
          />
        </div>

        ${product.images && product.images.length > 1 ? `
          <div class="flex gap-2 overflow-x-auto pb-1">
            ${product.images.map(imgUrl => `
              <button onclick="document.getElementById('modal-main-img').src='${escapeHtml(imgUrl)}'" class="w-14 h-14 rounded-xl bg-zinc-50 dark:bg-zinc-950 p-1 border border-zinc-300 dark:border-zinc-800 hover:border-yellow-400 shrink-0 transition-colors">
                <img src="${escapeHtml(imgUrl)}" class="w-full h-full object-contain">
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Info & Actions Column (7 cols) -->
      <div class="md:col-span-7 flex flex-col justify-between pr-0 sm:pr-2">
        <div>
          <!-- Header with clearance for the fixed close button -->
          <div class="flex items-center gap-2 mb-2 pr-10">
            <span class="px-2 py-0.5 rounded bg-yellow-400 text-black font-extrabold text-[11px] uppercase tracking-wider">
              ${escapeHtml(product.brand || 'Bertoncini')}
            </span>
            <span class="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">
              ${escapeHtml(product.category)}
            </span>
          </div>

          <h2 class="text-lg sm:text-xl font-heading font-black text-zinc-900 dark:text-white leading-snug mb-2.5 pr-8">
            ${escapeHtml(product.name)}
          </h2>

          <div class="flex items-center gap-2.5 p-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl mb-3">
            <div class="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
              SKU: <strong class="text-yellow-600 dark:text-yellow-400 font-bold">${escapeHtml(product.sku)}</strong>
            </div>
            <button onclick="navigator.clipboard.writeText('${escapeHtml(product.sku)}'); showToast('📋 SKU copiado');" class="text-xs text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white flex items-center gap-1 border border-zinc-300 dark:border-zinc-700 px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-800 transition-colors ml-auto">
              <i data-lucide="copy" class="w-3 h-3"></i> Copiar
            </button>
          </div>

          <!-- Description -->
          <div class="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3 max-h-24 overflow-y-auto pr-1">
            ${product.description ? `<p>${escapeHtml(product.description)}</p>` : `<p class="italic text-zinc-400">Consulte especificaciones técnicas y disponibilidad inmediata.</p>`}
          </div>

          <!-- Attributes / Measures Selection -->
          ${measureAttr && measureAttr.options && measureAttr.options.length > 0 ? `
            <div class="mb-2.5">
              <label class="text-[11px] uppercase font-bold text-yellow-700 dark:text-yellow-400 block mb-1">Medida / Variante:</label>
              <select id="modal-measure-select" class="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl px-3 py-2 text-xs font-medium focus:border-yellow-400">
                ${measureAttr.options.map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('')}
              </select>
            </div>
          ` : ''}

          <!-- Custom Cut & Item-Level Observation Field -->
          <div class="p-2.5 bg-zinc-50 dark:bg-zinc-900/90 rounded-xl border border-yellow-400/30 mb-3">
            <div class="flex items-center justify-between mb-1">
              <label class="text-[11px] uppercase font-extrabold text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                <i data-lucide="scissors" class="w-3 h-3"></i>
                <span>${isMetalOrCut ? 'Corte a Medida / Detalle:' : 'Observación / Nota:'}</span>
              </label>
              <span class="text-[10px] text-zinc-400">Opcional</span>
            </div>
            <input 
              type="text" 
              id="modal-note-input" 
              placeholder="${isMetalOrCut ? 'Ej: Cortar en 2 tramos de 1.5m, etc.' : 'Ej: Observación sobre el pedido...'}" 
              class="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white rounded-lg px-2.5 py-1.5 focus:border-yellow-400 focus:outline-none placeholder-zinc-400 dark:placeholder-zinc-500"
            />
          </div>

        </div>

        <!-- Action Buttons -->
        <div class="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <div class="flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 overflow-hidden shrink-0">
              <button onclick="adjustQtyInput('modal-qty-input', -1)" class="px-3 py-2 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-bold text-base">-</button>
              <input type="number" id="modal-qty-input" value="1" min="1" max="999" class="w-10 bg-transparent text-center font-bold text-zinc-900 dark:text-white text-sm focus:outline-none">
              <button onclick="adjustQtyInput('modal-qty-input', 1)" class="px-3 py-2 text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-bold text-base">+</button>
            </div>

            <button onclick="addProductFromModal(${product.id})" class="flex-1 py-2.5 px-4 bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95">
              <i data-lucide="shopping-cart" class="w-4 h-4"></i>
              <span>Agregar al Pedido</span>
            </button>

            <button onclick="askItemDirectWhatsApp(${product.id})" class="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shrink-0" title="Consultar por WhatsApp">
              <i data-lucide="message-circle" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- ML Search Button in Modal -->
          <button 
            onclick="openMercadoLibreProduct(${product.id})" 
            class="w-full py-2 px-3 bg-[#FFE600]/15 hover:bg-[#FFE600] text-zinc-900 dark:text-yellow-300 hover:text-black border border-[#FFE600]/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm group/ml">
            <img src="assets/images/mercadolibre-handshake.png" alt="Mercado Libre" class="w-4 h-4 object-contain">
            <span>Buscar en nuestra tienda de Mercado Libre</span>
            <i data-lucide="external-link" class="w-3.5 h-3.5 opacity-70"></i>
          </button>
        </div>

      </div>

    </div>
  `;

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  lucide.createIcons();
};

window.closeProductModal = function() {
  const modal = document.getElementById('product-detail-modal');
  if (modal) modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
};

window.addProductFromModal = function(productId) {
  const qtyInput = document.getElementById('modal-qty-input');
  const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

  const measureSelect = document.getElementById('modal-measure-select');
  const selectedVariant = measureSelect ? measureSelect.value : null;

  const noteInput = document.getElementById('modal-note-input');
  const note = noteInput ? noteInput.value : '';

  addToCart(productId, qty, selectedVariant, note);
  closeProductModal();
};

window.askItemDirectWhatsApp = function(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const measureSelect = document.getElementById('modal-measure-select');
  const variantText = measureSelect ? ` (Medida: ${measureSelect.value})` : '';
  const noteInput = document.getElementById('modal-note-input');
  const noteText = noteInput && noteInput.value.trim() ? `\n✂️ *Corte / Obs:* ${noteInput.value.trim()}` : '';

  const text = `Hola Bertoncini! 👋 Necesito consultar precio y disponibilidad del siguiente artículo:
📦 *${product.name}*
▫️ *SKU:* ${product.sku}${variantText}${noteText}

¿Tienen stock para entrega / retiro en Resistencia? Muchas gracias.`;

  const url = `https://wa.me/${CONFIG.WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

// ==========================================
// 12. WHATSAPP ORDER SUBMISSION
// ==========================================
window.submitOrderToWhatsApp = function() {
  if (state.cart.length === 0) {
    showToast('⚠️ Tu carrito está vacío');
    return;
  }

  const name = (document.getElementById('checkout-name')?.value || '').trim();
  const phone = (document.getElementById('checkout-phone')?.value || '').trim();
  const cuit = (document.getElementById('checkout-cuit')?.value || '').trim();
  const deliveryType = document.getElementById('checkout-delivery')?.value || 'Retiro en Local';
  const address = (document.getElementById('checkout-address')?.value || '').trim();
  const notes = (document.getElementById('checkout-notes')?.value || '').trim();

  if (!name) {
    alert('Por favor ingresá tu Nombre o Razón Social para armar el pedido.');
    document.getElementById('checkout-name')?.focus();
    return;
  }

  let msg = `🏗️ *NUEVO PEDIDO / COTIZACIÓN - BERTONCINI*\n`;
  msg += `==================================\n`;
  msg += `👤 *Cliente:* ${name}\n`;
  if (phone) msg += `📱 *Teléfono:* ${phone}\n`;
  if (cuit) msg += `🏢 *CUIT / DNI:* ${cuit}\n`;
  msg += `📍 *Modalidad:* ${deliveryType}\n`;
  if (address) msg += `🏠 *Dirección/Destino:* ${address}\n`;
  if (notes) msg += `📝 *Observaciones Generales:* ${notes}\n`;
  msg += `==================================\n`;
  msg += `📦 *DETALLE DE ARTÍCULOS (${state.cart.length} ítems):*\n\n`;

  state.cart.forEach((item, index) => {
    msg += `${index + 1}️⃣ *${item.name}*\n`;
    msg += `   ▫️ *SKU:* \`${item.sku}\`\n`;
    if (item.selectedVariant) {
      msg += `   ▫️ *Medida/Variante:* ${item.selectedVariant}\n`;
    }
    if (item.note && item.note.trim()) {
      msg += `   ✂️ *Corte / Obs:* ${item.note.trim()}\n`;
    }
    msg += `   ▫️ *Cantidad:* ${item.quantity} u.\n\n`;
  });

  msg += `==================================\n`;
  msg += `💬 _Pedido generado desde el Catálogo Online Bertoncini_`;

  Analytics.trackWhatsAppOrder(state.cart.length);

  const url = `https://wa.me/${CONFIG.WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  
  showToast('🚀 Pedido generado con éxito! Abriendo WhatsApp...');
};

// ==========================================
// 13. PRINT / PDF SLIP GENERATOR
// ==========================================
window.printOrderSlip = function() {
  if (state.cart.length === 0) {
    showToast('⚠️ No hay artículos en el pedido para imprimir');
    return;
  }

  const name = document.getElementById('checkout-name')?.value || 'Cliente General';
  const cuit = document.getElementById('checkout-cuit')?.value || '-';
  const phone = document.getElementById('checkout-phone')?.value || '-';
  const generalNotes = document.getElementById('checkout-notes')?.value || '';
  const dateStr = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  let printArea = document.getElementById('print-area');
  if (!printArea) {
    printArea = document.createElement('div');
    printArea.id = 'print-area';
    document.body.appendChild(printArea);
  }

  printArea.innerHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 850px; margin: 0 auto; color: #111;">
      <div style="border-bottom: 3px solid #FFC107; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px;">BERTONCINI</h1>
          <p style="margin: 3px 0 0; font-size: 12px; color: #555;">Herramientas • Acero • Ferretería Industrial • Tienda Oficial ML</p>
          <p style="margin: 2px 0 0; font-size: 11px; color: #777;">${CONFIG.LOCATION} | Resistencia, Chaco</p>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0; font-size: 16px; color: #333;">SOLICITUD DE COTIZACIÓN</h3>
          <p style="margin: 3px 0 0; font-size: 11px; color: #777;">Fecha: ${dateStr}</p>
        </div>
      </div>

      <div style="background: #f4f4f4; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div><strong>Cliente / Razón Social:</strong> ${escapeHtml(name)}</div>
        <div><strong>CUIT / DNI:</strong> ${escapeHtml(cuit)}</div>
        <div><strong>Teléfono:</strong> ${escapeHtml(phone)}</div>
        <div><strong>Modalidad de Entrega:</strong> ${escapeHtml(document.getElementById('checkout-delivery')?.value || 'Retiro en Local')}</div>
        ${generalNotes ? `<div style="grid-column: span 2;"><strong>Obs. Generales:</strong> ${escapeHtml(generalNotes)}</div>` : ''}
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 25px;">
        <thead>
          <tr style="background: #222; color: #fff;">
            <th style="padding: 8px; text-align: center; width: 35px;">#</th>
            <th style="padding: 8px; text-align: left; width: 130px;">SKU / Código</th>
            <th style="padding: 8px; text-align: left;">Descripción del Artículo</th>
            <th style="padding: 8px; text-align: left; width: 110px;">Variante</th>
            <th style="padding: 8px; text-align: left; width: 180px;">Corte / Observación</th>
            <th style="padding: 8px; text-align: center; width: 55px;">Cant.</th>
          </tr>
        </thead>
        <tbody>
          ${state.cart.map((item, idx) => `
            <tr style="border-bottom: 1px solid #ddd; ${idx % 2 === 0 ? 'background: #fff;' : 'background: #fafafa;'}">
              <td style="padding: 8px; text-align: center;">${idx + 1}</td>
              <td style="padding: 8px; font-family: monospace; font-weight: bold;">${escapeHtml(item.sku)}</td>
              <td style="padding: 8px; font-weight: 600;">${escapeHtml(item.name)}</td>
              <td style="padding: 8px; color: #555;">${escapeHtml(item.selectedVariant || '-')}</td>
              <td style="padding: 8px; color: #b45309; font-weight: bold;">${escapeHtml(item.note || '-')}</td>
              <td style="padding: 8px; text-align: center; font-weight: bold;">${item.quantity} u.</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="border-top: 1px dashed #aaa; padding-top: 15px; font-size: 11px; color: #666; text-align: center;">
        Documento generado automáticamente a través de la plataforma web de Bertoncini Online.<br>
        Validez sujeta a confirmación de stock y cotización formal por el departamento de ventas.
      </div>
    </div>
  `;

  window.print();
};

// ==========================================
// 14. ANALYTICS DASHBOARD MODAL CONTROLLER
// ==========================================
window.openAnalyticsModal = function() {
  renderAnalyticsDashboard();
  const modal = document.getElementById('analytics-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
};

window.closeAnalyticsModal = function() {
  const modal = document.getElementById('analytics-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
};

window.saveGoogleAnalyticsId = function() {
  const input = document.getElementById('ga-measurement-input');
  if (input) {
    Analytics.setGaId(input.value);
  }
};

function renderAnalyticsDashboard() {
  const container = document.getElementById('analytics-dashboard-content');
  if (!container) return;

  const gaId = Analytics.getGaId();

  container.innerHTML = `
    <!-- ================= GOOGLE ANALYTICS 4 GLOBAL TRACKING HUB ================= -->
    <div class="space-y-6">
      
      <!-- Status Card & Connection Form -->
      <div class="p-4 sm:p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border-2 ${gaId ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-amber-400/50 bg-amber-400/5'} shadow-sm">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl ${gaId ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-black'} flex items-center justify-center font-bold shadow-md shrink-0">
              <i data-lucide="${gaId ? 'check-circle-2' : 'globe'}" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-base font-heading font-black text-zinc-900 dark:text-white">
                  ${gaId ? `Google Analytics 4 Global` : 'Google Analytics 4 Global (Sin Configurar)'}
                </h4>
                ${gaId ? `<span class="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-mono font-bold">${escapeHtml(gaId)}</span>` : ''}
              </div>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                ${gaId ? 'Recopilando visitas globales, clics a la tienda de Mercado Libre y pedidos de todos los usuarios.' : 'Ingresá tu ID de medición para registrar todas las visitas y clics globales en tiempo real.'}
              </p>
            </div>
          </div>

          ${gaId ? `
            <a 
              href="https://analytics.google.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="w-full sm:w-auto px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0 active:scale-95">
              <i data-lucide="external-link" class="w-4 h-4"></i>
              <span>Abrir en Google Analytics</span>
            </a>
          ` : ''}
        </div>

        <!-- GA ID Input Box -->
        <div class="flex flex-col sm:flex-row items-center gap-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <div class="relative flex-1 w-full">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 text-xs font-mono font-bold">ID:</span>
            <input 
              type="text" 
              id="ga-measurement-input" 
              value="${escapeHtml(gaId)}" 
              placeholder="Ej: G-XXXXXXXXXX" 
              class="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white rounded-xl focus:border-yellow-400 focus:outline-none"
            />
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onclick="saveGoogleAnalyticsId()" 
              class="flex-1 sm:flex-none px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer">
              ${gaId ? 'Actualizar ID' : 'Conectar GA4'}
            </button>
            ${gaId ? `
              <button 
                onclick="Analytics.setGaId('')" 
                class="px-3 py-2.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-red-500 hover:text-white text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-colors cursor-pointer" title="Desconectar">
                Desvincular
              </button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Custom GA4 Events Table -->
      <div class="p-4 sm:p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <h4 class="text-sm font-bold text-zinc-900 dark:text-white mb-1.5 flex items-center gap-2">
          <i data-lucide="zap" class="w-4 h-4 text-yellow-500"></i>
          <span>Eventos Globales Automáticos de Bertoncini</span>
        </h4>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Cada interacción de los usuarios en cualquier dispositivo se envía automáticamente a Google Analytics:
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          
          <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0"></span>
            <div>
              <strong class="font-mono text-zinc-900 dark:text-white text-xs block">page_view</strong>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Visitas y navegación del catálogo de todos los usuarios.</p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
            <span class="w-2.5 h-2.5 rounded-full bg-yellow-500 mt-1 shrink-0"></span>
            <div>
              <strong class="font-mono text-zinc-900 dark:text-white text-xs block">select_content (ML Banner)</strong>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Clics globales hacia la Tienda Oficial de Mercado Libre.</p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0"></span>
            <div>
              <strong class="font-mono text-zinc-900 dark:text-white text-xs block">select_item (ML Search)</strong>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Búsquedas en Mercado Libre por producto (SKU, nombre, marca).</p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
            <div>
              <strong class="font-mono text-zinc-900 dark:text-white text-xs block">generate_lead (WhatsApp Order)</strong>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Cotizaciones y pedidos armados y enviados a WhatsApp.</p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
            <span class="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1 shrink-0"></span>
            <div>
              <strong class="font-mono text-zinc-900 dark:text-white text-xs block">add_to_cart</strong>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Artículos seleccionados para cotización.</p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
            <span class="w-2.5 h-2.5 rounded-full bg-purple-500 mt-1 shrink-0"></span>
            <div>
              <strong class="font-mono text-zinc-900 dark:text-white text-xs block">contact</strong>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Consultas directas enviadas por WhatsApp o Correo.</p>
            </div>
          </div>

        </div>
      </div>

      <!-- How-to Guide Card -->
      <div class="p-4 sm:p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
        <strong class="text-zinc-900 dark:text-white block mb-1.5 text-sm">💡 ¿Cómo vincular Google Analytics 4?</strong>
        <ol class="list-decimal list-inside space-y-1.5 text-xs">
          <li>Ingresá a <a href="https://analytics.google.com/" target="_blank" class="text-yellow-600 dark:text-yellow-400 underline font-bold">analytics.google.com</a> con tu cuenta de Google.</li>
          <li>Creá una propiedad llamada <strong>"Bertoncini Online"</strong> y agregá un flujo de datos <strong>Web</strong> (con tu dominio o URL de GitHub Pages).</li>
          <li>Copiá el <strong>ID de Medición</strong> (ej: <code>G-XXXXXXXXXX</code>) y pegalo arriba. ¡Todas las visitas y conversiones se registrarán automáticamente!</li>
        </ol>
      </div>

    </div>
  lucide.createIcons();
}

// ==========================================
// 15. TOAST & DRAWER CONTROLS
// ==========================================
function showToast(message) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'fixed bottom-6 right-6 z-50 bg-white dark:bg-zinc-900 border-2 border-yellow-400 text-zinc-900 dark:text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 translate-y-24 opacity-0 text-sm font-medium';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <span class="text-yellow-500 dark:text-yellow-400 font-bold text-lg">⚙️</span>
    <span>${message}</span>
  `;

  toast.classList.remove('translate-y-24', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  if (state.toastTimeout) clearTimeout(state.toastTimeout);
  state.toastTimeout = setTimeout(() => {
    toast.classList.add('translate-y-24', 'opacity-0');
    toast.classList.remove('translate-y-0', 'opacity-100');
  }, 3500);
}

window.toggleCartDrawer = function() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (!drawer || !backdrop) return;

  const isOpen = !drawer.classList.contains('translate-x-full');
  if (isOpen) {
    drawer.classList.add('translate-x-full');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    document.body.classList.remove('overflow-hidden');
  } else {
    renderCartDrawer();
    drawer.classList.remove('translate-x-full');
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    document.body.classList.add('overflow-hidden');
  }
};

// ==========================================
// 16. EVENT LISTENERS
// ==========================================
function initEventListeners() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      state.currentPage = 1;
      applyFilters();
    });
  }

  const headerSearch = document.getElementById('header-search-input');
  if (headerSearch) {
    headerSearch.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      state.currentPage = 1;
      if (searchInput) searchInput.value = e.target.value;
      applyFilters();
    });
    headerSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const catalogEl = document.getElementById('catalogo');
        if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  const brandSelect = document.getElementById('brand-filter-select');
  if (brandSelect) {
    brandSelect.addEventListener('change', (e) => {
      state.currentBrand = e.target.value;
      state.currentPage = 1;
      applyFilters();
    });
  }

  const catSelect = document.getElementById('category-select-mobile');
  if (catSelect) {
    catSelect.addEventListener('change', (e) => {
      setCategory(e.target.value);
    });
  }

  const sortSelect = document.getElementById('catalog-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      applyFilters();
    });
  }

  // Keyboard shortcuts: Escape closes modals, Alt + A opens Analytics
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProductModal();
      closeAnalyticsModal();
      const drawer = document.getElementById('cart-drawer');
      if (drawer && !drawer.classList.contains('translate-x-full')) {
        toggleCartDrawer();
      }
    }
    if (e.altKey && (e.key === 'a' || e.key === 'A')) {
      openAnalyticsModal();
    }
  });

  // Scroll listener for floating Home / Back-to-Top button (Bottom-Left)
  window.addEventListener('scroll', () => {
    const homeBtn = document.getElementById('floating-home-btn');
    if (homeBtn) {
      if (window.scrollY > 280) {
        homeBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-6');
        homeBtn.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
      } else {
        homeBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-6');
        homeBtn.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
      }
    }
  }, { passive: true });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================
// 17. DIRECT CONTACT FORM ACTIONS (WhatsApp & Email)
// ==========================================
window.submitContactWhatsApp = function() {
  const name = (document.getElementById('contact-name')?.value || '').trim();
  const phone = (document.getElementById('contact-phone')?.value || '').trim();
  const reason = document.getElementById('contact-reason')?.value || 'Consulta General';
  const message = (document.getElementById('contact-message')?.value || '').trim();

  if (!name) {
    alert('Por favor ingresá tu Nombre o Razón Social.');
    document.getElementById('contact-name')?.focus();
    return;
  }
  if (!phone) {
    alert('Por favor ingresá un Teléfono o WhatsApp de contacto.');
    document.getElementById('contact-phone')?.focus();
    return;
  }

  let text = `Hola Bertoncini! 👋 Les envío una consulta desde el sitio web:\n\n`;
  text += `👤 *Nombre / Razón Social:* ${name}\n`;
  text += `📱 *Teléfono:* ${phone}\n`;
  text += `📌 *Motivo:* ${reason}\n`;
  if (message) {
    text += `💬 *Mensaje:* ${message}\n`;
  }
  text += `\n¿Podrían brindarme información y asesoramiento? Muchas gracias!`;

  const url = `https://wa.me/${CONFIG.WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
  showToast('🚀 Abriendo WhatsApp con tu consulta...');
};

window.submitContactEmail = function() {
  const name = (document.getElementById('contact-name')?.value || '').trim();
  const phone = (document.getElementById('contact-phone')?.value || '').trim();
  const reason = document.getElementById('contact-reason')?.value || 'Consulta General';
  const message = (document.getElementById('contact-message')?.value || '').trim();

  if (!name) {
    alert('Por favor ingresá tu Nombre o Razón Social.');
    document.getElementById('contact-name')?.focus();
    return;
  }

  const subject = `Consulta Web Bertoncini: ${reason} - ${name}`;
  let body = `Estimado equipo de Bertoncini:\n\n`;
  body += `Les envío una consulta desde el sitio web oficial:\n\n`;
  body += `Nombre / Razón Social: ${name}\n`;
  body += `Teléfono de Contacto: ${phone || 'No especificado'}\n`;
  body += `Motivo: ${reason}\n\n`;
  body += `Detalle / Mensaje:\n${message || 'Solicito cotización y disponibilidad.'}\n\n`;
  body += `A la espera de su respuesta, saludos cordiales.`;

  const mailUrl = `mailto:ventas@bertoncinionline.com.ar?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailUrl;
  showToast('✉️ Abriendo tu cliente de correo...');
};
