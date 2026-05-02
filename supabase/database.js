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
    return data || [];
  },

  async saveProduct(product) {
    const client = getSupabase();
    if (!client) return product;
    const payload = { ...product };
    if (payload.id === undefined || payload.id === null || payload.id === '') {
      delete payload.id;
    }
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
