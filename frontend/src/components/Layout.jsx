import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const userLinks = [
    { to: '/submit', label: 'Submit' },
    { to: '/history', label: 'History' },
  ];

  const adminLinks = [
    { to: '/admin/appeals', label: 'Appeals' },
    { to: '/admin/submissions', label: 'Submissions' },
    { to: '/admin/policies', label: 'Policies' },
    { to: '/admin/analytics', label: 'Analytics' },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="navbar">
        <Link to={isAdmin ? '/admin/appeals' : '/submit'} className="navbar-brand">
          Moderation Platform
        </Link>
        <div className="navbar-links">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`nav-link${location.pathname.startsWith(l.to) ? ' active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
          <span className="nav-user">{user?.name}</span>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <div className="container">{children}</div>
    </>
  );
}
