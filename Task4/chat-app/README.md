# Real-Time Chat Application
Node.js + Express + Socket.IO (WebSocket) + React (Vite) + MySQL

## Features
- Register / log in (bcrypt + JWT)
- Group chat rooms (create, discover, join) and private one-to-one chats
- Instant text messaging over WebSockets
- Chat history stored in MySQL (latest 50 messages per room load on open)
- Unread badges + browser notifications
- Online/offline presence and typing indicators
- Image and file sharing (10 MB limit)

## Setup
1. Create the database:
   mysql -u root -p < server/schema.sql
2. Configure the server:
   cd server && cp .env.example .env     # then edit DB_PASSWORD and JWT_SECRET
3. Install dependencies (from the project root):
   npm run install:all
4. Run (two terminals, from the project root):
   npm run server      # http://localhost:4000
   npm run client      # http://localhost:5173

Open http://localhost:5173 in two browser windows, register two users and chat.

## Structure
server/  index.js (Express + Socket.IO), routes.js (REST API), auth.js, db.js, schema.sql
client/  src/App.jsx, Auth.jsx, Chat.jsx, api.js, styles.css
