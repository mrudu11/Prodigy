import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext.jsx';
import { api, money } from '../api.js';

export default function Checkout() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ customer_name: '', phone: '', address: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await api.placeOrder({
        ...form,
        items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
      });
      setPlaced({ ...res, phone: form.phone });
      clear();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  if (placed)
    return (
      <div className="empty">
        <h2>Order placed</h2>
        <p>Your order number is <strong>#{placed.order_id}</strong>. Total to pay on delivery: {money(placed.total)}.</p>
        <p className="muted">Keep your order number and phone number to track it.</p>
        <button className="btn" onClick={() => navigate(`/track/${placed.order_id}?phone=${placed.phone}`)}>
          Track this order
        </button>
      </div>
    );

  if (!items.length)
    return <div className="empty"><h2>Nothing to check out</h2><Link className="btn" to="/">Browse products</Link></div>;

  return (
    <div className="checkout">
      <form onSubmit={submit} className="form">
        <h1>Delivery details</h1>
        <input required placeholder="Full name" value={form.customer_name} onChange={set('customer_name')} />
        <input required pattern="[0-9+ ]{10,15}" title="Enter a valid phone number"
          placeholder="Phone number" value={form.phone} onChange={set('phone')} />
        <textarea required placeholder="Delivery address" value={form.address} onChange={set('address')} />
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Placing order…' : `Place order · ${money(total)}`}</button>
        <p className="muted">Payment is collected on delivery.</p>
      </form>
      <aside className="summary">
        <h3>Order summary</h3>
        {items.map((i) => (
          <div key={i.id} className="sum-row"><span>{i.name} × {i.quantity}</span><span>{money(i.price * i.quantity)}</span></div>
        ))}
        <div className="sum-row total"><span>Total</span><span>{money(total)}</span></div>
      </aside>
    </div>
  );
}
