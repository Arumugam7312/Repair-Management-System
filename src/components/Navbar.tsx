import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ShieldAlert, LogOut, LayoutDashboard, UserCheck, Wrench } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Book Repair', path: '/book' },
    { name: 'Track Status', path: '/track' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-xs" id="main-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-blue-600 font-sans font-bold text-xl tracking-tight" id="nav-logo">
              <Wrench className="h-6 w-6 text-blue-600" />
              <span className="text-gray-900 font-extrabold">RepairHub</span>
              <span className="bg-blue-600 text-white text-[10px] uppercase px-1.5 py-0.5 rounded-sm tracking-widest font-semibold">Pro</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path) ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`}
                id={`desktop-nav-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {link.name}
              </Link>
            ))}

            <div className="h-4 w-[1px] bg-gray-200"></div>

            {user ? (
              <div className="flex items-center space-x-4">
                {user.role === 'Customer' ? (
                  <Link
                    to={user.id.startsWith('scoped-') ? `/scoped/${user.id.replace('scoped-', '')}` : '/portal'}
                    className="flex items-center space-x-1.5 text-xs font-medium text-gray-700 hover:text-blue-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md"
                    id="nav-customer-portal"
                  >
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                    <span>{user.name || 'My Status'}</span>
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition"
                    id="nav-staff-dashboard"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Workspace</span>
                  </Link>
                )}

                <button
                  onClick={handleLogoutClick}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 hover:text-red-600 px-2 py-1 rounded-md"
                  title="Logout"
                  id="nav-logout-btn"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-lg transition shadow-xs"
                id="nav-login-btn"
              >
                Staff Portal
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-hidden"
              aria-expanded="false"
              id="mobile-menu-toggle"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-2 pt-2 pb-3 space-y-1 sm:px-3" id="mobile-nav-panel">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive(link.path) ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
              id={`mobile-nav-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 pb-2 border-t border-gray-100">
            {user ? (
              <div className="space-y-2 px-3">
                <div className="text-xs text-gray-500">Logged in as: {user.role}</div>
                {user.role === 'Customer' ? (
                  <Link
                    to={user.id.startsWith('scoped-') ? `/scoped/${user.id.replace('scoped-', '')}` : '/portal'}
                    onClick={() => setIsOpen(false)}
                    className="block text-center text-sm font-medium text-blue-600 bg-blue-50 py-2 rounded-md"
                    id="mobile-customer-portal"
                  >
                    My Status Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block text-center text-sm font-medium text-white bg-blue-600 py-2 rounded-md"
                    id="mobile-staff-dashboard"
                  >
                    Staff Workspace
                  </Link>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogoutClick();
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 text-sm font-medium text-red-600 border border-red-100 py-2 rounded-md hover:bg-red-50"
                  id="mobile-logout-btn"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block text-center mx-3 text-sm font-medium text-white bg-gray-950 py-2.5 rounded-lg"
                id="mobile-login-btn"
              >
                Staff Portal
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
