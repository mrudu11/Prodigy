export default function Stars({ value = 0, count }) {
  const rounded = Math.round(value);
  return (
    <span className="stars" aria-label={`${Number(value).toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? 'on' : ''}>★</span>
      ))}
      {count !== undefined && <small> ({count})</small>}
    </span>
  );
}
