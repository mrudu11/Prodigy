import { NavLink, Link } from 'react-router-dom';
import { useCart } from '../CartContext.jsx';

export default function Navbar() {
  const { count } = useCart();
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand">Local Store</Link>
        <nav className="nav-links">
          <NavLink to="/" end>Shop</NavLink>
          <NavLink to="/track">Track order</NavLink>
          <NavLink to="/support">Help</NavLink>
          <NavLink to="/cart" className="cart-link">
            Cart {count > 0 && <span className="badge">{count}</span>}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
