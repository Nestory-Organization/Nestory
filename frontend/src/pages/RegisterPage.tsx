import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

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

    if (!formData.name.trim()) newErrors.name = 'Name is required';

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
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await register({ name: formData.name, email: formData.email, password: formData.password, role: formData.role });
      toast.success('Welcome to the Sanctuary!');
      navigate('/');
    } catch (error: any) {
      const backendErrors = error?.response?.data?.errors;
      if (Array.isArray(backendErrors)) {
        const fieldErrors: Record<string, string> = {};
        backendErrors.forEach((item: any) => {
          if (item?.field && item?.message) fieldErrors[item.field] = item.message;
        });
        if (Object.keys(fieldErrors).length > 0) setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
      const errorMessage = error?.response?.data?.message || 'Registration failed. Please try again.';
      setFormError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const inputClass = (field: string) =>
    `w-full pl-12 pr-4 py-4 bg-surface-container-low border-b-2 focus:ring-0 transition-all outline-none text-on-surface rounded-t-lg ${
      errors[field] ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'
    }`;

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body animate-fade-in">
      {/* Top Header */}
      <header className="w-full px-8 py-8 flex justify-between items-center z-20">
        <span className="text-2xl font-bold serif-text text-primary tracking-tight">
          The Curated Sanctuary
        </span>
        <div className="hidden md:flex items-center gap-6">
          <span className="text-sm font-medium text-on-surface-variant uppercase tracking-widest">
            Have an account?
          </span>
          <Link
            to="/login"
            className="px-6 py-2 rounded-full border border-outline-variant text-primary font-semibold hover:bg-surface-container-low transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-surface-container-low rounded-xl overflow-hidden editorial-shadow min-h-[700px]">

          {/* Left: Artwork Side */}
          <div className="relative hidden lg:flex flex-col justify-end p-12 bg-[#efeeea]">
            <div className="absolute inset-0 z-0">
              <img
                alt="family reading together in a cozy library"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmEXOcvBvOAKwPbaZJSrwE1ijHJFoFkIlYuDUIqQtPbSLpamo00Ix2kuiT08uTViMQ-1kCL0T2xqqFqPm0n0c4nht-0e3Fw-SL6oxLF1ZDWvzy9BELX45VxPn72wrpCyAgAWn3aZ2FqZylRVnKXYCBlDXHQvLEdhlKaclysjrsFWm4FElo6Jnnap8VcKeHXMQmWjNsLr0SOSdlIdljUHn8Ddck4cDcn6V2NUaM9yjHMQryzsamcsAn4Z_pUc3G6exX_5HU19vNfqav"
                className="w-full h-full object-cover opacity-60 mix-blend-multiply"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#efeeea] via-transparent to-transparent" />
            </div>

            <div className="relative z-10 space-y-4">
              <blockquote className="text-on-surface-variant text-sm italic border-l-2 border-primary-container pl-4 mb-6">
                "A library is not a luxury but one of the necessities of life."
                <br />
                <span className="font-semibold not-italic text-secondary">— Henry Ward Beecher</span>
              </blockquote>
              <h1 className="text-5xl serif-text text-primary font-bold leading-tight tracking-tight">
                Begin your family's<br />curated story.
              </h1>
              <p className="text-lg text-on-surface-variant max-w-md leading-relaxed">
                Create a shared digital sanctuary where every reader finds their home. Manage your family library with the grace of a physical archive.
              </p>
            </div>
          </div>

          {/* Right: Registration Form */}
          <div className="bg-surface-container-lowest p-8 md:p-16 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <div className="mb-10">
                <h2 className="text-3xl serif-text text-on-surface font-bold mb-2">Create Sanctuary Account</h2>
                <p className="text-on-surface-variant">Join our community of curated readers.</p>
              </div>

              {formError && (
                <div className="mb-6 rounded-lg bg-error-container/40 px-4 py-3 text-sm text-error font-medium">
                  {formError}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1" htmlFor="name">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">badge</span>
                    <input id="name" name="name" type="text" value={formData.name} onChange={handleChange}
                      className={inputClass('name')} placeholder="Your full name" disabled={isLoading} />
                  </div>
                  {errors.name && <p className="text-error text-xs font-medium px-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">person</span>
                    <input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                      className={inputClass('email')} placeholder="hello@sanctuary.com" disabled={isLoading} />
                  </div>
                  {errors.email && <p className="text-error text-xs font-medium px-1">{errors.email}</p>}
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1" htmlFor="role">
                    I am registering as
                  </label>
                  <div className="flex gap-3">
                    {(['parent', 'admin'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, role: r }))}
                        className={`flex-1 py-3 rounded-full text-sm font-semibold border transition-all ${
                          formData.role === r
                            ? 'bg-primary text-on-primary border-primary'
                            : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        {r === 'parent' ? '👨‍👩‍👧 Parent / Guardian' : '🛡️ Administrator'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
                    <input id="password" name="password" type="password" value={formData.password} onChange={handleChange}
                      className={inputClass('password')} placeholder="At least 6 characters" disabled={isLoading} />
                  </div>
                  {errors.password && <p className="text-error text-xs font-medium px-1">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock_reset</span>
                    <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange}
                      className={inputClass('confirmPassword')} placeholder="Repeat your password" disabled={isLoading} />
                  </div>
                  {errors.confirmPassword && <p className="text-error text-xs font-medium px-1">{errors.confirmPassword}</p>}
                </div>

                {/* Submit */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-br from-primary to-primary-container text-white font-bold text-lg rounded-full shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  >
                    {isLoading
                      ? <><span className="material-symbols-outlined animate-spin-slow text-base">sync</span> Creating Account...</>
                      : <><span className="material-symbols-outlined text-base">auto_stories</span> Open the Sanctuary</>
                    }
                  </button>
                </div>
              </form>

              {/* Footer note */}
              <div className="mt-8 text-center">
                <p className="text-sm text-on-surface-variant">
                  The Head Librarian manages family access and billing.
                </p>
                <p className="mt-4 text-sm text-on-surface-variant">
                  Already have an archive?{' '}
                  <Link to="/login" className="text-primary font-bold hover:underline">Sign in here</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-8 px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-outline uppercase tracking-widest">
        <div>© 2024 The Curated Sanctuary. All rights reserved.</div>
        <div className="flex gap-8">
          <a className="hover:text-primary transition-colors" href="#">Support</a>
          <a className="hover:text-primary transition-colors" href="#">Family Safety</a>
          <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
};

export default RegisterPage;
