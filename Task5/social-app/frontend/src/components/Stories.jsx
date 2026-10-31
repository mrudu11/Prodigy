import { useEffect, useMemo, useRef, useState } from 'react';
import { api, mediaUrl, timeAgo } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Avatar from './Avatar.jsx';

export default function Stories() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeUserId, setActiveUserId] = useState(null);
  const [activeStory, setActiveStory] = useState(0);
  const inputRef = useRef(null);

  const groups = useMemo(() => {
    const byUser = new Map();
    for (const story of stories) {
      if (!byUser.has(story.user_id)) {
        byUser.set(story.user_id, { userId: story.user_id, user: story, stories: [] });
      }
      byUser.get(story.user_id).stories.push(story);
    }
    return [...byUser.values()].sort((a, b) => {
      if (a.userId === user?.id) return -1;
      if (b.userId === user?.id) return 1;
      return new Date(b.stories.at(-1).created_at) - new Date(a.stories.at(-1).created_at);
    });
  }, [stories, user]);

  useEffect(() => {
    const refresh = () => {
      api('/stories')
        .then((result) => { setStories(result); setError(''); })
        .catch((e) => setError(e.message));
    };
    refresh();
    const timer = window.setInterval(refresh, 60000);
    return () => window.clearInterval(timer);
  }, [user]);

  const addStory = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('media', file);
      const story = await api('/stories', { method: 'POST', form });
      setStories((current) => [...current.filter((item) => item.id !== story.id), story]);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const activeGroupIndex = groups.findIndex((group) => group.user.id === activeUserId);
  const currentGroup = groups[activeGroupIndex];
  const currentStory = currentGroup?.stories[activeStory];
  const ownStories = groups.find((group) => group.user.id === user?.id);

  const moveStory = (direction) => {
    if (!currentGroup) return;
    const nextStory = activeStory + direction;
    if (nextStory >= 0 && nextStory < currentGroup.stories.length) {
      setActiveStory(nextStory);
      return;
    }
    const nextGroup = groups[activeGroupIndex + direction];
    if (!nextGroup) {
      setActiveUserId(null);
      return;
    }
    setActiveUserId(nextGroup.user.id);
    setActiveStory(direction > 0 ? 0 : nextGroup.stories.length - 1);
  };

  useEffect(() => {
    if (!currentStory || currentStory.media_type === 'video') return undefined;
    const timer = window.setTimeout(() => moveStory(1), 5000);
    return () => window.clearTimeout(timer);
  }, [activeUserId, activeStory, currentStory, groups]);

  return (
    <>
      <section className="stories-section" aria-label="Stories">
        <div className="stories-row">
          {user && (
            <div className="story-person">
              <button
                type="button"
                className="story-avatar-button"
                onClick={() => {
                  if (ownStories) {
                    setActiveUserId(user.id);
                    setActiveStory(0);
                  } else {
                    inputRef.current?.click();
                  }
                }}
                disabled={uploading}
                aria-label={ownStories ? 'View your story' : 'Add a story'}
              >
                <span className={`story-ring ${ownStories ? '' : 'story-ring-add'}`}><Avatar user={user} size={58} /></span>
              </button>
              <button
                type="button"
                className="story-add-badge"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                aria-label="Upload a story"
              >+</button>
              <span className="story-name">{uploading ? 'Uploading…' : 'Your story'}</span>
              <input
                ref={inputRef}
                className="story-file-input"
                type="file"
                accept="image/*,video/*"
                onChange={addStory}
              />
            </div>
          )}
          {groups.filter((group) => !user || group.userId !== user.id).map((group) => (
            <button
              key={group.user.id}
              type="button"
              className="story-person story-person-button"
              onClick={() => { setActiveUserId(group.user.id); setActiveStory(0); }}
            >
              <span className="story-ring"><Avatar user={group.user} size={58} /></span>
              <span className="story-name">{group.user.username}</span>
            </button>
          ))}
        </div>
        {error && <p className="error stories-error">{error}</p>}
      </section>

      {currentStory && (
        <div className="story-viewer-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setActiveUserId(null);
        }}>
          <section className="story-viewer" role="dialog" aria-modal="true" aria-label={`${currentGroup.user.display_name}'s story`}>
            <div className="story-progress-row">
              {currentGroup.stories.map((story, index) => (
                <span key={story.id} className="story-progress-track">
                  <span className={index <= activeStory ? 'story-progress-fill active' : 'story-progress-fill'} />
                </span>
              ))}
            </div>
            <header className="story-viewer-header">
              <Avatar user={currentGroup.user} size={36} />
              <div>
                <b>{currentGroup.user.display_name}</b>
                <span className="story-time">{timeAgo(currentStory.created_at)}</span>
              </div>
              <button className="people-close story-viewer-close" onClick={() => setActiveUserId(null)} aria-label="Close story">×</button>
            </header>
            <div className="story-media-wrap">
              {currentStory.media_type === 'video'
                ? <video key={currentStory.id} className="story-media" src={mediaUrl(currentStory.media_url)} autoPlay controls playsInline onEnded={() => moveStory(1)} />
                : <img className="story-media" src={mediaUrl(currentStory.media_url)} alt={`${currentGroup.user.display_name}'s story`} />}
            </div>
            <button className="story-nav story-nav-prev" onClick={() => moveStory(-1)} aria-label="Previous story">‹</button>
            <button className="story-nav story-nav-next" onClick={() => moveStory(1)} aria-label="Next story">›</button>
          </section>
        </div>
      )}
    </>
  );
}
