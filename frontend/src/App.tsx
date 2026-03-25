import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ParentDashboard from './pages/parent/Dashboard';
import StoriesPage from './pages/parent/StoriesPage';
import ChildDashboard from './pages/child/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

// Loading component
const LoadingScreen: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-nestory-50 to-blue-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-nestory-600 font-semibold">Loading Nestory...</p>
    </div>
  </div>
);

// Protected Route Component (for future use with more complex route guards)
// interface ProtectedRouteProps {
//   children: React.ReactNode;
//   requiredRole?: string;
// }
// 
// const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
//   const { isAuthenticated, user, isLoading } = useAuth();
//   
//   if (isLoading) {
//     return <LoadingScreen />;
//   }
//   
//   if (!isAuthenticated) {
//     return <Navigate to="/login" state={{ from: location.pathname }} replace />;
//   }
//   
//   if (requiredRole && user?.role !== requiredRole) {
//     return <Navigate to={`/${user?.role}`} replace />;
//   }
//   
//   return <>{children}</>;
// };

// Main App Component
const AppContent: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Home page redirect */}
      <Route path="/" element={isAuthenticated ? <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Navigate to="/login" replace />} />
      
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Authenticated routes based on role */}
      {isAuthenticated && user?.role === 'user' && (
        <>
          <Route path="/dashboard" element={<ParentDashboard />} />
          <Route path="/stories" element={<StoriesPage />} />
        </>
      )}

      {isAuthenticated && user?.role === 'child' && (
        <Route path="/dashboard" element={<ChildDashboard />} />
      )}

      {isAuthenticated && user?.role === 'admin' && (
        <Route path="/admin" element={<AdminDashboard />} />
      )}

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to={isAuthenticated ? (user?.role === 'admin' ? '/admin' : '/dashboard') : '/login'} replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#fff',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
