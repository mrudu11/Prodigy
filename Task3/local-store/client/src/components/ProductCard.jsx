import { Link } from 'react-router-dom';
import { useCart } from '../CartContext.jsx';
import { money } from '../api.js';
import Stars from './Stars.jsx';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const out = product.stock < 1;
  return (
    <article className="card">
      <Link to={`/product/${product.id}`}>
        <img src={product.image_url} alt={product.name} loading="lazy" />
      </Link>
      <div className="card-body">
        <span className="tag">{product.category}</span>
        <h3><Link to={`/product/${product.id}`}>{product.name}</Link></h3>
        <Stars value={product.avg_rating} count={product.review_count} />
        <p className="desc">{product.description}</p>
        <div className="card-foot">
          <strong className="price">{money(product.price)}</strong>
          <button className="btn" disabled={out} onClick={() => add(product)}>
            {out ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
