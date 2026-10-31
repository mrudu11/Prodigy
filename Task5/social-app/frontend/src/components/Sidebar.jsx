import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Sidebar({ onCreatePost }) {
  const { user, logout, unread } = useAuth();
  return (
    <nav className="rail">
      <Link to="/" className="brand">Loop</Link>
      <NavLink to="/" end><span className="nav-icon" aria-hidden="true">⌂</span><span className="nav-label">Home</span></NavLink>
      {user && (
        <NavLink to="/notifications">
          <span className="nav-icon" aria-hidden="true">♡</span>
          <span className="nav-label">Notifications</span>
          {unread > 0 && <span className="badge">{unread}</span>}
        </NavLink>
      )}
      {user && <NavLink to={`/u/${user.username}`}><span className="nav-icon" aria-hidden="true">◉</span><span className="nav-label">Profile</span></NavLink>}
      {user && (
        <button className="btn create-post-btn" onClick={onCreatePost} aria-label="Create post">
          <span className="nav-icon" aria-hidden="true">+</span>
          <span className="nav-label">Create</span>
        </button>
      )}
      <span className="spacer" />
      {user ? (
        <button className="btn ghost" onClick={logout}><span className="nav-icon" aria-hidden="true">↪</span><span className="nav-label">Log out</span></button>
      ) : (
        <>
          <Link className="btn" to="/login">Log in</Link>
          <Link className="btn ghost" to="/register">Sign up</Link>
        </>
      )}
    </nav>
  );
}
