import React, { useState } from 'react';
import { Award, Star, TrendingUp, Users, Zap, Search, Plus, Filter } from 'lucide-react';

const GamificationAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'badges' | 'milestones' | 'levels'>('badges');

  const stats = [
    { label: 'Total Badges', value: '24', icon: <Award className='text-orange-500' />, change: '+2 new' },
    { label: 'Active Milestones', value: '12', icon: <Star className='text-yellow-500' />, change: '85% completion' },
    { label: 'Average Level', value: '4.2', icon: <TrendingUp className='text-green-500' />, change: '+0.3 this week' },
    { label: 'Top Achievers', value: '128', icon: <Users className='text-blue-500' />, change: '+12 kids' },
  ];

  return (
    <div className='space-y-8'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {stats.map((stat, i) => (
          <div key={i} className='bg-white p-6 rounded-[2rem] border border-orange-100 shadow-sm hover:shadow-md transition-all'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-3 bg-orange-50 rounded-2xl'>{stat.icon}</div>
              <span className='text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-tighter'>{stat.change}</span>
            </div>
            <h3 className='text-gray-500 text-xs font-bold uppercase tracking-widest mb-1'>{stat.label}</h3>
            <p className='text-3xl font-black text-gray-900'>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className='bg-white rounded-[2.5rem] border border-orange-100 shadow-sm overflow-hidden min-h-[600px]'>
        <div className='px-8 pt-8 flex border-b border-orange-50'>
          <button 
            onClick={() => setActiveTab('badges')}
            className={activeTab === 'badges' ? 'pb-4 px-6 text-sm font-bold transition-all relative text-nestory-600' : 'pb-4 px-6 text-sm font-bold transition-all relative text-gray-400 hover:text-gray-600'}
          >
            Badges & Awards
            {activeTab === 'badges' && <div className='absolute bottom-0 left-0 w-full h-1 bg-nestory-600 rounded-full' />}
          </button>
          <button 
            onClick={() => setActiveTab('milestones')}
            className={activeTab === 'milestones' ? 'pb-4 px-6 text-sm font-bold transition-all relative text-nestory-600' : 'pb-4 px-6 text-sm font-bold transition-all relative text-gray-400 hover:text-gray-600'}
          >
            Reading Milestones
            {activeTab === 'milestones' && <div className='absolute bottom-0 left-0 w-full h-1 bg-nestory-600 rounded-full' />}
          </button>
          <button 
            onClick={() => setActiveTab('levels')}
            className={activeTab === 'levels' ? 'pb-4 px-6 text-sm font-bold transition-all relative text-nestory-600' : 'pb-4 px-6 text-sm font-bold transition-all relative text-gray-400 hover:text-gray-600'}
          >
            Leveling System
            {activeTab === 'levels' && <div className='absolute bottom-0 left-0 w-full h-1 bg-nestory-600 rounded-full' />}
          </button>
        </div>

        <div className='p-8'>
           <div className='flex items-center justify-between mb-8'>
              <div className='relative w-96'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={18} />
                <input type='text' placeholder='Search records...' className='w-full pl-10 pr-4 py-3 bg-gray-50 border border-orange-100 rounded-2xl font-medium text-sm' />
              </div>
              <div className='flex gap-3'>
                <button className='flex items-center gap-2 px-4 py-2.5 bg-white border border-orange-100 text-gray-600 font-bold rounded-xl hover:bg-orange-50 transition-colors'><Filter size={18} />Filter</button>
                <button className='flex items-center gap-2 px-5 py-2.5 bg-nestory-600 text-white font-bold rounded-xl hover:bg-nestory-700 transition-all shadow-lg shadow-nestory-100'><Plus size={18} />Create</button>
              </div>
           </div>
           <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {[1, 2, 3].map((item) => (
                <div key={item} className='bg-white border border-orange-100 rounded-3xl p-6 hover:border-nestory-200 hover:shadow-xl transition-all'>
                  <div className='flex items-start gap-4 mb-6'>
                    <div className='w-16 h-16 bg-nestory-100 rounded-2xl flex items-center justify-center text-nestory-600'><Zap size={32} /></div>
                    <div>
                      <h4 className='font-black text-gray-900 text-lg'>Achievement Name</h4>
                      <p className='text-xs font-bold text-nestory-600 uppercase tracking-widest'>Level 1</p>
                    </div>
                  </div>
                  <p className='text-gray-500 text-sm font-medium mb-6'>Achievement description goes here.</p>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationAdminPage;

