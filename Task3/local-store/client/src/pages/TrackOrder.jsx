import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api, money } from '../api.js';

const STEPS = ['Placed', 'Packed', 'Out for delivery', 'Delivered'];

export default function TrackOrder() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [orderId, setOrderId] = useState(id || '');
  const [phone, setPhone] = useState(params.get('phone') || '');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  const lookup = async (oid, ph) => {
    try { setOrder(await api.trackOrder(oid, ph)); setError(''); }
    catch (e) { setOrder(null); setError(e.message); }
  };

  useEffect(() => { if (id && params.get('phone')) lookup(id, params.get('phone')); }, [id]);

  const current = order ? STEPS.indexOf(order.status) : -1;

  return (
    <div className="narrow">
      <h1>Track your order</h1>
      <form className="form" onSubmit={(e) => { e.preventDefault(); lookup(orderId, phone); }}>
        <input required placeholder="Order number" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
        <input required placeholder="Phone number used at checkout" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button className="btn">Find order</button>
      </form>
      {error && <p className="error">{error}</p>}

      {order && (
        <div className="order">
          <h2>Order #{order.id}</h2>
          {order.status === 'Cancelled' ? (
            <p className="error">This order was cancelled.</p>
          ) : (
            <ol className="steps">
              {STEPS.map((s, i) => (
                <li key={s} className={i <= current ? 'done' : ''}>{s}</li>
              ))}
            </ol>
          )}
          <p className="muted">Placed on {new Date(order.created_at).toLocaleString()}</p>
          {order.items.map((it, i) => (
            <div key={i} className="sum-row"><span>{it.name} × {it.quantity}</span><span>{money(it.price * it.quantity)}</span></div>
          ))}
          <div className="sum-row total"><span>Total</span><span>{money(order.total)}</span></div>
          <p className="muted">Delivering to: {order.address}</p>
        </div>
      )}
    </div>
  );
}
