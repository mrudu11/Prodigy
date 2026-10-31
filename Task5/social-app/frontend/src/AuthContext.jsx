import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem('token')) return setLoading(false);
    api('/auth/me').then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  // Poll for new notifications every 20s
  useEffect(() => {
    if (!user) return setUnread(0);
    const load = () => api('/notifications/unread-count').then((d) => setUnread(d.count)).catch(() => {});
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [user]);

  const authenticate = (data) => { localStorage.setItem('token', data.token); setUser(data.user); };
  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  return (
    <Ctx.Provider value={{ user, setUser, loading, authenticate, logout, unread, setUnread }}>
      {children}
    </Ctx.Provider>
  );
}
