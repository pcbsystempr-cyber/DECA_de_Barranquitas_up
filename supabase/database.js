// =====================================================
// DATABASE LAYER — DECA Coop de Barranquitas
// Capa fina sobre Supabase para productos, configuración e imágenes
// =====================================================

const DB_TABLES = {
  products: 'products',
  config: 'config',
  orders: 'orders',
  users: 'users'
};

const DB_STORAGE_BUCKET = 'product-images';

// Resuelve qué URL de imagen mostrar leyendo AMBAS columnas (`image` e `image_url`).
// Si las dos están llenas y distintas, prefiere la que fue cambiada respecto al cache
// (así el index refleja la edición hecha desde el dashboard de Supabase en cualquier columna).
function _pickImage(row, cachedRow) {
  const a = (row.image || '').trim();
  const b = (row.image_url || '').trim();
  if (a && b && a === b) return a;
  if (a && !b) return a;
  if (b && !a) return b;
  if (a && b) {
    if (cachedRow) {
      const cachedA = (cachedRow.image || '').trim();
      const cachedB = (cachedRow.image_url || '').trim();
      if (a !== cachedA && b === cachedB) return a;
      if (b !== cachedB && a === cachedA) return b;
    }
    return b;
  }
  return '';
}

function _normalizeProducts(rows) {
  let cache = [];
  try {
    const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem('deca_products') : null;
    if (raw) cache = JSON.parse(raw) || [];
  } catch (_) { cache = []; }
  const cacheById = new Map(cache.map(p => [String(p.id), p]));
  return (rows || []).map(row => {
    const cached = cacheById.get(String(row.id));
    const url = _pickImage(row, cached);
    return { ...row, image: url, image_url: url };
  });
}

const DB = {
  // ---------- PRODUCTS ----------
  async getProducts() {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from(DB_TABLES.products)
      .select('*')
      .order('id', { ascending: true });
    if (error) { console.error('DB.getProducts:', error.message); throw error; }
    return _normalizeProducts(data);
  },

  async saveProduct(product) {
    const client = getSupabase();
    if (!client) return product;
    const payload = { ...product };
    if (payload.id === undefined || payload.id === null || payload.id === '') {
      delete payload.id;
    }
    // El campo `image` no existe como columna en la tabla `products` (solo `image_url`).
    // Mapeamos y eliminamos `image` antes del upsert para evitar el error
    // "Could not find the 'image' column of 'products' in the schema cache".
    if (payload.image && !payload.image_url) {
      payload.image_url = payload.image;
    }
    delete payload.image;
    const { data, error } = await client
      .from(DB_TABLES.products)
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    if (error) { console.error('DB.saveProduct:', error.message); throw error; }
    return data;
  },

  async deleteProduct(id) {
    const client = getSupabase();
    if (!client) return false;
    const { error } = await client
      .from(DB_TABLES.products)
      .delete()
      .eq('id', id);
    if (error) { console.error('DB.deleteProduct:', error.message); throw error; }
    return true;
  },

  // ---------- CONFIG ----------
  // La tabla `config` se asume con una sola fila identificada por id=1
  async getConfig() {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from(DB_TABLES.config)
      .select('*')
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) { console.error('DB.getConfig:', error.message); throw error; }
    return data || null;
  },

  async saveConfig(config) {
    const client = getSupabase();
    if (!client) return config;
    const payload = { id: 1, ...config };
    const { data, error } = await client
      .from(DB_TABLES.config)
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    if (error) { console.error('DB.saveConfig:', error.message); throw error; }
    return data;
  },

  // ---------- IMAGES (Supabase Storage) ----------
  async uploadImage(file) {
    const client = getSupabase();
    if (!client || !file) return null;

    const ext = (file.name && file.name.includes('.'))
      ? file.name.split('.').pop().toLowerCase()
      : 'jpg';
    const safeName = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: upErr } = await client
      .storage
      .from(DB_STORAGE_BUCKET)
      .upload(safeName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined
      });
    if (upErr) { console.error('DB.uploadImage:', upErr.message); throw upErr; }

    const { data } = client
      .storage
      .from(DB_STORAGE_BUCKET)
      .getPublicUrl(safeName);
    return data && data.publicUrl ? data.publicUrl : null;
  },

  // ---------- ORDERS (helpers opcionales) ----------
  async createOrder(order) {
    const client = getSupabase();
    if (!client) return order;
    const { data, error } = await client
      .from(DB_TABLES.orders)
      .insert(order)
      .select()
      .single();
    if (error) { console.error('DB.createOrder:', error.message); throw error; }
    return data;
  },

  async getOrders() {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client
      .from(DB_TABLES.orders)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('DB.getOrders:', error.message); throw error; }
    return data || [];
  }
};

if (typeof window !== 'undefined') {
  window.DB = DB;
}
