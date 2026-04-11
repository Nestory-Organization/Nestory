import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Lock, UserPlus } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'parent' as 'parent' | 'admin',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    setFormError('');

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      toast.success('Registration successful! Welcome to Nestory!');
      navigate('/');
    } catch (error: any) {
      const backendErrors = error?.response?.data?.errors;
      if (Array.isArray(backendErrors)) {
        const fieldErrors: Record<string, string> = {};
        backendErrors.forEach((item: any) => {
          if (item?.field && item?.message) {
            fieldErrors[item.field] = item.message;
          }
        });
        if (Object.keys(fieldErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }
      }

      const errorMessage = error?.response?.data?.message || 'Registration failed. Please try again.';
      setFormError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen page-shell flex">
      <div className="hidden lg:flex lg:w-[40%] xl:w-[42%] relative overflow-hidden bg-gradient-to-br from-secondary-500 via-primary-500 to-tertiary-500 text-white p-12 flex-col justify-center">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,white,transparent_45%),radial-gradient(circle_at_80%_80%,white,transparent_40%)]" />
        <div className="relative z-10 max-w-sm">
          <p className="eyebrow text-white/90 mb-3">Join Nestory</p>
          <h2 className="font-headline text-3xl font-semibold leading-tight">
            Create your family&apos;s reading home
          </h2>
          <p className="mt-4 text-white/90 text-sm leading-relaxed">
            Register as a parent to manage children and assignments, or as an admin to curate the library and
            gamification.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in py-6">
          <div className="text-center mb-8 lg:hidden">
            <div className="font-headline text-4xl font-semibold text-gradient mb-2">Nestory</div>
            <p className="text-on-surface-variant">Create your family&apos;s reading home</p>
          </div>

          <div className="card shadow-ambient rounded-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center lg:text-left">
                <p className="eyebrow text-primary-700 mb-2">New account</p>
                <h2 className="font-headline text-2xl font-semibold text-on-surface">Create account</h2>
              </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`input-base pl-11 ${
                    errors.name ? '!shadow-[inset_0_0_0_2px_rgba(220,38,38,0.35)]' : ''
                  }`}
                  placeholder="John Doe"
                  disabled={isLoading}
                />
              </div>
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-base pl-11 ${
                    errors.email ? '!shadow-[inset_0_0_0_2px_rgba(220,38,38,0.35)]' : ''
                  }`}
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Register as</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-base"
                disabled={isLoading}
                title="Select account role"
              >
                <option value="parent">Parent/Guardian</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-base pl-11 ${
                    errors.password ? '!shadow-[inset_0_0_0_2px_rgba(220,38,38,0.35)]' : ''
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input-base pl-11 ${
                    errors.confirmPassword ? '!shadow-[inset_0_0_0_2px_rgba(220,38,38,0.35)]' : ''
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {formError && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.35)]">
                {formError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
            >
              <UserPlus size={20} />
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-8 pt-6 text-center bg-surface-container-low -mx-2 px-4 py-4 rounded-xl">
            <p className="text-on-surface-variant text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-700 font-semibold hover:text-primary-800 underline-offset-2 hover:underline">
                Log in
              </Link>
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
