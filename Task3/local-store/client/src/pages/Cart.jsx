import { Link } from 'react-router-dom';
import { useCart } from '../CartContext.jsx';
import { money } from '../api.js';

export default function Cart() {
  const { items, setQuantity, remove, total } = useCart();

  if (!items.length)
    return (
      <div className="empty">
        <h2>Your cart is empty</h2>
        <Link className="btn" to="/">Browse products</Link>
      </div>
    );

  return (
    <>
      <h1>Your cart</h1>
      <div className="cart">
        {items.map((i) => (
          <div key={i.id} className="cart-row">
            <img src={i.image_url} alt="" />
            <div className="grow">
              <Link to={`/product/${i.id}`}><strong>{i.name}</strong></Link>
              <div className="muted">{money(i.price)} each</div>
            </div>
            <input type="number" min="1" max={i.stock} value={i.quantity} className="qty"
              onChange={(e) => setQuantity(i.id, Number(e.target.value))} />
            <strong className="line-total">{money(i.price * i.quantity)}</strong>
            <button className="link-btn" onClick={() => remove(i.id)}>Remove</button>
          </div>
        ))}
        <div className="cart-total">
          <span>Total</span>
          <strong>{money(total)}</strong>
        </div>
        <Link className="btn wide" to="/checkout">Continue to checkout</Link>
      </div>
    </>
  );
}
