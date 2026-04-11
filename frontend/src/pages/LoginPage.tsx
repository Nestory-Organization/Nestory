import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

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
      toast.success('Welcome back to the Sanctuary!');
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
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body animate-fade-in">
      {/* Top Header */}
      <header className="w-full px-8 py-8 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-primary serif-text tracking-tight">The Curated Sanctuary</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <span className="text-sm font-medium text-on-surface-variant font-label uppercase tracking-widest">New here?</span>
          <Link
            to="/register"
            className="px-6 py-2 rounded-full border border-outline-variant text-primary font-semibold hover:bg-surface-container-low transition-colors"
          >
            Create Account
          </Link>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        {/* Main Content Shell: Split Layout */}
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-surface-container-low rounded-xl overflow-hidden editorial-shadow min-h-[700px]">
          {/* Left Side: Friendly Artwork/Illustration Side */}
          <div className="relative hidden lg:flex flex-col justify-end p-12 bg-[#efeeea]">
            <div className="absolute inset-0 z-0">
              <img 
                alt="whimsical illustration of a children's reading nook" 
                className="w-full h-full object-cover opacity-60 mix-blend-multiply" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmEXOcvBvOAKwPbaZJSrwE1ijHJFoFkIlYuDUIqQtPbSLpamo00Ix2kuiT08uTViMQ-1kCL0T2xqqFqPm0n0c4nht-0e3Fw-SL6oxLF1ZDWvzy9BELX45VxPn72wrpCyAgAWn3aZ2FqZylRVnKXYCBlDXHQvLEdhlKaclysjrsFWm4FElo6Jnnap8VcKeHXMQmWjNsLr0SOSdlIdljUHn8Ddck4cDcn6V2NUaM9yjHMQryzsamcsAn4Z_pUc3G6exX_5HU19vNfqav"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#efeeea] via-transparent to-transparent"></div>
            </div>
            
            <div className="relative z-10 space-y-4">
              <h1 className="text-5xl serif-text text-primary font-bold leading-tight tracking-tight">
                A quiet space <br/>for small explorers.
              </h1>
              <p className="text-lg text-on-surface-variant max-w-md leading-relaxed">
                Step back into your family’s curated sanctuary of stories, knowledge, and shared imagination.
              </p>
              
              <div className="pt-8 flex items-center gap-4">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-surface bg-primary-container flex items-center justify-center text-white text-xs font-bold">JD</div>
                  <div className="w-10 h-10 rounded-full border-2 border-surface bg-tertiary-container flex items-center justify-center text-white text-xs font-bold">MK</div>
                  <div className="w-10 h-10 rounded-full border-2 border-surface bg-secondary flex items-center justify-center text-white text-xs font-bold">+4</div>
                </div>
                <span className="text-sm font-medium text-secondary italic">Joined by 12,000+ families this month</span>
              </div>
            </div>
          </div>

          {/* Right Side: Clean Login Card */}
          <div className="bg-surface-container-lowest p-8 md:p-16 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <div className="mb-10 lg:hidden text-center md:text-left">
                <h2 className="text-3xl serif-text text-primary font-bold mb-2">Welcome Back</h2>
                <p className="text-on-surface-variant">Sign in to access your family library.</p>
              </div>
              <div className="mb-10 hidden lg:block">
                <h2 className="text-3xl serif-text text-on-surface font-bold mb-2">Sign In</h2>
                <p className="text-on-surface-variant">Please enter your details to continue reading.</p>
              </div>

              {formError && (
                <div className="mb-6 rounded-lg border border-error-container bg-error-container/30 px-4 py-3 text-sm text-error font-medium">
                  {formError}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">person</span>
                    <input 
                      id="email" 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-4 bg-surface-container-low border-b-2 focus:ring-0 transition-all outline-none text-on-surface rounded-t-lg ${errors.email ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'}`}
                      placeholder="hello@sanctuary.com"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && <p className="text-error text-xs font-medium px-1 mt-1">{errors.email}</p>}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant" htmlFor="password">
                      Password
                    </label>
                    <a className="text-xs font-bold text-primary hover:underline transition-all" href="#">Forgot password?</a>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
                    <input 
                      id="password" 
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-4 bg-surface-container-low border-b-2 focus:ring-0 transition-all outline-none text-on-surface rounded-t-lg ${errors.password ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'}`}
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.password && <p className="text-error text-xs font-medium px-1 mt-1">{errors.password}</p>}
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-3 px-1">
                  <div className="relative flex items-center">
                    <input 
                      id="remember" 
                      type="checkbox"
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 transition-all cursor-pointer"
                    />
                  </div>
                  <label className="text-sm text-on-surface-variant font-medium cursor-pointer" htmlFor="remember">
                    Keep me signed in on this device
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-br from-primary to-primary-container text-white font-bold text-lg rounded-full shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="material-symbols-outlined animate-spin-slow">sync</span>
                    ) : null}
                    {isLoading ? 'Signing In...' : 'Sign In to Sanctuary'}
                  </button>
                </div>
              </form>

              {/* Social Login Alternative */}
              <div className="mt-12 text-center">
                <div className="relative flex items-center justify-center mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-outline-variant/30"></div>
                  </div>
                  <span className="relative px-4 bg-surface-container-lowest text-xs font-bold uppercase tracking-[0.2em] text-outline">or continue with</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-3 py-3 px-6 bg-surface-container-low hover:bg-surface-container-high transition-colors rounded-full font-semibold text-sm text-on-surface">
                    <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJBeJprWdg_-jhA_yGcMnlbY05b19RvozC6gOhMoWx11Uz7ACIUVg-vgmKP8Usu-rQwLYdzQybPELtZ77Pn-vLuHz1r_1I71FhUy0tMeS0IQNV9x194JniCun3ZUSECY4E6lGlY6h8r_egGe5p82T-8MMu0iT9JzkeccwqpvKbRJjTPPoZuknLJ1iXpFmNyKMiwdVU44AESJFewXywP31peaUkWiLsfEmKBXwT6Qy-t3Tm_zxj3Z5Ng5nu3AuZXQcv3nPFy40apIQv"/>
                    Google
                  </button>
                  <button className="flex items-center justify-center gap-3 py-3 px-6 bg-surface-container-low hover:bg-surface-container-high transition-colors rounded-full font-semibold text-sm text-on-surface">
                    <span className="material-symbols-outlined text-xl" style={{fontVariationSettings: "'FILL' 1"}}>ios</span>
                    Apple
                  </button>
                </div>

                {/* Mobile Create Account Link */}
                <div className="mt-8 md:hidden text-sm">
                  <span className="text-on-surface-variant mr-2">New here?</span>
                  <Link to="/register" className="text-primary font-bold hover:underline">
                    Create Account
                  </Link>
                </div>
              </div>

              <p className="mt-12 text-center text-sm text-on-surface-variant">
                By continuing, you agree to The Curated Sanctuary's <br/>
                <a className="text-primary font-bold hover:underline" href="#">Terms of Service</a> and <a className="text-primary font-bold hover:underline" href="#">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-outline uppercase tracking-widest z-20">
        <div>© 2024 The Curated Sanctuary. All rights reserved.</div>
        <div className="flex gap-8">
          <a className="hover:text-primary transition-colors" href="#">Support</a>
          <a className="hover:text-primary transition-colors" href="#">Family Safety</a>
          <a className="hover:text-primary transition-colors" href="#">Library Locations</a>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
