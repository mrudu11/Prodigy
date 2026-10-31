import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Auth({ mode }) {
  const { authenticate } = useAuth();
  const isLogin = mode === 'login';
  const [f, setF] = useState({ username: '', email: '', display_name: '', password: '', identifier: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError('');
    try {
      const body = isLogin
        ? { identifier: f.identifier, password: f.password }
        : { username: f.username, email: f.email, display_name: f.display_name, password: f.password };
      authenticate(await api(`/auth/${mode}`, { method: 'POST', body }));
    } catch (err) { setError(err.message); }
  };

  return (
    <form className="card auth" onSubmit={submit}>
      <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
      {isLogin ? (
        <label>Username or email<input value={f.identifier} onChange={set('identifier')} required /></label>
      ) : (
        <>
          <label>Display name<input value={f.display_name} onChange={set('display_name')} /></label>
          <label>Username<input value={f.username} onChange={set('username')} required /></label>
          <label>Email<input type="email" value={f.email} onChange={set('email')} required /></label>
        </>
      )}
      <label>Password<input type="password" value={f.password} onChange={set('password')} required /></label>
      {error && <p className="error">{error}</p>}
      <button className="btn">{isLogin ? 'Log in' : 'Sign up'}</button>
      <p className="muted">
        {isLogin ? <>New here? <Link to="/register">Create an account</Link></>
                 : <>Already a member? <Link to="/login">Log in</Link></>}
      </p>
    </form>
  );
}
