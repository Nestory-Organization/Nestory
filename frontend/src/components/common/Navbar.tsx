import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  BarChart3,
  Sparkles,
  MessageCircle,
  Users,
  Library,
  Download,
  Shield,
} from 'lucide-react';

interface NavbarProps {
  title?: string;
  onMenuClick?: () => void;
}

type NavItem = { to: string; label: string; icon: React.ElementType };

const parentNav: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/stories', label: 'Library', icon: BookOpen },
  { to: '/assignments', label: 'Tasks', icon: ClipboardList },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/gamification', label: 'Badges', icon: Sparkles },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/family-settings', label: 'Family', icon: Users },
];

const childNav: NavItem[] = [
  { to: '/child', label: 'My books', icon: BookOpen },
  { to: '/child/progress', label: 'Progress', icon: BarChart3 },
  { to: '/child/gamification', label: 'Badges', icon: Sparkles },
  { to: '/child/chat', label: 'Chat', icon: MessageCircle },
];

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: Shield },
  { to: '/admin/stories', label: 'Library', icon: Library },
  { to: '/admin/google-import', label: 'Import', icon: Download },
  { to: '/admin/gamification', label: 'Badges', icon: Sparkles },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-300 ease-spring',
    isActive
      ? 'bg-primary-container text-primary-800 shadow-ambient-sm'
      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
  ].join(' ');

const Navbar: React.FC<NavbarProps> = ({ title = 'Nestory', onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const items: NavItem[] =
    user?.role === 'parent'
      ? parentNav
      : user?.role === 'child'
        ? childNav
        : user?.role === 'admin'
          ? adminNav
          : [];

  return (
    <header className="sticky top-0 z-50 glass-effect">
      <nav className="container-responsive">
        <div className="h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                setIsOpen(!isOpen);
                onMenuClick?.();
              }}
              className="lg:hidden p-2.5 rounded-xl text-on-surface hover:bg-surface-container-low transition-colors ease-spring"
              aria-expanded={isOpen}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link
              to={
                user?.role === 'admin'
                  ? '/admin'
                  : user?.role === 'child'
                    ? '/child'
                    : '/dashboard'
              }
              className="flex items-center gap-2 min-w-0 group"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-lg shadow-ambient-sm ring-2 ring-white/70 transition-transform duration-300 ease-spring group-hover:scale-105"
                aria-hidden
              >
                📚
              </span>
              <span className="truncate">
                <span className="block font-headline text-lg font-semibold text-gradient leading-tight">
                  {title}
                </span>
                <span className="hidden sm:block text-[0.65rem] font-semibold uppercase tracking-widest text-on-surface-variant">
                  Nestory
                </span>
              </span>
            </Link>
          </div>

          {items.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 flex-wrap justify-center flex-1 px-2">
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={navLinkClass} end={to === '/child' || to === '/admin'}>
                  <Icon size={16} strokeWidth={2.25} aria-hidden />
                  {label}
                </NavLink>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="hidden md:block text-sm font-medium text-on-surface-variant truncate max-w-[10rem]">
              {user?.name}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-secondary flex items-center gap-2 text-sm py-2 px-3"
              title="Logout"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {isOpen && items.length > 0 && (
          <div className="lg:hidden pb-4 animate-slide-down">
            <div className="flex flex-col gap-1 rounded-2xl bg-surface-container-low p-2 mt-1">
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/child' || to === '/admin'}
                  onClick={() => setIsOpen(false)}
                  className={navLinkClass}
                >
                  <Icon size={18} strokeWidth={2.25} aria-hidden />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
