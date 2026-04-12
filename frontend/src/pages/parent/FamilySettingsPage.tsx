import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Home, 
  Users, 
  ShieldCheck, 
  Settings, 
  LayoutDashboard, 
  BookOpen, 
  CheckCircle2, 
  TrendingUp, 
  MessageCircle,
  Save,
  ChevronRight,
  Info
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import InputField from '../../components/common/InputField';
import FamilyService from '../../services/familyService';
import { Family } from '../../types';
import { Container, Section, Card } from '../../components/common/StitchComponents';

const Sidebar = ({ activeTab, onNavigate, hasFamily }: any) => {
  const tabs = [
    { id: "/parent", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { id: "/parent/stories", icon: <BookOpen size={20} />, label: "Library" },
    { id: "/parent/assignments", icon: <CheckCircle2 size={20} />, label: "Assignments" },
    { id: "/parent/progress", icon: <TrendingUp size={20} />, label: "Analytics" },
    { id: "/parent/chat", icon: <MessageCircle size={20} />, label: "Messages" },
    { id: "/parent/family-settings", icon: <Home size={20} />, label: "Family Home" },
  ];

  return (
    <aside className="w-64 bg-surface-container-low border-r border-outline-variant/30 hidden md:flex flex-col py-6 px-4">
      <div className="px-4 py-4 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Management</span>
      </div>
      <div className="space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === tab.id ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            <span className={activeTab === tab.id ? "text-on-primary" : "text-primary group-hover:scale-110 transition-transform"}>{tab.icon}</span>
            <span className="font-semibold text-sm">{tab.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
};

const FamilySettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [family, setFamily] = useState<Family | null>(null);
  const [familyName, setFamilyName] = useState('');
  const [familyNameError, setFamilyNameError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const validateFamilyName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Family name is required';
    if (trimmed.length < 2 || trimmed.length > 100) return 'Family name must be between 2 and 100 characters';
    return '';
  };

  const loadFamily = async () => {
    try {
      setIsLoading(true);
      setLoadError('');
      const data = await FamilyService.getMyFamily();
      setFamily(data);
      setFamilyName(data.familyName || '');
      setFamilyNameError('');
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setFamily(null);
        setFamilyName('');
      } else {
        setLoadError(error?.response?.data?.message || 'Failed to initialize domain');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadFamily(); }, []);

  const handleSubmit = async () => {
    const err = validateFamilyName(familyName);
    if (err) { setFamilyNameError(err); return; }

    try {
      setIsSaving(true);
      if (family) {
        const updated = await FamilyService.updateFamily(family.id, { familyName: familyName.trim() });
        setFamily(updated);
        toast.success('Sanctuary updated');
      } else {
        const created = await FamilyService.createFamily({ familyName: familyName.trim() });
        setFamily(created);
        toast.success('Sanctuary established');
      }
      setFamilyNameError('');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Transaction failed';
      setFamilyNameError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar title="Family Gateway" />
      <div className="flex flex-1">
        <Sidebar activeTab="/parent/family-settings" onNavigate={navigate} hasFamily={!!family} />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Container className="py-12 max-w-4xl">
            <div className="mb-10 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-4">
                <ShieldCheck size={12} /> Established Domain
              </div>
              <h1 className="text-4xl serif-text font-bold text-primary tracking-tight italic">Family Sanctuary</h1>
              <p className="mt-2 text-on-surface-variant font-medium">Define the core identity of your reading legacy.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="md:col-span-2 p-8 shadow-xl shadow-primary/5">
                <Section title="Domain Identity">
                  <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">Choose a name that reflects your family's journey. This name will appear on all shared reports and milestones.</p>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2 block ml-1">Legacy Name</label>
                      <InputField
                        placeholder="The Smith Family Sanctuary"
                        value={familyName}
                        onChange={(val) => { setFamilyName(val); setFamilyNameError(''); }}
                        error={familyNameError}
                      />
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-outline-variant/30 mt-8">
                      <div className="text-[10px] font-medium text-highlight italic">Last modified: {family?.updatedAt ? new Date(family.updatedAt).toLocaleDateString() : 'New'}</div>
                      <button 
                        onClick={handleSubmit} 
                        disabled={isSaving}
                        className="btn-primary flex items-center gap-2 px-8 py-3 shadow-lg shadow-primary/20"
                      >
                       {isSaving ? 'Synchronizing...' : (family ? 'Save Changes' : 'Establish Legacy')}
                       {!isSaving && <Save size={18} />}
                      </button>
                    </div>
                  </div>
                </Section>
              </Card>

              <div className="space-y-6">
                <Card className="p-6 bg-surface-container-low border-none outline outline-1 outline-outline-variant/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary"><Users size={18} /></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface">Ecosystem</span>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center justify-between text-xs py-1 border-b border-outline-variant/20 italic text-on-surface-variant">
                      <span>Shared Library</span>
                      <ChevronRight size={12} />
                    </li>
                    <li className="flex items-center justify-between text-xs py-1 border-b border-outline-variant/20 italic text-on-surface-variant">
                      <span>Sync Progress</span>
                      <ChevronRight size={12} />
                    </li>
                    <li className="flex items-center justify-between text-xs py-1 italic text-on-surface-variant">
                      <span>Global Leaderboard</span>
                      <ChevronRight size={12} />
                    </li>
                  </ul>
                </Card>

                <div className="p-6 rounded-3xl bg-surface-container-highest/30 border border-outline-variant/30">
                  <div className="flex gap-3">
                    <Info size={18} className="text-primary flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface mb-1">Legacy Status</p>
                      <p className="text-xs text-on-surface-variant leading-relaxed italic">Changes here update your child's profile immediately across all mobile and web devices.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
          <footer className="py-8 text-center text-[10px] font-bold text-outline uppercase tracking-widest border-t border-outline-variant/30 bg-surface-container-low mt-12">
            © 2024 The Curated Sanctuary · Domain Management
          </footer>
        </main>
      </div>
    </div>
  );
};

export default FamilySettingsPage;
