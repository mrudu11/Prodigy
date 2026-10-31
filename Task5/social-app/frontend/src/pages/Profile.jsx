import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import PostCard from '../components/PostCard.jsx';

export default function Profile() {
  const { username } = useParams();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsMore, setPostsMore] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState('');
  const postsRef = useRef(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display_name: '', bio: '' });
  const [avatar, setAvatar] = useState(null);
  const [peopleList, setPeopleList] = useState(null);
  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState('');

  const load = () => {
    setError('');
    api(`/users/${username}`).then((p) => { setProfile(p); setForm({ display_name: p.display_name, bio: p.bio || '' }); })
      .catch((e) => setError(e.message));
    setPosts([]);
    setPostsPage(1);
    setPostsMore(false);
    loadPosts(1);
  };
  useEffect(load, [username]);

  const loadPosts = async (page, append = false) => {
    setPostsLoading(true);
    setPostsError('');
    try {
      const result = await api(`/posts?user=${encodeURIComponent(username)}&page=${page}`);
      setPosts((current) => append ? [...current, ...result] : result);
      setPostsPage(page);
      setPostsMore(result.length === 10);
    } catch (e) {
      setPostsError(e.message);
    } finally {
      setPostsLoading(false);
    }
  };

  const showPosts = () => postsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  useEffect(() => {
    if (!peopleList || !profile) return;
    setPeopleLoading(true);
    setPeopleError('');
    api(`/users/${profile.username}/${peopleList}`)
      .then(setPeople)
      .catch((e) => setPeopleError(e.message))
      .finally(() => setPeopleLoading(false));
  }, [peopleList, profile]);

  const follow = async () => {
    if (!user) return navigate('/login');
    const r = await api(`/users/${profile.id}/follow`, { method: 'POST' });
    setProfile({ ...profile, is_following: r.following, followers: profile.followers + (r.following ? 1 : -1) });
    window.dispatchEvent(new Event('follow-change'));
  };

  const save = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('display_name', form.display_name);
    fd.append('bio', form.bio);
    if (avatar) fd.append('avatar', avatar);
    const r = await api('/users/me/profile', { method: 'PUT', form: fd });
    setUser(r.user); setEditing(false); setAvatar(null); load();
  };

  if (error) return <p className="muted pad">{error}</p>;
  if (!profile) return <p className="muted pad">Loading…</p>;
  const mine = user?.id === profile.id;

  return (
    <>
      <section className="card profile">
        <Avatar user={profile} size={84} />
        <div className="profile-info">
          <h1>{profile.display_name}</h1>
          <p className="muted">@{profile.username}</p>
          {profile.bio && <p>{profile.bio}</p>}
          <p className="stats">
            <button className="stat-link" onClick={showPosts}>
              <b>{profile.posts}</b> posts
            </button>{' '}
            <button className="stat-link" onClick={() => setPeopleList('followers')}>
              <b>{profile.followers}</b> followers
            </button>{' '}
            <button className="stat-link" onClick={() => setPeopleList('following')}>
              <b>{profile.following}</b> following
            </button>
          </p>
        </div>
        {mine
          ? <button className="btn ghost" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit profile'}</button>
          : <button className={profile.is_following ? 'btn ghost' : 'btn'} onClick={follow}>
              {profile.is_following ? 'Following' : 'Follow'}
            </button>}
      </section>

      {editing && (
        <form className="card auth" onSubmit={save}>
          <label>Display name<input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></label>
          <label>Bio<textarea rows={3} maxLength={300} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></label>
          <label>Profile picture<input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files[0])} /></label>
          <button className="btn">Save changes</button>
        </form>
      )}

      {peopleList && (
        <div className="people-overlay" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setPeopleList(null);
        }}>
          <section className="people-dialog" role="dialog" aria-modal="true" aria-labelledby="people-title">
            <header className="people-dialog-header">
              <h2 id="people-title">{peopleList === 'followers' ? 'Followers' : 'Following'}</h2>
              <button className="people-close" onClick={() => setPeopleList(null)} aria-label="Close list">×</button>
            </header>
            {peopleLoading && <p className="muted people-empty">Loading…</p>}
            {!peopleLoading && peopleError && <p className="error people-empty">{peopleError}</p>}
            {!peopleLoading && !peopleError && people.length === 0 && (
              <p className="muted people-empty">No {peopleList} yet.</p>
            )}
            {!peopleLoading && !peopleError && people.map((person) => (
              <Link
                key={person.id}
                to={`/u/${person.username}`}
                className="people-row"
                onClick={() => setPeopleList(null)}
              >
                <Avatar user={person} size={40} />
                <span><b>{person.display_name}</b><br /><span className="muted">@{person.username}</span></span>
              </Link>
            ))}
          </section>
        </div>
      )}

      <section ref={postsRef} className="profile-posts">
        <h2 className="profile-posts-title">Posts</h2>
        {postsError && <p className="error">{postsError}</p>}
        {!postsLoading && posts.length === 0 && !postsError && <p className="muted pad">No posts yet.</p>}
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            onDelete={(id) => {
              setPosts((current) => current.filter((x) => x.id !== id));
              setProfile((current) => ({ ...current, posts: Math.max(0, current.posts - 1) }));
            }}
          />
        ))}
        {postsLoading && <p className="muted pad">Loading posts…</p>}
        {postsMore && !postsLoading && (
          <button className="btn ghost wide" onClick={() => loadPosts(postsPage + 1, true)}>
            Load more posts
          </button>
        )}
      </section>
    </>
  );
}
