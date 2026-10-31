# Loop: Social Media Platform (Node.js, Express, React, MySQL)

Features: sign up / log in (JWT), profiles with avatar + bio, create posts with image/video uploads,
#hashtag tagging, likes, comments, follow/unfollow, notifications (likes, comments, follows),
stories with image/video uploads (expire after 24 hours), trending posts and trending tags,
following feed, tag pages.

## 1. Database
Open MySQL and run:
    mysql -u root -p < backend/schema.sql

For an existing database, run the new stories table migration once:
    mysql -u root -p social_app -e "CREATE TABLE stories (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, media_url VARCHAR(255) NOT NULL, media_type ENUM('image','video') NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, expires_at TIMESTAMP NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX (expires_at), INDEX (user_id, created_at));"

## 2. Backend
    cd backend
    cp .env.example .env      # then fill in DB_PASSWORD and a JWT_SECRET
    npm install
    npm run dev               # http://localhost:5000

## 3. Frontend
    cd frontend
    cp .env.example .env
    npm install
    npm run dev               # http://localhost:5173

Uploaded files are saved in backend/uploads and served at /uploads/....

## API summary
POST /api/auth/register | /login      GET /api/auth/me
GET  /api/users/:username             PUT /api/users/me/profile (multipart: display_name, bio, avatar)
POST /api/users/:id/follow            GET /api/users  (suggestions)
GET  /api/posts?feed=following|sort=trending|tag=x|user=name&page=1
POST /api/posts (multipart: content, media, tags)     DELETE /api/posts/:id
GET  /api/stories                              POST /api/stories (multipart: media)
POST /api/posts/:id/like              GET/POST /api/posts/:id/comments
GET  /api/posts/trending/tags
GET  /api/notifications | /unread-count     POST /api/notifications/read
