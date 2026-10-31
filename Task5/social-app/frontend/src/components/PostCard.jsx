import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, mediaUrl, timeAgo } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Avatar from './Avatar.jsx';

// Turns #tags inside text into links
function Text({ text }) {
  return (
    <p className="post-text">
      {(text || '').split(/(#\w+)/g).map((part, i) =>
        /^#\w+$/.test(part)
          ? <Link key={i} to={`/tag/${part.slice(1).toLowerCase()}`} className="hashtag">{part}</Link>
          : part
      )}
    </p>
  );
}

export default function PostCard({ post, onDelete }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likes, setLikes] = useState(post.like_count);
  const [count, setCount] = useState(post.comment_count);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');

  const like = async () => {
    if (!user) return navigate('/login');
    const r = await api(`/posts/${post.id}/like`, { method: 'POST' });
    setLiked(r.liked); setLikes(r.like_count);
  };

  const toggleComments = async () => {
    if (!open) setComments(await api(`/posts/${post.id}/comments`));
    setOpen(!open);
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const c = await api(`/posts/${post.id}/comments`, { method: 'POST', body: { content: text } });
    setComments([...comments, c]); setCount(count + 1); setText('');
  };

  const remove = async () => {
    if (!confirm('Delete this post?')) return;
    await api(`/posts/${post.id}`, { method: 'DELETE' });
    onDelete(post.id);
  };

  return (
    <article className="post">
      <Link to={`/u/${post.username}`}><Avatar user={post} /></Link>
      <div className="post-body">
        <header>
          <Link to={`/u/${post.username}`} className="name">{post.display_name}</Link>
          <span className="muted"> @{post.username} · {timeAgo(post.created_at)}</span>
          {user?.id === post.user_id && <button className="link-btn" onClick={remove}>Delete</button>}
        </header>

        {post.content && <Text text={post.content} />}
        {post.media_type === 'image' && <img className="media" src={mediaUrl(post.media_url)} alt="" />}
        {post.media_type === 'video' && <video className="media" src={mediaUrl(post.media_url)} controls />}

        {post.tags.length > 0 && (
          <div className="chips">
            {post.tags.map((t) => <Link key={t} to={`/tag/${t}`} className="chip">#{t}</Link>)}
          </div>
        )}

        <div className="actions">
          <button
            className={liked ? 'act on' : 'act'}
            onClick={like}
            aria-pressed={liked}
            aria-label={`${liked ? 'Unlike' : 'Like'} post (${likes} ${likes === 1 ? 'like' : 'likes'})`}
          >
            <span className="act-icon" aria-hidden="true">{liked ? '♥' : '♡'}</span>
            <span>{likes} {likes === 1 ? 'like' : 'likes'}</span>
          </button>
          <button className="act" onClick={toggleComments}>
            <span className="act-icon" aria-hidden="true">▢</span>
            <span>{count} {count === 1 ? 'comment' : 'comments'}</span>
          </button>
        </div>

        {open && (
          <div className="comments">
            {comments.length === 0 && <p className="muted">No comments yet.</p>}
            {comments.map((c) => (
              <div key={c.id} className="comment">
                <Avatar user={c} size={28} />
                <div>
                  <Link to={`/u/${c.username}`} className="name">{c.display_name}</Link>{' '}
                  <span className="muted">{timeAgo(c.created_at)}</span>
                  <p>{c.content}</p>
                </div>
              </div>
            ))}
            {user ? (
              <form className="comment-form" onSubmit={addComment}>
                <input value={text} maxLength={500} placeholder="Write a comment" onChange={(e) => setText(e.target.value)} />
                <button className="btn small">Comment</button>
              </form>
            ) : <p className="muted"><Link to="/login">Log in</Link> to comment.</p>}
          </div>
        )}
      </div>
    </article>
  );
}
