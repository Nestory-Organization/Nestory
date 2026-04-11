import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import authService from '../services/authService';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!token) {
      newErrors.token = 'Reset token is missing';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const authResponse = await authService.resetPassword(token, formData.newPassword);
      
      if (authResponse.token && authResponse.user) {
        authService.setToken(authResponse.token, authResponse.user);
        try {
          await login({ 
            email: authResponse.user.email, 
            password: formData.newPassword 
          });
        } catch {
          // If login fails, still navigate since token is valid
          localStorage.setItem('token', authResponse.token);
          localStorage.setItem('user', JSON.stringify(authResponse.user));
        }
      }

      toast.success('Password reset successfully!');
      navigate('/');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to reset password';
      setErrors({ form: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-nestory-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-gradient mb-2">Nestory</div>
            <p className="text-gray-600">Family Reading Platform</p>
          </div>

          <div className="card shadow-lg text-center p-6 space-y-4">
            <p className="text-gray-700 font-semibold">No reset token found</p>
            <p className="text-gray-600 text-sm">
              Please use the forgot password page to generate a reset token.
            </p>
            <Link to="/forgot-password" className="btn-primary block w-full">
              Generate Reset Token
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-nestory-600 font-semibold hover:text-nestory-700"
            >
              <ArrowLeft size={18} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-nestory-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-gradient mb-2">Nestory</div>
          <p className="text-gray-600">Family Reading Platform</p>
        </div>

        {/* Reset Password Card */}
        <div className="card shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Reset Password</h2>
            <p className="text-gray-600 text-center text-sm">
              Create a new password for your account
            </p>

            {errors.form && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errors.form}
              </div>
            )}

            {/* New Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={`input-base pl-10 pr-10 ${
                    errors.newPassword ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-600 text-sm mt-1">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input-base pl-10 pr-10 ${
                    errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-nestory-600 font-semibold hover:text-nestory-700"
            >
              <ArrowLeft size={18} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
