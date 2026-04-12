import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LogOut, 
  MessageCircle, 
  Settings, 
  Menu, 
  X, 
  Home, 
  Library, 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Trophy,
  BookOpen,
  Mail,
  Shield
} from 'lucide-react';

interface NavbarProps {
  title?: string;
  familyName?: string;
  unreadMessages?: number;
}

const Navbar: React.FC<NavbarProps> = ({
  title = 'The Curated Sanctuary',
  familyName,
  unreadMessages = 0,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dashboardRoute = user?.role === 'admin' ? '/admin' : (user?.role === 'child' ? '/child' : '/dashboard');

  const navItems = [
    { label: 'Dashboard', path: dashboardRoute, icon: LayoutDashboard, roles: ['parent', 'admin', 'child'] },
    { label: 'Library', path: '/stories', icon: Library, roles: ['parent'] },
    { label: 'Library', path: '/admin/stories', icon: Library, roles: ['admin'] },
    { label: 'Family', path: '/family-settings', icon: Users, roles: ['parent'] },
    { label: 'Progress', path: user?.role === 'child' ? '/child/progress' : '/progress', icon: BarChart3, roles: ['parent', 'child'] },
    { label: 'Rewards', path: user?.role === 'child' ? '/child/gamification' : '/gamification', icon: Trophy, roles: ['parent', 'child'] },
    { label: 'Chat', path: user?.role === 'child' ? '/child/chat' : '/chat', icon: MessageCircle, roles: ['parent', 'child'] },
    { label: 'Admin Panel', path: '/admin', icon: Shield, roles: ['admin'] },
  ].filter(item => item.roles.includes(user?.role || ''));

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-surface-container-highest/80 backdrop-blur-md sticky top-0 z-50 w-full border-b border-outline-variant/30">
      <div className="container-responsive h-18 md:h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <BookOpen size={20} className="md:size-24" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-bold serif-text text-primary tracking-tight leading-none">
                {title}
              </span>
              {familyName && (
                <span className="text-[10px] md:text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-0.5">
                  {familyName} Archive
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                isActive(item.path)
                  ? 'bg-primary text-white shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Desktop Profile / Actions */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="h-8 w-px bg-outline-variant/30 mx-2"></div>
          <div className="flex items-center gap-3 pl-2">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-on-surface">{user?.name}</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">{user?.role}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-container border-2 border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-on-surface-variant hover:bg-error/10 hover:text-error transition-all"
              title="Log out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex lg:hidden items-center gap-2">
           <button
            onClick={() => navigate(user?.role === 'child' ? '/child/chat' : '/chat')}
            className="p-2 rounded-full relative"
          >
            <MessageCircle size={22} className="text-on-surface-variant" />
            {unreadMessages > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadMessages}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-xl bg-surface-container text-on-surface-variant"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[72px] bg-surface z-40 animate-fade-in overflow-y-auto pb-20">
          <div className="p-4 flex flex-col gap-2">
            <div className="px-4 py-6 mb-4 bg-surface-container-low rounded-3xl flex items-center gap-4 border border-outline-variant/30">
              <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center text-primary text-2xl font-bold border-2 border-primary/20">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">{user?.name}</h3>
                <p className="text-sm text-on-surface-variant mb-2">{user?.email}</p>
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded-full tracking-widest">
                  {user?.role} Account
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                    isActive(item.path)
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-surface-container-low text-on-surface-variant active:bg-surface-container-high'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <item.icon size={22} className={isActive(item.path) ? 'text-white' : 'text-primary'} />
                    <span className="font-bold">{item.label}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-outline-variant/30 px-2 space-y-4">
               <button
                onClick={() => {
                  navigate('/family-settings');
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-4 px-4 py-3 text-on-surface-variant font-bold"
              >
                <Settings size={20} />
                <span>Account Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3 text-error font-bold"
              >
                <LogOut size={20} />
                <span>Sign Out of Sanctuary</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
