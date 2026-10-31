import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api.js';
import PostCard from '../components/PostCard.jsx';
import Stories from '../components/Stories.jsx';

export default function Home() {
  const { tag } = useParams();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const query = useCallback((p) => {
    const q = new URLSearchParams({ page: p });
    if (tag) q.set('tag', tag);
    return api(`/posts?${q}`);
  }, [tag]);

  useEffect(() => {
    setLoading(true); setPage(1);
    query(1).then((r) => { setPosts(r); setMore(r.length === 10); }).finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    const refresh = () => {
      query(1).then((r) => { setPosts(r); setPage(1); setMore(r.length === 10); });
    };
    window.addEventListener('post-created', refresh);
    return () => window.removeEventListener('post-created', refresh);
  }, [query]);

  const loadMore = async () => {
    const r = await query(page + 1);
    setPosts((p) => [...p, ...r]); setPage(page + 1); setMore(r.length === 10);
  };

  return (
    <>
      <h1 className="page-title">{tag ? `#${tag}` : 'Home'}</h1>
      {!tag && <Stories />}
      {loading && <p className="muted pad">Loading posts…</p>}
      {!loading && posts.length === 0 && (
        <p className="muted pad">No posts yet. Be the first to post.</p>
      )}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} onDelete={(id) => setPosts(posts.filter((x) => x.id !== id))} />
      ))}
      {more && <button className="btn ghost wide" onClick={loadMore}>Load more</button>}
    </>
  );
}
