import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import InputField from '../components/common/InputField';
import toast from 'react-hot-toast';
import { 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Lock, 
  Mail,
  Home
} from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email and password required');
      return;
    }
    setIsLoading(true);
    try {
      await login({ email, password });
      toast.success('Welcome back to the Sanctuary');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 -z-10"></div>
      
      <nav className="w-full py-8 px-12 flex justify-between items-center z-20">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary group-hover:text-on-primary transition-all duration-500 shadow-sm">
            <BookOpen size={24} className="stroke-[1.5]" />
          </div>
          <div>
            <span className="text-2xl serif-text font-bold text-primary tracking-tight italic block leading-none">Nestory</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-outline opacity-70">The Curated Sanctuary</span>
          </div>
        </Link>
        <Link to="/register" className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface hover:text-primary transition-colors group">
          Create Account <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-12 z-10">
        <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="hidden lg:block space-y-12 animate-slide-up">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-4 shadow-sm">
                <Sparkles size={12} className="fill-primary/20" /> Established Domain
              </div>
              <h1 className="text-6xl serif-text font-bold text-primary italic leading-[1.1] tracking-tight">
                Rekindle the <br/> 
                <span className="text-on-surface not-italic">Legacy of</span> <br/>
                Deep Reading.
              </h1>
              <p className="text-on-surface-variant text-lg max-w-md leading-relaxed font-medium">
                Step back into your family''s digital sanctuary. Where stories are preserved and young minds flourish.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: <ShieldCheck size={18} />, text: "Family-first security protocol" },
                { icon: <Home size={18} />, text: "Synced across all home devices" },
                { icon: <Sparkles size={18} />, text: "Curated literary adventures" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-sm font-semibold text-on-surface/70 group border-l-2 border-transparent hover:border-primary pl-4 transition-all duration-300">
                  <span className="text-primary group-hover:scale-110 transition-transform">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[460px] bg-surface-container-lowest p-10 md:p-12 rounded-[2.5rem] shadow-2xl shadow-primary/10 border border-outline-variant/30 relative overflow-hidden animate-fade-in group hover:shadow-primary/20 transition-all duration-500">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BookOpen size={120} strokeWidth={0.5} />
              </div>

              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl serif-text font-bold text-primary mb-2">Welcome Back</h2>
                <p className="text-sm font-medium text-on-surface-variant italic">Enter your credentials to access the domain.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline mb-2 block ml-1">Domain Email</label>
                    <InputField
                      type="email"
                      name="email"
                      placeholder="guardian@sanctuary.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      icon={Mail}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2 px-1">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline">Sanctuary Key</label>
                      <Link to="/forgot-password" title="Recover Access" className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] hover:underline">Lost access?</Link>
                    </div>
                    <InputField
                      type="password"
                      name="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      icon={Lock}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 px-8 bg-primary text-on-primary rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
                  >
                    <span className="flex items-center justify-center gap-3">
                      {isLoading ? 'Decrypting Access...' : 'Authenticate'}
                      {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                    </span>
                  </button>
                </div>
              </form>

              <div className="mt-12 text-center">
                <div className="relative flex items-center justify-center mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-outline-variant/30"></div>
                  </div>
                  <span className="relative px-4 bg-surface-container-lowest text-xs font-bold uppercase tracking-[0.2em] text-outline">or continue with</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" className="flex items-center justify-center gap-3 py-3 px-6 bg-surface-container-low hover:bg-surface-container-high transition-colors rounded-full font-semibold text-sm text-on-surface group">
                    <img alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"/>
                    Google
                  </button>
                  <button type="button" className="flex items-center justify-center gap-3 py-3 px-6 bg-surface-container-low hover:bg-surface-container-high transition-colors rounded-full font-semibold text-sm text-on-surface group">
                    <Lock size={18} className="group-hover:scale-110 transition-transform" />
                    Key
                  </button>
                </div>

                <div className="mt-8 md:hidden text-sm">
                  <span className="text-on-surface-variant mr-2 italic">New to the sanctuary?</span>
                  <Link to="/register" className="text-primary font-bold hover:underline">
                    Establish Domain
                  </Link>
                </div>
              </div>

              <p className="mt-12 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant opacity-60 max-w-[280px] mx-auto leading-relaxed">
                Protected by the Sanctuary <br/> 
                <a className="text-primary hover:underline" href="#">Terms</a> · <a className="text-primary hover:underline" href="#">Privacy</a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-8 px-12 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-outline uppercase tracking-[0.2em] opacity-80 z-20">
        <div>© 2024 Nestory · The Curated Sanctuary</div>
        <div className="flex gap-8">
          <a className="hover:text-primary transition-colors" href="#">Support</a>
          <a className="hover:text-primary transition-colors" href="#">Security</a>
          <a className="hover:text-primary transition-colors" href="#">Archive</a>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
