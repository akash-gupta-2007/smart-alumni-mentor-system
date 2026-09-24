import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, clearSession, saveSession } from '../lib/api.js';

const AuthCtx = createContext(null);
const blank = { token: null, user: null };

function readStored() {
  try {
    const token = localStorage.getItem('mm_token');
    const user = JSON.parse(localStorage.getItem('mm_user') || 'null');
    return token && user ? { token, user } : blank;
  } catch { return blank; }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    // Synchronous initial read — never blank if mm_user exists
    const stored = readStored();
    return stored.token ? stored : { ...blank, loading: true };
  });

  // Cross-tab + api.js 401 interceptor sync (api.js fires mm:logout on expiry)
  useEffect(() => {
    const onStore = () => setAuth(readStored());
    const onExpire = () => { clearSession(); setAuth(blank); };
    window.addEventListener('storage', onStore);
    window.addEventListener('mm:logout', onExpire);
    // Initial hydration complete
    setAuth(a => ({ ...a, loading: false }));
    return () => {
      window.removeEventListener('storage', onStore);
      window.removeEventListener('mm:logout', onExpire);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await api.login({ email, password });
    saveSession(r);
    setAuth({ token: r.token, user: r.user, loading: false });
    return r.user;
  }, []);

  const register = useCallback(async (body) => {
    const r = await api.register(body);
    saveSession(r);
    const me = r.user || await api.me().catch(() => ({ full_name: body.full_name, role: body.role }));
    setAuth({ token: r.token, user: me, loading: false });
    return me;
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch { /* server audit best-effort */ }
    clearSession();
    setAuth(blank);
  }, []);

  return <AuthCtx.Provider value={{ ...auth, login, register, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
