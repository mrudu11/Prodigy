import { useRef, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Avatar from './Avatar.jsx';

export default function Composer({ onPosted }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef();

  const preview = file ? URL.createObjectURL(file) : null;

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const form = new FormData();
      form.append('content', content);
      if (file) form.append('media', file);
      const post = await api('/posts', { method: 'POST', form });
      onPosted(post);
      setContent(''); setFile(null);
      if (input.current) input.current.value = '';
    } catch (err) { setError(err.message); }
    setBusy(false);
  };

  return (
    <form className="composer" onSubmit={submit}>
      <Avatar user={user} />
      <div className="composer-body">
        <textarea
          value={content} maxLength={1000} rows={3}
          placeholder="Share something. Add #tags to help people find it."
          onChange={(e) => setContent(e.target.value)}
        />
        {preview && (
          <div className="preview">
            {file.type.startsWith('video')
              ? <video src={preview} controls />
              : <img src={preview} alt="Selected upload" />}
            <button type="button" className="btn small ghost" onClick={() => { setFile(null); input.current.value = ''; }}>
              Remove
            </button>
          </div>
        )}
        {error && <p className="error">{error}</p>}
        <div className="composer-actions">
          <label className="btn ghost small">
            Add photo or video
            <input ref={input} type="file" accept="image/*,video/*" hidden
              onChange={(e) => setFile(e.target.files[0] || null)} />
          </label>
          <button className="btn" disabled={busy || (!content.trim() && !file)}>
            {busy ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </form>
  );
}
