// Supabase Authentication System - DECA Coop de Barranquitas
// Uses Supabase Auth for secure login

const AUTH_CONFIG = {
  tokenKey: 'deca_auth_token',
  tokenExpiry: 24 * 60 * 60 * 1000 // 24 horas
};

const supabase = getSupabase();

async function createToken(user) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    sub: user.id,
    email: user.email,
    nombre: user.nombre || user.email,
    iat: Date.now(),
    exp: Date.now() + AUTH_CONFIG.tokenExpiry,
    role: user.role || 'admin'
  };
  
  const token = {
    header: btoa(JSON.stringify(header)),
    payload: btoa(JSON.stringify(payload)),
    signature: btoa(user.id + Date.now())
  };
  
  return `${token.header}.${token.payload}.${token.signature}`;
}

function verifyToken(token) {
  if (!token) return false;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    
    if (payload.exp < Date.now()) {
      logout();
      return false;
    }
    
    return payload;
  } catch (error) {
    return false;
  }
}

async function login(email, password) {
  if (!supabase) {
    return { success: false, message: 'Supabase no está configurado' };
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) throw error;
    
    if (data.user) {
      const token = await createToken(data.user);
      localStorage.setItem(AUTH_CONFIG.tokenKey, token);
      localStorage.setItem('user_logged_in', 'true');
      
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (userData) {
        localStorage.setItem('user_data', JSON.stringify(userData));
      }
      
      return { success: true, token, user: data.user };
    }
    
    return { success: false, message: 'Error al iniciar sesión' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: error.message || 'Usuario o contraseña incorrectos' };
  }
}

async function register(email, password, nombre) {
  if (!supabase) {
    return { success: false, message: 'Supabase no está configurado' };
  }
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          nombre: nombre
        }
      }
    });
    
    if (error) throw error;
    
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: email,
        password_hash: 'supabase_auth',
        nombre: nombre,
        provider: 'email',
        role: 'customer'
      });
      
      return { success: true, user: data.user };
    }
    
    return { success: false, message: 'Error al registrar usuario' };
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, message: error.message || 'Error al registrarse' };
  }
}

function logout() {
  if (supabase) {
    supabase.auth.signOut().catch(console.error);
  }
  localStorage.removeItem(AUTH_CONFIG.tokenKey);
  localStorage.removeItem('user_data');
  localStorage.removeItem('user_logged_in');
  window.location.href = 'index.html';
}

function isAuthenticated() {
  const token = localStorage.getItem(AUTH_CONFIG.tokenKey);
  const userLoggedIn = localStorage.getItem('user_logged_in');
  return verifyToken(token) !== false || userLoggedIn === 'true';
}

async function getCurrentUser() {
  const userData = localStorage.getItem('user_data');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();
      return data || user;
    }
  }
  
  const token = localStorage.getItem(AUTH_CONFIG.tokenKey);
  return verifyToken(token);
}

async function checkAdminStatus(email) {
  if (!supabase) return false;
  
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('email', email)
    .single();
  
  return data?.role === 'admin';
}

// Mostrar modal de login
async function showLoginModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay active';
  modal.id = 'login-modal';
  modal.innerHTML = `
    <div class="glass-card rounded-2xl p-8 max-w-md w-full border border-white/10 animate-slide-up">
      <div class="text-center mb-6">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[#3b82f6]/20 flex items-center justify-center text-3xl">
          🔐
        </div>
        <h3 class="font-display text-2xl font-bold mb-2">Panel de Administración</h3>
        <p class="text-gray-400">Ingresa tus credenciales</p>
      </div>
      
      <form id="admin-login-form" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-300 mb-2">Email</label>
          <input type="email" id="admin-login-username"
            class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#3b82f6] focus:outline-none transition-colors"
            placeholder="admin@deca.coop" required>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-300 mb-2">Contraseña</label>
          <input type="password" id="admin-login-password"
            class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#3b82f6] focus:outline-none transition-colors"
            placeholder="••••••••" required>
        </div>

        <div id="admin-login-error" class="hidden text-red-400 text-sm text-center p-2 bg-red-400/10 rounded-lg">
        </div>

        <button type="submit" class="btn-primary w-full text-white font-bold py-3 rounded-lg">
          🔓 Iniciar Sesión
        </button>

        <button type="button" onclick="document.getElementById('login-modal').remove()"
          class="w-full text-gray-400 hover:text-white transition-colors py-2">
          Cancelar
        </button>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-login-username').value;
    const password = document.getElementById('admin-login-password').value;

    const result = await login(email, password);

    if (result.success) {
      modal.remove();
      if (typeof showToast === 'function') {
        showToast('✅ Sesión iniciada correctamente', 'success');
      }
      setTimeout(() => window.location.href = 'admin.html', 500);
    } else {
      const errorDiv = document.getElementById('admin-login-error');
      errorDiv.textContent = result.message;
      errorDiv.classList.remove('hidden');
    }
  });
}

