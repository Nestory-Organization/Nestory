import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search, Bell, Settings, ChevronRight } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  
  // Format breadcrumbs from path
  const pathParts = location.pathname.split('/').filter(p => p && p !== 'admin');
  const currentPage = pathParts.length > 0 ? pathParts[pathParts.length - 1].replace(/-/g, ' ') : 'Dashboard';

  return (
    <div className="flex h-screen bg-[#fafaf9] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header/Topbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-orange-100 flex items-center justify-between px-8 z-10 sticky top-0 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <span className="hover:text-nestory-600 transition-colors cursor-pointer">Admin</span>
              <ChevronRight size={12} className="mx-1 opacity-50" />
              <span className="text-gray-900">{currentPage}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Search */}
            <div className="relative hidden lg:block group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-nestory-600 transition-colors">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Search collection..."
                className="w-64 pl-10 pr-4 py-2 bg-gray-50 border border-orange-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nestory-200 focus:border-nestory-500 transition-all font-medium"
              />
            </div>

            {/* Actions */}
            <button className="p-2.5 rounded-xl bg-white border border-orange-100 text-gray-500 hover:text-nestory-600 hover:bg-orange-50 transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-nestory-600 border-2 border-white rounded-full shadow-sm shadow-nestory-400"></span>
            </button>
            <button className="p-2.5 rounded-xl bg-white border border-orange-100 text-gray-500 hover:text-nestory-600 hover:bg-orange-50 transition-all">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 scroll-smooth">
          <div className="max-w-[1400px] mx-auto space-y-8">
             <Outlet />
          </div>
          
          <footer className="mt-20 py-8 border-t border-orange-50 text-center">
            <p className="text-xs text-gray-400 font-medium tracking-wide">
              POWERED BY NESTORY CORE ENGINE V2.4 • BUILT FOR EDUCATION
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
