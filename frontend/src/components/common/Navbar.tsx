import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  title?: string;
  onMenuClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ title = 'Nestory', onMenuClick }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white shadow-md border-b-2 border-nestory-200 sticky top-0 z-50">
      <div className="container-responsive h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              onMenuClick?.();
            }}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="text-2xl font-bold text-gradient">📚 {title}</div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-gray-700">
            {user?.name}
          </span>
          <button
            onClick={handleLogout}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Logout"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
