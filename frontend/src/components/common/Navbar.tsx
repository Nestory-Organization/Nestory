import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Menu, X, Bell, User as UserIcon, Sparkles } from 'lucide-react';

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
    <nav className="bg-[#FDFCFB]/80 backdrop-blur-md border-b border-amber-500/10 sticky top-0 z-[100] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Mobile Menu & Breadcrumb Style Title */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              onMenuClick?.();
            }}
            className="lg:hidden p-3 bg-white border border-slate-100 shadow-sm hover:shadow-md hover:bg-slate-50 rounded-2xl transition-all active:scale-95"
          >
            {isOpen ? <X size={20} className="text-slate-600" /> : <Menu size={20} className="text-slate-600" />}
          </button>
          
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] leading-none mb-1">
              {user?.role === 'admin' ? 'Admin Controller' : 'Portal'}
            </span>
            <div className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="hidden sm:inline">🚀</span> {title}
            </div>
          </div>
        </div>

        {/* Right: Premium User Actions */}
        <div className="flex items-center gap-2 sm:gap-4 bg-white/50 p-1.5 rounded-[1.25rem] border border-white/80 shadow-sm backdrop-blur-sm">
          {/* Notifications Placeholder */}
          <button className="hidden sm:flex p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all group relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white ring-1 ring-orange-500/20"></span>
          </button>

          <div className="h-8 w-[1px] bg-slate-100 hidden sm:block mx-1"></div>

          {/* User Profile Hook */}
          <div className="flex items-center gap-3 px-3 py-1.5 bg-white border border-slate-50 rounded-2xl shadow-sm group cursor-default">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:rotate-6 transition-transform">
              <UserIcon size={20} strokeWidth={2.5} />
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-black text-slate-900 leading-none mb-0.5">{user?.name || 'User'}</p>
              <div className="flex items-center gap-1.5">
                <Sparkles size={10} className="text-amber-500 animate-pulse" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{user?.role || 'Member'}</p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2.5 bg-slate-900 hover:bg-red-600 text-white rounded-xl transition-all shadow-lg shadow-slate-900/10 active:scale-90 group"
            title="Logout"
          >
            <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
      
      {/* Decorative Bottom Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-200 to-transparent opacity-30"></div>
    </nav>
  );
};

export default Navbar;
