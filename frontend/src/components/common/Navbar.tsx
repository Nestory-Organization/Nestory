import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, MessageCircle, Settings } from 'lucide-react';

interface NavbarProps {
  title?: string;
  familyName?: string;
  unreadMessages?: number;
  onMenuClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  title = 'The Curated Sanctuary',
  familyName,
  unreadMessages = 0,
  onMenuClick,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass-effect sticky top-0 z-50 w-full">
      <div className="container-responsive h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant"
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span
            onClick={() => navigate('/')}
            className="text-xl font-bold serif-text text-primary tracking-tight cursor-pointer select-none"
          >
            {title}
          </span>
          {familyName && (
            <span className="hidden sm:block text-sm text-on-surface-variant font-medium">
              · {familyName}
            </span>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Chat / Notifications */}
          <button
            onClick={() => navigate('/chat')}
            className="relative p-2 rounded-full hover:bg-surface-container transition-colors"
            aria-label="Messages"
          >
            <MessageCircle size={22} className="text-on-surface-variant" />
            {unreadMessages > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </button>

          {/* Settings */}
          <button
            onClick={() => navigate('/family-settings')}
            className="p-2 rounded-full hover:bg-surface-container transition-colors"
            aria-label="Settings"
          >
            <Settings size={22} className="text-on-surface-variant" />
          </button>

          {/* Avatar + Logout */}
          <div className="flex items-center gap-2 ml-2">
            <div className="w-9 h-9 rounded-full bg-primary-container border-2 border-primary flex items-center justify-center text-sm font-bold text-on-primary-container select-none">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
              title="Log out"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
