import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearToken } from '../lib/auth';
import { useAuth } from '../lib/useAuth';

type NavItem = {
  id: string;
  label: string;
  description: string;
  to: string;
};

export default function SidebarLayout() {
  const navigate = useNavigate();
  const { data: user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const navItems: NavItem[] = [
    { id: 'monitors', label: 'Monitors', description: 'List & manage monitors', to: '/' },
    { id: 'reports', label: 'Reports', description: 'Uptime overview', to: '/reports' },
    { id: 'history', label: 'History', description: 'Checks & incidents', to: '/history' },
    { id: 'channels', label: 'Channels', description: 'Telegram settings', to: '/channels' },
    { id: 'maintenance', label: 'Maintenance', description: 'Schedule downtime', to: '/maintenance' },
    ...(isAdmin
      ? [{ id: 'users', label: 'Users', description: 'Admin user management', to: '/users' }]
      : []),
  ];

  const handleLogout = () => {
    clearToken();
    navigate('/login', { replace: true });
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">MC</div>
          <div>
            <div className="brand-title">MonitorCraft</div>
            <div className="brand-sub">Uptime Control Center</div>
          </div>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              className={({ isActive }) =>
                `nav-item${isActive ? ' nav-item-active' : ''}`
              }
              to={item.to}
              end={item.to === '/'}
            >
              <span className="nav-label">{item.label}</span>
              <span className="nav-desc">{item.description}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="mono">Status: Beta</div>
          <div className="mono">Region: APAC</div>
          <button className="button secondary" onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
