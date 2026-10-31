import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Aside from './components/Aside.jsx';
import Composer from './components/Composer.jsx';
import Auth from './pages/Auth.jsx';
import Home from './pages/Home.jsx';
import Profile from './pages/Profile.jsx';
import Notifications from './pages/Notifications.jsx';

export default function App() {
  const { user, loading } = useAuth();
  const [creatingPost, setCreatingPost] = useState(false);
  if (loading) return <p className="center-note">Loading…</p>;

  return (
    <div className="shell">
      <Sidebar onCreatePost={() => setCreatingPost(true)} />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tag/:tag" element={<Home />} />
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Auth mode="login" />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Auth mode="register" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Aside />
      {creatingPost && user && (
        <div className="create-overlay" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setCreatingPost(false);
        }}>
          <section className="create-dialog" role="dialog" aria-modal="true" aria-labelledby="create-title">
            <header className="create-dialog-header">
              <h2 id="create-title">Create post</h2>
              <button className="people-close" onClick={() => setCreatingPost(false)} aria-label="Close composer">×</button>
            </header>
            <Composer onPosted={() => {
              setCreatingPost(false);
              window.dispatchEvent(new Event('post-created'));
            }} />
          </section>
        </div>
      )}
    </div>
  );
}
