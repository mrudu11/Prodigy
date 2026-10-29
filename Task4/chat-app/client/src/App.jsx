import { useEffect, useState } from 'react';
import { api, getToken } from './api';
import Auth from './Auth.jsx';
import Chat from './Chat.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setChecking(false));
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (checking) return <div className="center muted">Loading…</div>;
  if (!user)
    return (
      <Auth
        onAuth={({ token, user }) => {
          localStorage.setItem('token', token);
          setUser(user);
        }}
      />
    );
  return <Chat user={user} token={getToken()} onLogout={logout} />;
}
