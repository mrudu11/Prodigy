import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api, uploadFile } from './api';

const time = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function Chat({ user, token, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState({}); // roomId -> message[]
  const [unread, setUnread] = useState({});
  const [online, setOnline] = useState([]);
  const [people, setPeople] = useState([]);
  const [discover, setDiscover] = useState([]);
  const [typing, setTyping] = useState({}); // roomId -> username
  const [tab, setTab] = useState('chats');
  const [text, setText] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [error, setError] = useState('');
  const [showList, setShowList] = useState(true); // mobile: sidebar vs conversation

  const socket = useRef(null);
  const activeRef = useRef(null);
  const typingTimers = useRef({});
  const lastTyped = useRef(0);
  const bottom = useRef(null);
  const fileInput = useRef(null);

  activeRef.current = activeId;
  const active = rooms.find((r) => r.id === activeId);

  const loadRooms = () => api('/rooms').then(setRooms).catch((e) => setError(e.message));
  const loadDiscover = () => api('/rooms/discover').then(setDiscover).catch(() => {});

  /* ---- connect socket once ---- */
  useEffect(() => {
    loadRooms();
    loadDiscover();
    api('/users').then(setPeople).catch(() => {});
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();

    const s = io({ auth: { token } });
    socket.current = s;

    s.on('presence:list', setOnline);
    s.on('presence:update', ({ userId, online: on }) =>
      setOnline((p) => (on ? [...new Set([...p, userId])] : p.filter((id) => id !== userId)))
    );
    s.on('room:added', loadRooms);

    s.on('message:new', (m) => {
      setMessages((p) => (p[m.room_id] ? { ...p, [m.room_id]: [...p[m.room_id], m] } : p));
      setTyping((t) => ({ ...t, [m.room_id]: null }));
      const viewing = activeRef.current === m.room_id && !document.hidden;
      if (m.user_id !== user.id && !viewing) {
        setUnread((u) => ({ ...u, [m.room_id]: (u[m.room_id] || 0) + 1 }));
        if ('Notification' in window && Notification.permission === 'granted')
          new Notification(m.username, { body: m.content || `Sent ${m.file_name}` });
      }
    });

    s.on('typing', ({ roomId, username }) => {
      setTyping((t) => ({ ...t, [roomId]: username }));
      clearTimeout(typingTimers.current[roomId]);
      typingTimers.current[roomId] = setTimeout(() => setTyping((t) => ({ ...t, [roomId]: null })), 2000);
    });

    s.on('connect_error', () => setError('Connection lost. Retrying…'));
    s.on('connect', () => setError(''));
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeId]);

  /* ---- actions ---- */
  async function openRoom(id) {
    setActiveId(id);
    setShowList(false);
    setUnread((u) => ({ ...u, [id]: 0 }));
    if (!messages[id]) {
      try {
        const rows = await api(`/rooms/${id}/messages`);
        setMessages((p) => ({ ...p, [id]: rows }));
      } catch (e) {
        setError(e.message);
      }
    }
  }

  async function startPrivate(userId) {
    try {
      const { id } = await api('/rooms/private', { method: 'POST', body: { userId } });
      await loadRooms();
      setTab('chats');
      openRoom(id);
    } catch (e) {
      setError(e.message);
    }
  }

  async function createRoom(e) {
    e.preventDefault();
    if (!newRoom.trim()) return;
    try {
      const room = await api('/rooms', { method: 'POST', body: { name: newRoom } });
      setNewRoom('');
      await loadRooms();
      setTab('chats');
      openRoom(room.id);
    } catch (e) {
      setError(e.message);
    }
  }

  async function joinRoom(id) {
    try {
      await api(`/rooms/${id}/join`, { method: 'POST' });
      await Promise.all([loadRooms(), loadDiscover()]);
      setTab('chats');
      openRoom(id);
    } catch (e) {
      setError(e.message);
    }
  }

  function send(e, file) {
    e?.preventDefault();
    if (!activeId || (!text.trim() && !file)) return;
    socket.current.emit('message:send', { roomId: activeId, content: text, file }, (res) => {
      if (res?.error) setError(res.error);
    });
    setText('');
  }

  async function onFile(e) {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      send(null, await uploadFile(f));
    } catch (err) {
      setError(err.message);
    }
  }

  function onType(v) {
    setText(v);
    if (activeId && Date.now() - lastTyped.current > 1000) {
      lastTyped.current = Date.now();
      socket.current.emit('typing', { roomId: activeId });
    }
  }

  const isOnline = (id) => online.includes(id);
  const list = messages[activeId] || [];

  return (
    <div className={'app' + (showList ? ' show-list' : '')}>
      <aside className="sidebar">
        <header>
          <div>
            <strong>{user.username}</strong>
            <button className="link" onClick={onLogout}>Log out</button>
          </div>
        </header>

        <nav className="tabs">
          {[['chats', 'Chats'], ['people', 'People'], ['rooms', 'Chat Type']].map(([k, label]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>
          ))}
        </nav>

        <div className="scroll">
          {tab === 'chats' &&
            (rooms.length === 0 ? (
              <p className="muted pad">No chats yet. Message someone from People, or join a room.</p>
            ) : (
              rooms.map((r) => (
                <button key={r.id} className={'row' + (r.id === activeId ? ' active' : '')} onClick={() => openRoom(r.id)}>
                  <span className="avatar">
                    {r.type === 'group' ? '#' : r.name?.[0]?.toUpperCase()}
                    {r.type === 'private' && isOnline(r.peer_id) && <i className="dot" />}
                  </span>
                  <span className="grow">
                    {r.name}
                    {typing[r.id] && <small className="accent"> typing…</small>}
                  </span>
                  {unread[r.id] > 0 && <span className="badge">{unread[r.id]}</span>}
                </button>
              ))
            ))}

          {tab === 'people' &&
            (people.length === 0 ? (
              <p className="muted pad">No other users have signed up yet.</p>
            ) : (
              people.map((p) => (
                <button key={p.id} className="row" onClick={() => startPrivate(p.id)}>
                  <span className="avatar">
                    {p.username[0].toUpperCase()}
                    {isOnline(p.id) && <i className="dot" />}
                  </span>
                  <span className="grow">{p.username}</span>
                  <small className="muted">{isOnline(p.id) ? 'Online' : 'Offline'}</small>
                </button>
              ))
            ))}

          {tab === 'rooms' && (
            <>
              <form className="newroom" onSubmit={createRoom}>
                <input placeholder="New room name" value={newRoom} onChange={(e) => setNewRoom(e.target.value)} maxLength={60} />
                <button className="primary">Create</button>
              </form>
              {discover.length === 0 ? (
                <p className="muted pad">You've joined every room.</p>
              ) : (
                discover.map((r) => (
                  <button key={r.id} className="row" onClick={() => joinRoom(r.id)}>
                    <span className="avatar">#</span>
                    <span className="grow">{r.name}</span>
                    <small className="accent">Join</small>
                  </button>
                ))
              )}
            </>
          )}
        </div>
      </aside>

      <main className="conversation">
        {error && (
          <div className="toast" role="alert" onClick={() => setError('')}>{error}</div>
        )}
        {!active ? (
          <div className="center muted">Select a chat to start messaging.</div>
        ) : (
          <>
            <header className="convo-head">
              <button className="back" onClick={() => setShowList(true)} aria-label="Back to chats">‹</button>
              <div>
                <strong>{active.type === 'group' ? '# ' : ''}{active.name}</strong>
                {active.type === 'private' && (
                  <small className={isOnline(active.peer_id) ? 'accent' : 'muted'}>
                    {isOnline(active.peer_id) ? 'Online' : 'Offline'}
                  </small>
                )}
              </div>
            </header>

            <div className="messages">
              {list.length === 0 && <p className="muted center-text">No messages yet. Say hello.</p>}
              {list.map((m) => {
                const mine = m.user_id === user.id;
                return (
                  <div key={m.id} className={'msg' + (mine ? ' mine' : '')}>
                    {!mine && active.type === 'group' && <small className="author">{m.username}</small>}
                    {m.file_url &&
                      (m.file_type?.startsWith('image/') ? (
                        <a href={m.file_url} target="_blank" rel="noreferrer">
                          <img src={m.file_url} alt={m.file_name} />
                        </a>
                      ) : (
                        <a className="file" href={m.file_url} target="_blank" rel="noreferrer" download={m.file_name}>
                          📎 {m.file_name}
                        </a>
                      ))}
                    {m.content && <p>{m.content}</p>}
                    <time>{time(m.created_at)}</time>
                  </div>
                );
              })}
              <div ref={bottom} />
            </div>

            <div className="typing">{typing[activeId] ? `${typing[activeId]} is typing…` : ''}</div>

            <form className="composer" onSubmit={send}>
              <input type="file" ref={fileInput} onChange={onFile} hidden />
              <button type="button" className="icon" onClick={() => fileInput.current.click()} aria-label="Attach a file">📎</button>
              <input value={text} onChange={(e) => onType(e.target.value)} placeholder="Write a message" autoFocus />
              <button className="primary" disabled={!text.trim()}>Send</button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
