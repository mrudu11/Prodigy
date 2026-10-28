import { useState } from 'react';
import { api } from '../api.js';

export default function Support() {
  const [form, setForm] = useState({ name: '', contact: '', message: '' });
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.sendSupport(form);
      setMsg(res.message); setIsError(false);
      setForm({ name: '', contact: '', message: '' });
    } catch (err) { setMsg(err.message); setIsError(true); }
  };

  return (
    <div className="narrow">
      <h1>Need help?</h1>
      <p className="muted">Send us a message and the shop will reply on the phone number or email you give.</p>
      <form className="form" onSubmit={submit}>
        <input required placeholder="Your name" value={form.name} onChange={set('name')} />
        <input required placeholder="Phone or email" value={form.contact} onChange={set('contact')} />
        <textarea required placeholder="How can we help?" value={form.message} onChange={set('message')} />
        <button className="btn">Send message</button>
        {msg && <p className={isError ? 'error' : 'muted'}>{msg}</p>}
      </form>
    </div>
  );
}
