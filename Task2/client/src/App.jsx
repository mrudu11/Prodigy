import { useEffect, useState } from 'react';
import {
  BriefcaseBusiness, CalendarDays, ChevronDown, LayoutDashboard,
  LogOut, Mail, Menu, Phone, Search, ShieldCheck, Users, X, Plus, Pencil, Trash2,
  ArrowUpRight, Banknote, Building2, LockKeyhole
} from 'lucide-react';
import { api } from './api.js';

const emptyEmployee = {
  first_name: '', last_name: '', email: '', phone: '', department: '',
  position: '', hire_date: '', salary: ''
};

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'A';
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function todayLabel() {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date()).toUpperCase();
}

function timeGreeting(date) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 16) return 'Good afternoon';
  return 'Good evening';
}

function currency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function Home({ onSignIn }) {
  return (
    <main className="home-page">
      <header className="home-nav">
        <a className="brand" href="#"><span className="brand-mark"><Users size={19} /></span><span>Staff<span className="brand-light">Sphere</span></span></a>
        <button className="button secondary" onClick={onSignIn}>Sign in <ArrowUpRight size={15} /></button>
      </header>
      <section className="home-hero">
        <div className="home-copy">
          <span className="side-pill"><span className="live-dot" /> PEOPLE OPERATIONS, MADE SIMPLE</span>
          <h1>Make work better,<br />starting with <em>StaffSphere.</em></h1>
          <p>One thoughtful place to manage your employee directory, keep records organized, and help every team member feel at home.</p>
          <div className="home-actions"><button className="button primary" onClick={onSignIn}>Get started <ArrowUpRight size={16} /></button><span><ShieldCheck size={15} /> Private, role-based access</span></div>
          <div className="home-proof"><div className="proof-avatars"><span>JD</span><span>AK</span><span>ML</span><span>+</span></div><span>For the people behind your work</span></div>
        </div>
        <div className="home-visual">
          <div className="home-orbit orbit-one" /><div className="home-orbit orbit-two" />
          <div className="preview-card"><div className="preview-head"><span className="preview-logo"><Users size={15} /></span><span><strong>People directory</strong><small>Your team, together</small></span><span className="preview-menu">•••</span></div><div className="preview-stat"><span>TEAM MEMBERS</span><strong>24</strong><small><span className="live-dot" /> Your workspace is up to date</small></div><div className="preview-list"><div><span className="preview-avatar p-purple">JD</span><span><strong>Jordan Davis</strong><small>Product · Designer</small></span><span className="preview-status">Active</span></div><div><span className="preview-avatar p-green">AK</span><span><strong>Alex Kim</strong><small>Engineering · Developer</small></span><span className="preview-status">Active</span></div><div><span className="preview-avatar p-orange">ML</span><span><strong>Morgan Lee</strong><small>People · HR Partner</small></span><span className="preview-status">Active</span></div></div><div className="preview-foot"><ShieldCheck size={14} /> Employee data stays protected</div></div>
          <div className="floating-note"><span className="note-icon"><LockKeyhole size={16} /></span><span><strong>Access that fits</strong><small>Admin & employee roles</small></span></div>
        </div>
      </section>
      <section className="home-features"><div><span className="feature-icon"><Users size={17} /></span><strong>Know your team</strong><small>Keep employee information organized and easy to find.</small></div><div><span className="feature-icon green"><ShieldCheck size={17} /></span><strong>Private by design</strong><small>Each person sees only what their role allows.</small></div><div><span className="feature-icon orange"><BriefcaseBusiness size={17} /></span><strong>Less admin, more people</strong><small>Simple tools for the everyday work of supporting your team.</small></div></section>
      <footer className="home-footer"><span>© {new Date().getFullYear()} StaffSphere</span><span>People first, always.</span></footer>
    </main>
  );
}

function Login({ onLogin, onBack, initialError = '' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      onLogin(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <button className="back-home" onClick={onBack}>← Back to home</button>
        <div className="brand-mark"><Users size={22} /></div>
        <p className="eyebrow">STAFFSPHERE</p>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to your StaffSphere account.</p>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={submit} className="login-form">
          <label>Email address<input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></label>
          <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" /></label>
          <button className="button primary full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}<ArrowUpRight size={16} /></button>
        </form>
        <div className="login-security"><ShieldCheck size={16} /> Your role determines your access</div>
      </div>
      <div className="login-side"><div className="login-side-content"><span className="side-pill"><span className="live-dot" /> PEOPLE OPERATIONS</span><h2>Great teams<br />start with <em>people.</em></h2><p>A clear, thoughtful space to keep your team organized and moving forward.</p><div className="side-note"><span className="note-icon"><Users size={18} /></span><span><strong>Your people, at a glance</strong><small>One home for your employee directory</small></span></div></div><span className="side-footer">STAFFSPHERE · EMPLOYEE MANAGEMENT</span></div>
    </main>
  );
}

function EmployeeModal({ employee, onClose, onSave }) {
  const [form, setForm] = useState(employee || emptyEmployee);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const editing = Boolean(employee?.id);

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSave({ ...form, salary: Number(form.salary) });
      onClose();
    } catch (err) {
      setError(err.fields?.map((item) => item.message).join(' ') || err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="employee-title">
        <header className="modal-header"><div><p className="eyebrow">{editing ? 'EMPLOYEE RECORD' : 'TEAM DIRECTORY'}</p><h2 id="employee-title">{editing ? 'Edit employee' : 'Add employee'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></header>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={submit} className="employee-form">
          <div className="form-grid">
            <label>First name<input required maxLength="80" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} /></label>
            <label>Last name<input required maxLength="80" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} /></label>
            <label className="span-two">Work email<input required type="email" maxLength="254" value={form.email} onChange={(e) => update('email', e.target.value)} /></label>
            <label>Phone <span className="optional">Optional</span><input type="tel" maxLength="30" value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} /></label>
            <label>Department<input required maxLength="100" value={form.department} onChange={(e) => update('department', e.target.value)} placeholder="e.g. Engineering" /></label>
            <label>Job title<input required maxLength="100" value={form.position} onChange={(e) => update('position', e.target.value)} /></label>
            <label>Start date<input required type="date" value={String(form.hire_date || '').slice(0, 10)} onChange={(e) => update('hire_date', e.target.value)} /></label>
            <label className="span-two">Annual salary <span className="optional">INR (₹)</span><input required type="number" min="0.01" max="9999999999.99" step="0.01" value={form.salary} onChange={(e) => update('salary', e.target.value)} /></label>
            <label className="span-two">Employee login password <span className="optional">Optional · leave blank to keep unchanged</span><input type="password" autoComplete="new-password" minLength="8" maxLength="72" value={form.account_password || ''} onChange={(e) => update('account_password', e.target.value)} placeholder="At least 8 characters to enable employee sign-in" /><span className="field-help">Employees sign in with their work email and this password. Share it with them securely.</span></label>
          </div>
          <footer className="modal-footer"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add employee'}</button></footer>
        </form>
      </section>
    </div>
  );
}

function EmployeeHome({ user, onSignOut }) {
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/employees/me')
      .then((result) => setEmployee(result.employee))
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <main className="employee-home">
      <header className="home-nav"><a className="brand" href="#"><span className="brand-mark"><Users size={19} /></span><span>Staff<span className="brand-light">Sphere</span></span></a><div className="employee-nav-user"><span>{user.name}</span><button className="button secondary" onClick={onSignOut}><LogOut size={14} /> Sign out</button></div></header>
      <section className="employee-welcome"><span className="side-pill"><span className="live-dot" /> EMPLOYEE PORTAL</span><h1>Your work, your <em>space.</em></h1><p>Here’s your employee profile. Your account has access only to your own information.</p></section>
      {error && <div className="alert employee-alert">{error}</div>}
      {!employee && !error && <div className="profile-loading"><div className="spinner" /> Loading your profile…</div>}
      {employee && <section className="profile-card"><div className="profile-heading"><span className="profile-avatar">{initials(user.name)}</span><div><h2>{user.name}</h2><p>{employee.position} · {employee.department}</p></div><span className="profile-role"><ShieldCheck size={14} /> Employee</span></div><div className="profile-grid"><div><span><Mail size={15} /> WORK EMAIL</span><strong>{employee.email}</strong></div><div><span><Phone size={15} /> PHONE</span><strong>{employee.phone || 'Not provided'}</strong></div><div><span><Building2 size={15} /> DEPARTMENT</span><strong>{employee.department}</strong></div><div><span><BriefcaseBusiness size={15} /> JOB TITLE</span><strong>{employee.position}</strong></div><div><span><CalendarDays size={15} /> START DATE</span><strong>{formatDate(employee.hire_date)}</strong></div><div><span><Banknote size={15} /> ANNUAL SALARY</span><strong>{currency(employee.salary)}</strong></div></div><p className="profile-note"><LockKeyhole size={14} /> This profile is read-only. Contact your administrator if any details need updating.</p></section>}
      <footer className="home-footer"><span>© {new Date().getFullYear()} StaffSphere</span><span><ShieldCheck size={14} /> Your data is private and secure</span></footer>
    </main>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [showLogin, setShowLogin] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({ total: 0, departments: 0, addedThisMonth: 0 });
  const [activePage, setActivePage] = useState('overview');
  const [search, setSearch] = useState('');
  const [modalEmployee, setModalEmployee] = useState(undefined);
  const [pageError, setPageError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  async function loadEmployees(term = search) {
    setLoading(true);
    setPageError('');
    try {
      const result = await api(`/employees?search=${encodeURIComponent(term)}`);
      setEmployees(result.employees);
      setStats(result.stats);
    } catch (error) {
      if (error.status === 401) setUser(null);
      else setPageError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api('/auth/me')
      .then((result) => setUser(result.user))
      .catch((error) => {
        if (error.status !== 401) setAuthError(`Unable to verify your session: ${error.message}`);
        setUser(null);
      })
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'admin') return undefined;
    const timer = window.setTimeout(() => loadEmployees(search), search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [user, search]);

  async function saveEmployee(employee) {
    const editing = Boolean(employee.id);
    await api(editing ? `/employees/${employee.id}` : '/employees', {
      method: editing ? 'PUT' : 'POST',
      body: JSON.stringify(employee)
    });
    await loadEmployees();
  }

  async function deleteEmployee(employee) {
    if (!window.confirm(`Delete ${employee.first_name} ${employee.last_name}? This cannot be undone.`)) return;
    setPageError('');
    try {
      await api(`/employees/${employee.id}`, { method: 'DELETE' });
      await loadEmployees();
    } catch (error) {
      setPageError(error.message);
    }
  }

  async function signOut() {
    try {
      await api('/auth/logout', { method: 'POST' });
      setUser(null);
      setShowLogin(false);
      setEmployees([]);
      setStats({ total: 0, departments: 0, addedThisMonth: 0 });
    } catch (error) {
      setPageError(error.message);
    }
  }

  if (!authChecked) return <div className="loading-screen"><div className="spinner" /><span>Loading StaffSphere</span></div>;
  if (!user) {
    return showLogin
      ? <Login onLogin={setUser} onBack={() => setShowLogin(false)} initialError={authError} />
      : <Home onSignIn={() => setShowLogin(true)} />;
  }
  if (user.role === 'employee') return <EmployeeHome user={user} onSignOut={signOut} />;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#"><span className="brand-mark"><Users size={19} /></span><span>Staff<span className="brand-light">Sphere</span></span><button className="mobile-close icon-button" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={18} /></button></a>
        <div className="workspace"><div className="workspace-avatar">N</div><span><strong>Northstar Studio</strong><small>Workspace</small></span><ChevronDown size={15} /></div>
        <p className="nav-label">WORKSPACE</p>
        <nav><button className={`nav-item ${activePage === 'overview' ? 'active' : ''}`} onClick={() => { setActivePage('overview'); setMobileMenu(false); }}><LayoutDashboard size={17} />Overview</button><button className={`nav-item ${activePage === 'employees' ? 'active' : ''}`} onClick={() => { setActivePage('employees'); setMobileMenu(false); }}><Users size={17} />Employees<span className="nav-count">{stats.total}</span></button><button className="nav-item" disabled><CalendarDays size={17} />Time off<span className="coming-soon">SOON</span></button></nav>
        <div className="sidebar-bottom"><div className="sidebar-user"><div className="user-avatar">{initials(user.name)}</div><span className="user-details"><strong>{user.name}</strong><small>Administrator</small></span><button onClick={signOut} className="icon-button signout" title="Sign out" aria-label="Sign out"><LogOut size={17} /></button></div></div>
      </aside>
      {mobileMenu && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)} />}
      <main className="main-area">
        <header className="topbar"><button className="icon-button mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu size={20} /></button><div className="breadcrumb">Workspace <span>/</span> <strong>{activePage === 'overview' ? 'Overview' : 'Employees'}</strong></div><div className="topbar-right"><span className="secure-label"><ShieldCheck size={15} /> Secure workspace</span><div className="topbar-avatar">{initials(user.name)}</div></div></header>
        <div className="content">
          <div className="page-heading"><div>{activePage === 'overview' ? <><div className="eyebrow heading-date">{todayLabel()}</div><h1>{timeGreeting(currentTime)}, {user.name.split(' ')[0]} <span className="wave">✳</span></h1><p>Here’s what’s happening with your team.</p></> : <><div className="eyebrow heading-date">WORKSPACE DIRECTORY</div><h1>Employees</h1><p>View and manage your team members.</p></>}</div><button className="button primary add-button" onClick={() => setModalEmployee({ ...emptyEmployee })}><Plus size={17} />Add employee</button></div>
          {activePage === 'overview' && <section className="stats-grid">
            <article className="stat-card"><div className="stat-top"><span>Total employees</span><span className="stat-icon lavender"><Users size={17} /></span></div><div className="stat-number">{stats.total}<span className="stat-unit"> people</span></div><div className="stat-bottom"><span className="trend"><ArrowUpRight size={13} /> Active directory</span><span>Across your company</span></div></article>
            <article className="stat-card"><div className="stat-top"><span>Departments</span><span className="stat-icon mint"><Building2 size={17} /></span></div><div className="stat-number">{stats.departments}</div><div className="stat-bottom"><span className="neutral-trend">Team structure</span><span>Distinct departments</span></div></article>
            <article className="stat-card"><div className="stat-top"><span>New this month</span><span className="stat-icon peach"><CalendarDays size={17} /></span></div><div className="stat-number">{stats.addedThisMonth}<span className="stat-unit"> people</span></div><div className="stat-bottom"><span className="neutral-trend">Based on start date</span><span>Welcome aboard</span></div></article>
          </section>}
          {activePage === 'employees' && <section className="directory-section" id="employee-directory">
            <div className="section-heading"><div><div className="title-with-icon"><span className="section-icon"><Users size={17} /></span><h2>People directory</h2><span className="directory-count">{employees.length}</span></div><p>Your team, all in one place.</p></div><div className="directory-actions"><label className="search-box"><Search size={16} /><input aria-label="Search employees" placeholder="Search people..." value={search} onChange={(e) => setSearch(e.target.value)} /><kbd>⌘ K</kbd></label></div></div>
            {pageError && <div className="alert page-alert">{pageError}</div>}
            <div className="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>JOB TITLE</th><th>START DATE</th><th>SALARY</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
              {loading ? <tr><td className="table-state" colSpan="6">Loading employees…</td></tr> : employees.length === 0 ? <tr><td className="table-state" colSpan="6">{search ? 'No employees match your search.' : 'No employees yet. Add your first team member.'}</td></tr> : employees.map((employee, index) => <tr key={employee.id}><td><div className="employee-person"><span className={`employee-avatar avatar-${index % 5}`}>{initials(`${employee.first_name} ${employee.last_name}`)}</span><span className="person-meta"><strong>{employee.first_name} {employee.last_name}</strong><small>{employee.email}</small></span></div></td><td><span className="department-pill"><span className="department-dot" />{employee.department}</span></td><td><span className="job-title"><BriefcaseBusiness size={14} />{employee.position}</span></td><td className="date-cell">{formatDate(employee.hire_date)}</td><td className="salary-cell">{currency(employee.salary)}</td><td><div className="row-actions"><button className="icon-button" aria-label={`Edit ${employee.first_name}`} onClick={() => setModalEmployee(employee)}><Pencil size={15} /></button><button className="icon-button delete-action" aria-label={`Delete ${employee.first_name}`} onClick={() => deleteEmployee(employee)}><Trash2 size={15} /></button></div></td></tr>)}
            </tbody></table></div>
            <div className="table-footer"><span>Showing <strong>{employees.length}</strong> {employees.length === 1 ? 'person' : 'people'}</span><span className="updated-note"><span className="live-dot" /> Directory up to date</span></div>
          </section>}
          <footer className="page-footer"><span>© {new Date().getFullYear()} StaffSphere · People first, always.</span><span><ShieldCheck size={14} />Your data is private and secure</span></footer>
        </div>
      </main>
      {modalEmployee !== undefined && <EmployeeModal employee={modalEmployee} onClose={() => setModalEmployee(undefined)} onSave={saveEmployee} />}
    </div>
  );
}

export default App;
