import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, timeAgo } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';

const TEXT = { like: 'liked your post', comment: 'commented on your post', follow: 'started following you' };

export default function Notifications() {
  const { setUnread } = useAuth();
  const [items, setItems] = useState(null);

  useEffect(() => {
    api('/notifications').then(setItems);
    api('/notifications/read', { method: 'POST' }).then(() => setUnread(0));
  }, []);

  if (!items) return <p className="muted pad">Loading…</p>;
  return (
    <>
      <h1 className="page-title">Notifications</h1>
      {items.length === 0 && <p className="muted pad">Nothing yet. Likes, comments and new followers show up here.</p>}
      {items.map((n) => (
        <div key={n.id} className={n.is_read ? 'notif' : 'notif unread'}>
          <Avatar user={n} size={36} />
          <span>
            <Link to={`/u/${n.username}`} className="name">{n.display_name}</Link> {TEXT[n.type]}
            <span className="muted"> · {timeAgo(n.created_at)}</span>
          </span>
        </div>
      ))}
    </>
  );
}
