import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';

const router = Router();
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  maxAge: 60 * 60 * 1000,
  path: '/'
};

function publicUser(user, role) {
  return {
    id: role === 'admin' ? user.id : user.employee_id,
    name: role === 'admin' ? user.name : `${user.first_name} ${user.last_name}`,
    email: user.email,
    role,
    ...(role === 'employee' ? { employeeId: user.employee_id } : {})
  };
}

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
    body('password').isString().notEmpty().withMessage('Password is required.'),
    validateRequest
  ],
  async (req, res, next) => {
    try {
      const [admins] = await pool.execute(
        'SELECT id, name, email, password_hash FROM admins WHERE email = ? LIMIT 1',
        [req.body.email]
      );
      let user = admins[0];
      let role = 'admin';
      if (!user) {
        const [employees] = await pool.execute(
          `SELECT e.id AS employee_id, e.first_name, e.last_name, e.email, a.password_hash
           FROM employees e
           INNER JOIN employee_accounts a ON a.employee_id = e.id
           WHERE e.email = ?
           LIMIT 1`,
          [req.body.email]
        );
        user = employees[0];
        role = 'employee';
      }
      const passwordMatches = user ? await bcrypt.compare(req.body.password, user.password_hash) : false;

      if (!passwordMatches) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const token = jwt.sign(
        {
          id: role === 'admin' ? user.id : user.employee_id,
          email: user.email,
          name: role === 'admin' ? user.name : `${user.first_name} ${user.last_name}`,
          role,
          ...(role === 'employee' ? { employeeId: user.employee_id } : {})
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      res.cookie('session_token', token, cookieOptions);
      return res.json({ user: publicUser(user, role) });
    } catch (error) {
      return next(error);
    }
  }
);

router.post('/logout', (req, res) => {
  res.clearCookie('session_token', { ...cookieOptions, maxAge: undefined });
  return res.json({ message: 'Signed out.' });
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

export default router;
