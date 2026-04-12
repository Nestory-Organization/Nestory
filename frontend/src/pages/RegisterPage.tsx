import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Sparkles, BookOpen, Lock, Mail, ArrowRight, Home } from 'lucide-react';
import InputField from '../components/common/InputField';
import toast from 'react-hot-toast';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'parent' as 'parent' | 'admin',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid email required';
    if (!formData.password) newErrors.password = 'Key is required';
    else if (formData.password.length < 6) newErrors.password = 'Key must be 6+ characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Keys do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await register({ name: formData.name, email: formData.email, password: formData.password, role: formData.role });
      toast.success('Sanctuary established');
      navigate('/');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Transaction failed');
    } finally {
      setIsLoading(true);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col relative overflow-hidden">
      <nav className="w-full py-8 px-12 flex justify-between items-center z-20">
        <Link to="/" className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-sm"><BookOpen size={24} /></div>
          <div>
            <span className="text-2xl serif-text font-bold text-primary tracking-tight italic block leading-none">Nestory</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-outline opacity-70">Establish Domain</span>
          </div>
        </Link>
        <Link to="/login" className="text-xs font-bold uppercase tracking-widest text-on-surface hover:text-primary transition-colors">Sign In</Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-12 z-10">
        <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="hidden lg:block space-y-10 animate-slide-up">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-4">
                <Sparkles size={12} /> New Sanctuary
              </div>
              <h1 className="text-6xl serif-text font-bold text-primary italic leading-[1.1] tracking-tight">Begin your <br/> family legacy.</h1>
              <p className="text-on-surface-variant text-lg max-w-md leading-relaxed font-medium">Create a shared domain where knowledge is preserved and milestones are celebrated together.</p>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[500px] bg-surface-container-lowest p-10 rounded-[2.5rem] shadow-2xl shadow-primary/10 border border-outline-variant/30">
              <h2 className="text-3xl serif-text font-bold text-primary mb-8 text-center lg:text-left">Register Domain</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <InputField label="Name" name="name" placeholder="Domain Guardian" value={formData.name} onChange={(e) => {setFormData({...formData, name: e.target.value}); setErrors({...errors, name: ''});}} error={errors.name} />
                </div>
                <div className="md:col-span-2">
                  <InputField label="Email" type="email" name="email" placeholder="guardian@sanctuary.com" value={formData.email} onChange={(e) => {setFormData({...formData, email: e.target.value}); setErrors({...errors, email: ''});}} error={errors.email} />
                </div>
                <div>
                  <InputField label="Sanctuary Key" type="password" name="password" placeholder="��������" value={formData.password} onChange={(e) => {setFormData({...formData, password: e.target.value}); setErrors({...errors, password: ''});}} error={errors.password} />
                </div>
                <div>
                  <InputField label="Confirm Key" type="password" name="confirmPassword" placeholder="��������" value={formData.confirmPassword} onChange={(e) => {setFormData({...formData, confirmPassword: e.target.value}); setErrors({...errors, confirmPassword: ''});}} error={errors.confirmPassword} />
                </div>
                <div className="md:col-span-2 pt-6">
                  <button type="submit" disabled={isLoading} className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-primary/20">
                    {isLoading ? 'Creating Sanctuary...' : 'Establish Domain'} <ArrowRight size={18} />
                  </button>
                </div>
              </form>
              <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">Already have a sanctuary? <Link to="/login" className="text-primary hover:underline">Return home</Link></p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
