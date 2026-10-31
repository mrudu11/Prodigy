import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Avatar from './Avatar.jsx';

export default function Aside() {
  const { user } = useAuth();
  const [tags, setTags] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [peopleError, setPeopleError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => { api('/posts/trending/tags').then(setTags).catch(() => {}); }, []);
  useEffect(() => {
    if (!user) {
      setSuggestions([]);
      setPeopleError('');
      return;
    }

    const loadPeople = () => {
      setPeopleError('');
      api('/users')
        .then(setSuggestions)
        .catch((error) => setPeopleError(error.message));
    };

    loadPeople();
    window.addEventListener('follow-change', loadPeople);
    return () => window.removeEventListener('follow-change', loadPeople);
  }, [user]);

  const toggleFollow = async (person) => {
    setBusyId(person.id);
    setPeopleError('');
    try {
      await api(`/users/${person.id}/follow`, { method: 'POST' });
      setSuggestions(await api('/users'));
    } catch (error) {
      setPeopleError(error.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <aside className="aside">
      <section>
        <h3>Trending tags</h3>
        {tags.length === 0 && <p className="muted">Tags appear here once people start using #hashtags.</p>}
        {tags.map((t) => (
          <Link key={t.name} to={`/tag/${t.name}`} className="tag-row">
            <span>#{t.name}</span><span className="muted">{t.uses} {t.uses === 1 ? 'post' : 'posts'}</span>
          </Link>
        ))}
      </section>
      {user && (
        <section>
          <h3>Suggested for you</h3>
          {peopleError && <p className="error">{peopleError}</p>}
          {!peopleError && suggestions.length === 0 && <p className="muted">You’re all caught up.</p>}
          {suggestions.map((p) => (
            <div key={p.id} className="person">
              <Link to={`/u/${p.username}`} className="person-link">
                <Avatar user={p} size={34} />
                <span><b>{p.display_name}</b><br /><span className="muted">@{p.username}</span></span>
              </Link>
              <button
                className="btn small"
                onClick={() => toggleFollow(p)}
                disabled={busyId !== null}
              >
                {busyId === p.id ? '…' : 'Follow'}
              </button>
            </div>
          ))}
        </section>
      )}
    </aside>
  );
}
