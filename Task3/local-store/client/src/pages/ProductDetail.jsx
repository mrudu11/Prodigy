import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, money } from '../api.js';
import { useCart } from '../CartContext.jsx';
import Stars from '../components/Stars.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const { add } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');
  const [review, setReview] = useState({ name: '', rating: 5, comment: '' });
  const [msg, setMsg] = useState('');

  const load = () => api.getProduct(id).then(setProduct).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await api.addReview(id, { ...review, rating: Number(review.rating) });
      setReview({ name: '', rating: 5, comment: '' });
      setMsg('Thanks for your review.');
      load();
    } catch (err) { setMsg(err.message); }
  };

  if (error) return <p className="error">{error}</p>;
  if (!product) return <p className="muted">Loading…</p>;
  const out = product.stock < 1;

  return (
    <>
      <div className="detail">
        <img src={product.image_url} alt={product.name} />
        <div>
          <span className="tag">{product.category}</span>
          <h1>{product.name}</h1>
          <Stars value={product.avg_rating} count={product.review_count} />
          <p className="price big">{money(product.price)}</p>
          <p>{product.description}</p>
          <p className={product.stock < 6 ? 'warn' : 'muted'}>
            {out ? 'Out of stock' : `${product.stock} in stock`}
          </p>
          {!out && (
            <div className="row">
              <input type="number" min="1" max={product.stock} value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="qty" />
              <button className="btn" onClick={() => add(product, qty)}>Add to cart</button>
            </div>
          )}
        </div>
      </div>

      <section className="reviews">
        <h2>Reviews</h2>
        {product.reviews.length === 0 && <p className="muted">No reviews yet. Be the first to write one.</p>}
        {product.reviews.map((r) => (
          <div key={r.id} className="review">
            <strong>{r.name}</strong> <Stars value={r.rating} />
            <p>{r.comment}</p>
          </div>
        ))}

        <form onSubmit={submitReview} className="form">
          <h3>Write a review</h3>
          <input required placeholder="Your name" value={review.name}
            onChange={(e) => setReview({ ...review, name: e.target.value })} />
          <select value={review.rating} onChange={(e) => setReview({ ...review, rating: e.target.value })}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 && 's'}</option>)}
          </select>
          <textarea placeholder="What did you think?" value={review.comment}
            onChange={(e) => setReview({ ...review, comment: e.target.value })} />
          <button className="btn">Post review</button>
          {msg && <p className="muted">{msg}</p>}
        </form>
      </section>
    </>
  );
}
