import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  RotateCcw, 
  BookOpen, 
  LayoutDashboard, 
  CheckCircle2, 
  TrendingUp, 
  MessageCircle, 
  Home, 
  Filter,
  ArrowLeft,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import StoryCard from '../../components/common/StoryCard';
import SelectField from '../../components/common/SelectField';
import StoryService from '../../services/storyService';
import toast from 'react-hot-toast';
import { Story } from '../../types';
import { Container, Section, Card, Grid } from '../../components/common/StitchComponents';

const Sidebar = ({ activeTab, onNavigate }: any) => {
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
        <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Exploration</span>
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

const StoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const ageGroupOptions = [
    { value: '', label: 'All Ages' },
    { value: 'toddler', label: 'Toddler' },
    { value: 'early-reader', label: 'Early Reader' },
    { value: 'middle-grade', label: 'Middle Grade' },
    { value: 'young-adult', label: 'Young Adult' },
  ];

  const levelOptions = [
    { value: '', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  useEffect(() => {
    const loadStories = async () => {
      try {
        setIsLoading(true);
        const response = await StoryService.getStories(currentPage, 12, {
          ageGroup: selectedAgeGroup,
          readingLevel: selectedLevel,
        });
        setStories(response.stories || []);
        setTotalPages(response.pages || 1);
      } catch (error) {
        toast.error('Failed to retrieve catalog');
      } finally {
        setIsLoading(false);
      }
    };
    loadStories();
  }, [currentPage, selectedAgeGroup, selectedLevel]);

  const filteredStories = stories.filter(s => 
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar title="Curated Collection" />
      <div className="flex flex-1">
        <Sidebar activeTab="/parent/stories" onNavigate={navigate} />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Container className="py-8">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="animate-slide-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-4">
                  <Sparkles size={12} /> Literary Discovery
                </div>
                <h1 className="text-4xl serif-text font-bold text-primary tracking-tight italic">Story Catalog</h1>
                <p className="mt-2 text-on-surface-variant font-medium">Curating the finest adventures for your domain.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 bg-surface-container-low p-2 rounded-2xl border border-outline-variant/30">
                <div className="relative min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={16} />
                  <input
                    type="text"
                    placeholder="Identify title or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-transparent text-sm border-none focus:ring-0 text-on-surface"
                  />
                </div>
                <div className="h-4 w-[1px] bg-outline-variant/40 hidden sm:block" />
                <div className="min-w-[140px]">
                  <SelectField
                    name="ageGroup"
                    options={ageGroupOptions}
                    value={selectedAgeGroup}
                    onChange={(e) => setSelectedAgeGroup(e.target.value)}
                  />
                </div>
                <div className="h-4 w-[1px] bg-outline-variant/40 hidden sm:block" />
                <div className="min-w-[140px]">
                  <SelectField
                    name="level"
                    options={levelOptions}
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                  />
                </div>
                 { (searchQuery || selectedAgeGroup || selectedLevel) && (
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedAgeGroup(''); setSelectedLevel(''); }}
                    className="p-2 hover:bg-surface-container-high rounded-lg text-primary transition-colors"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>
            </div>

            <Section title={searchQuery ? "Search Results" : "Registry of Adventures"}>
              {isLoading ? (
                <Grid columns={4} gap="md">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-[3/4] rounded-2xl bg-surface-container-high animate-pulse" />
                  ))}
                </Grid>
              ) : filteredStories.length === 0 ? (
                <Card className="py-20 text-center flex flex-col items-center">
                  <BookOpen size={48} className="text-outline-variant mb-4 opacity-50" />
                  <p className="serif-text text-xl text-on-surface-variant">No volumes found in this classification.</p>
                  <button onClick={() => { setSearchQuery(''); setSelectedAgeGroup(''); setSelectedLevel(''); }} className="mt-6 btn-outline text-xs">Reset Chronometer</button>
                </Card>
              ) : (
                <>
                  <Grid columns={4} gap="md">
                    {filteredStories.map((story) => (
                      <StoryCard
                        key={story.id}
                        story={story}
                        onSelect={() => navigate(`/parent/stories/${story.id}`)}
                      />
                    ))}
                  </Grid>

                  <div className="mt-12 flex items-center justify-center gap-4">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="p-2.5 rounded-full border border-outline-variant text-primary disabled:opacity-30 hover:bg-surface-container-low transition-colors shadow-sm"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div className="bg-surface-container-high px-6 py-2 rounded-full shadow-inner">
                      <span className="text-xs font-bold text-on-surface tracking-widest">PAGE {currentPage} <span className="text-outline mx-1">OF</span> {totalPages}</span>
                    </div>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="p-2.5 rounded-full border border-outline-variant text-primary disabled:opacity-30 hover:bg-surface-container-low transition-colors shadow-sm"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </>
              )}
            </Section>
          </Container>
          <footer className="py-8 text-center text-[10px] font-bold text-outline uppercase tracking-widest border-t border-outline-variant/30 bg-surface-container-low mt-12 italic">
            Expanding the horizons of your domain catalog.
          </footer>
        </main>
      </div>
    </div>
  );
};

export default StoriesPage;
