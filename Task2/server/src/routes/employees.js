import { Router } from 'express';
import { body, param, query } from 'express-validator';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';

const router = Router();
const employeeFields = [
  body('first_name').trim().isLength({ min: 1, max: 80 }).withMessage('First name is required (up to 80 characters).'),
  body('last_name').trim().isLength({ min: 1, max: 80 }).withMessage('Last name is required (up to 80 characters).'),
  body('email').trim().isEmail().isLength({ max: 254 }).withMessage('Enter a valid email address.').normalizeEmail(),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }).withMessage('Phone must be 30 characters or fewer.'),
  body('department').trim().isLength({ min: 1, max: 100 }).withMessage('Department is required (up to 100 characters).'),
  body('position').trim().isLength({ min: 1, max: 100 }).withMessage('Position is required (up to 100 characters).'),
  body('hire_date').isISO8601({ strict: true }).withMessage('Enter a valid hire date.'),
  body('salary').isFloat({ min: 0.01, max: 9999999999.99 }).withMessage('Salary must be greater than zero.')
];

const accountPasswordField = body('account_password')
  .optional({ values: 'falsy' })
  .isLength({ min: 8 }).withMessage('Employee login passwords must be at least 8 characters.')
  .bail()
  .custom((password) => Buffer.byteLength(password, 'utf8') <= 72)
  .withMessage('Employee login passwords must be 72 bytes or fewer.');
const fields = ['first_name', 'last_name', 'email', 'phone', 'department', 'position', 'hire_date', 'salary'];

router.use(requireAuth);

router.get('/me', requireRole('employee'), async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, ${fields.join(', ')}, created_at, updated_at
       FROM employees WHERE id = ?`,
      [req.user.employeeId]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Employee profile not found.' });
    return res.json({ employee: rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.get(
  '/',
  requireRole('admin'),
  [query('search').optional().trim().isLength({ max: 100 }).withMessage('Search must be 100 characters or fewer.'), validateRequest],
  async (req, res, next) => {
    try {
      const search = req.query.search || '';
      const pattern = `%${search}%`;
      const [employees] = await pool.execute(
        `SELECT id, first_name, last_name, email, phone, department, position, hire_date, salary, created_at, updated_at
         FROM employees
         WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR department LIKE ? OR position LIKE ?
         ORDER BY last_name, first_name
         LIMIT 500`,
        [pattern, pattern, pattern, pattern, pattern]
      );
      const [[summary]] = await pool.execute(
        `SELECT COUNT(*) AS total,
                COUNT(DISTINCT department) AS departments,
                COALESCE(SUM(
                  hire_date >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
                  AND hire_date < DATE_ADD(LAST_DAY(CURRENT_DATE), INTERVAL 1 DAY)
                ), 0) AS addedThisMonth
         FROM employees`
      );
      return res.json({ employees, stats: summary });
    } catch (error) {
      return next(error);
    }
  }
);

router.post('/', requireRole('admin'), [...employeeFields, accountPasswordField, validateRequest], async (req, res, next) => {
  let connection;
  let transactionStarted = false;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;
    const values = fields.map((field) => (req.body[field] === '' ? null : req.body[field]));
    const [result] = await connection.execute(
      `INSERT INTO employees (${fields.join(', ')}) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      values
    );
    if (req.body.account_password) {
      const passwordHash = await bcrypt.hash(req.body.account_password, 12);
      await connection.execute(
        'INSERT INTO employee_accounts (employee_id, password_hash) VALUES (?, ?)',
        [result.insertId, passwordHash]
      );
    }
    const [rows] = await connection.execute(
      `SELECT ${fields.join(', ')}, id, created_at, updated_at FROM employees WHERE id = ?`,
      [result.insertId]
    );
    await connection.commit();
    transactionStarted = false;
    return res.status(201).json({ employee: rows[0] });
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'An employee with that email already exists.' });
    }
    return next(error);
  } finally {
    connection?.release();
  }
});

router.get('/:id', requireRole('admin'), [param('id').isInt({ min: 1 }).withMessage('Employee ID must be a positive integer.'), validateRequest], async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, ${fields.join(', ')}, created_at, updated_at FROM employees WHERE id = ?`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Employee not found.' });
    return res.json({ employee: rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', requireRole('admin'), [param('id').isInt({ min: 1 }).withMessage('Employee ID must be a positive integer.'), ...employeeFields, accountPasswordField, validateRequest], async (req, res, next) => {
  let connection;
  let transactionStarted = false;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;
    const [existing] = await connection.execute('SELECT id FROM employees WHERE id = ?', [req.params.id]);
    if (!existing[0]) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(404).json({ message: 'Employee not found.' });
    }
    const assignments = fields.map((field) => `${field} = ?`).join(', ');
    const values = fields.map((field) => (req.body[field] === '' ? null : req.body[field]));
    await connection.execute(
      `UPDATE employees SET ${assignments} WHERE id = ?`,
      [...values, req.params.id]
    );
    if (req.body.account_password) {
      const passwordHash = await bcrypt.hash(req.body.account_password, 12);
      await connection.execute(
        `INSERT INTO employee_accounts (employee_id, password_hash) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
        [req.params.id, passwordHash]
      );
    }
    const [rows] = await connection.execute(
      `SELECT id, ${fields.join(', ')}, created_at, updated_at FROM employees WHERE id = ?`,
      [req.params.id]
    );
    await connection.commit();
    transactionStarted = false;
    return res.json({ employee: rows[0] });
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'An employee with that email already exists.' });
    }
    return next(error);
  } finally {
    connection?.release();
  }
});

router.delete('/:id', requireRole('admin'), [param('id').isInt({ min: 1 }).withMessage('Employee ID must be a positive integer.'), validateRequest], async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM employees WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Employee not found.' });
    return res.json({ message: 'Employee deleted.' });
  } catch (error) {
    return next(error);
  }
});

export default router;
