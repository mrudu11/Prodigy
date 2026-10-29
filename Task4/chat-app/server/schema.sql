CREATE DATABASE IF NOT EXISTS chat_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chat_app;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 'group' = named chat room, 'private' = one-to-one conversation
CREATE TABLE IF NOT EXISTS chattype (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NULL,
  type ENUM('group','private') NOT NULL DEFAULT 'group',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS chat_members (
  room_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (room_id, user_id),
  FOREIGN KEY (room_id) REFERENCES chattype(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NULL,
  file_url VARCHAR(255) NULL,
  file_name VARCHAR(255) NULL,
  file_type VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_room_time (room_id, id),
  FOREIGN KEY (room_id) REFERENCES chattype(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Starter public room (new users join it automatically)
INSERT INTO chattype (name, type) SELECT 'General', 'group' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM chattype WHERE name='General' AND type='group');
