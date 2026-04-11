import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, BookOpen, Sparkles, Users } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    setFormError('');

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      await login(formData);
      toast.success('Login successful!');
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

      const errorMessage = error?.response?.data?.message || 'Login failed. Please try again.';
      setFormError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen page-shell flex">
      <div className="hidden lg:flex lg:w-[42%] xl:w-[44%] relative overflow-hidden bg-auth-panel text-white p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-[0.15] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%221%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-ambient text-2xl ring-1 ring-white/30">
              📚
            </span>
            <div>
              <p className="font-headline text-2xl font-semibold tracking-tight">Nestory</p>
              <p className="text-sm text-white/85 font-medium">The living library</p>
            </div>
          </div>
          <h2 className="font-headline text-3xl xl:text-4xl font-semibold leading-tight max-w-md">
            Reading adventures for the whole family
          </h2>
          <p className="mt-5 text-white/90 max-w-sm text-base leading-relaxed">
            Parents assign stories, kids log sessions, and everyone celebrates progress together—with chat
            woven in.
          </p>
        </div>
        <ul className="relative z-10 space-y-4 text-sm text-white/95">
          <li className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <BookOpen size={20} />
            </span>
            <span>Story library & reading sessions</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <Sparkles size={20} />
            </span>
            <span>Streaks, badges, and gamification</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <Users size={20} />
            </span>
            <span>Family chat & real-time updates</span>
          </li>
        </ul>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8 lg:hidden">
            <div className="font-headline text-4xl font-semibold text-gradient mb-2">Nestory</div>
            <p className="text-on-surface-variant">Family reading, one living library</p>
          </div>

          <div className="card shadow-ambient rounded-2xl overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center lg:text-left">
                <p className="eyebrow text-primary-700 mb-2">Sign in</p>
                <h2 className="font-headline text-2xl font-semibold text-on-surface">Welcome back</h2>
                <p className="text-sm text-on-surface-variant mt-1">Use your parent or admin account</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Email address</label>
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

              {formError && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.35)]">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
              >
                <LogIn size={20} />
                {isLoading ? 'Logging in...' : 'Log in'}
              </button>
            </form>

            <div className="mt-8 pt-6 text-center bg-surface-container-low -mx-2 px-4 py-4 rounded-xl">
              <p className="text-on-surface-variant text-sm">
                Don&apos;t have an account?{' '}
                <Link
                  to="/register"
                  className="text-primary-700 font-semibold underline-offset-2 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-surface-container-low text-on-surface-variant text-xs leading-relaxed shadow-[inset_0_0_0_1px_rgba(48,51,46,0.06)]">
            <p className="eyebrow mb-2 text-on-surface">Demo</p>
            <p>parent@example.com · password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
