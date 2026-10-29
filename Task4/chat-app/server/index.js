require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const db = require('./db');
const { verify } = require('./auth');
const routes = require('./routes');

const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin } });
app.set('io', io);

app.use(cors({ origin }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', routes);

/* ---------- WebSocket (Socket.IO) ---------- */
io.use((socket, next) => {
  try {
    socket.user = verify(socket.handshake.auth.token);
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

const onlineCount = new Map(); // userId -> number of open tabs

io.on('connection', async (socket) => {
  const { id: userId, username } = socket.user;

  socket.join('user:' + userId);
  const [rooms] = await db.query('SELECT room_id FROM chat_members WHERE user_id=?', [userId]);
  rooms.forEach((r) => socket.join('room:' + r.room_id));

  onlineCount.set(userId, (onlineCount.get(userId) || 0) + 1);
  socket.emit('presence:list', [...onlineCount.keys()]);
  if (onlineCount.get(userId) === 1) io.emit('presence:update', { userId, online: true });

  socket.on('message:send', async ({ roomId, content, file }, ack) => {
    try {
      const text = (content || '').trim();
      if (!text && !file) return;
      const [m] = await db.query('SELECT 1 FROM chat_members WHERE room_id=? AND user_id=?', [roomId, userId]);
      if (!m.length) return ack?.({ error: 'Not a member' });

      const [r] = await db.query(
        'INSERT INTO messages (room_id, user_id, content, file_url, file_name, file_type) VALUES (?,?,?,?,?,?)',
        [roomId, userId, text || null, file?.url || null, file?.name || null, file?.type || null]
      );
      const [rows] = await db.query(
        'SELECT m.*, u.username FROM messages m JOIN users u ON u.id=m.user_id WHERE m.id=?',
        [r.insertId]
      );
      io.to('room:' + roomId).emit('message:new', rows[0]);
      ack?.({ ok: true });
    } catch (e) {
      console.error(e);
      ack?.({ error: 'Message failed' });
    }
  });

  socket.on('typing', ({ roomId }) => {
    socket.to('room:' + roomId).emit('typing', { roomId, username });
  });

  socket.on('disconnect', () => {
    const n = (onlineCount.get(userId) || 1) - 1;
    if (n <= 0) {
      onlineCount.delete(userId);
      io.emit('presence:update', { userId, online: false });
    } else onlineCount.set(userId, n);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
