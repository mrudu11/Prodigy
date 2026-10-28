import { useEffect, useState } from 'react';
import { api } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '', sort: 'newest', min: '', max: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { api.getCategories().then(setCategories).catch(() => {}); }, []);

  // Re-fetch (debounced) whenever a filter changes
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api.getProducts(filters)
        .then((data) => { setProducts(data); setError(''); })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [filters]);

  const set = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });

  return (
    <>
      <section className="hero">
        <h1>Fresh from your neighbourhood shop</h1>
        <p>Order groceries, dairy and household items online. We deliver to your door.</p>
      </section>

      <section className="filters">
        <input type="search" placeholder="Search products" value={filters.q} onChange={set('q')} />
        <select value={filters.category} onChange={set('category')} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={filters.sort} onChange={set('sort')} aria-label="Sort by">
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Top rated</option>
          <option value="name">Name A–Z</option>
        </select>
        <input type="number" min="0" placeholder="Min ₹" value={filters.min} onChange={set('min')} />
        <input type="number" min="0" placeholder="Max ₹" value={filters.max} onChange={set('max')} />
      </section>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading products…</p>}
      {!loading && !error && products.length === 0 && (
        <p className="muted">No products match these filters. Try clearing the search or price range.</p>
      )}
      <section className="grid">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </section>
    </>
  );
}
