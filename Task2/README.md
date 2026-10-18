# StaffSphere — Employee Management System

A full-stack employee management system built with React, Express, and MySQL. The public home page leads to role-aware sign-in. Admins can add, view, edit, search, and delete employee records; employees can view only their own profile.

## Requirements

- Node.js 20 or newer
- MySQL 8 or newer

## 1. Create the database

Open **Command Prompt** in the project folder and run this command (replace the MySQL username if yours is not `root`):

```cmd
mysql -u root -p < server\database\schema.sql
```

Enter your MySQL password when prompted. This creates the `employee_management` database and its tables.

## 2. Configure the API

In Command Prompt:

```cmd
copy server\.env.example server\.env
```

Open `server\.env` and set `DB_PASSWORD` to your MySQL password. Change `ADMIN_PASSWORD` to a strong password of at least 8 characters. Replace `JWT_SECRET` with a long, random secret of at least 32 characters. Do not commit `server\.env`.

For example, generate a JWT secret in PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste the result into `JWT_SECRET` in `server\.env`.

Create (or update) the administrator account:

```cmd
npm run seed:admin
```

The admin email and password come from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server\.env`. There is no public registration endpoint.

## 3. Install and run

From the project folder in Command Prompt:

```cmd
npm install
npm run install:all
npm run dev
```

Open <http://localhost:5173>. The API is available at <http://localhost:4000/api/health>.

## MySQL commands from CMD

The schema import command above creates the database tables, including the employee login table. If you already installed an earlier version of this app, re-run the same command once after updating the code; it adds the new table without deleting employee records. To open the MySQL command-line client:

```cmd
mysql -u root -p
```

Then use these SQL queries:

```sql
USE employee_management;
SHOW TABLES;
DESCRIBE employees;
SELECT id, first_name, last_name, email, department, position, hire_date, salary FROM employees ORDER BY last_name;
```

Use the app (rather than manually editing the database) for normal employee changes so validation and duplicate-email handling are applied.

## Roles and employee sign-in

- **Admin:** Signs in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`; can manage the employee directory.
- **Employee:** An admin creates or edits the employee record and sets an employee login password in the optional **Employee login password** field. The employee signs in with that work email and password and can see only their own profile. Leave the password field blank to preserve an existing login password.
- There is no public registration. Employee permissions are enforced by the Express API, not only by the React interface.

## Security notes

- Employee directory changes and list access require an administrator. Employee sessions can access only their own profile endpoint.
- The session JWT is stored in an HttpOnly, SameSite=Strict cookie; the client does not store the token in local storage.
- Passwords are hashed with bcrypt. Login attempts are rate-limited.
- Employee inputs are validated on the API and in the form. SQL statements use bound parameters.
- Set `NODE_ENV=production`, serve the app over HTTPS, and use a strong, unique `JWT_SECRET` before deployment. Restrict database access and use a least-privilege MySQL account in production.
