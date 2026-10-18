import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from './db.js';

const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in server/.env before seeding.');
  process.exitCode = 1;
} else if (ADMIN_PASSWORD.length < 8) {
  console.error('ADMIN_PASSWORD must be at least 8 characters long.');
  process.exitCode = 1;
} else {
  try {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await pool.execute(
      `INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash)`,
      [ADMIN_NAME.trim(), ADMIN_EMAIL.trim().toLowerCase(), passwordHash]
    );
    console.log(`Admin account ready for ${ADMIN_EMAIL}.`);
  } catch (error) {
    console.error('Could not seed the admin account:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
