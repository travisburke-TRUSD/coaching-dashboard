import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, MapPin, AlertCircle, Calendar, Award, Filter, X, ChevronDown, ChevronRight } from 'lucide-react';

const CoachingDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCoach, setSelectedCoach] = useState('all');
  const [selectedSite, setSelectedSite] = useState('all');
  const [expandedTheme, setExpandedTheme] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/18fCknMjwxlCf1TVFPX8ryuRU4o3m061Qg8iVgLFXtVk/export?format=csv&gid=2102890535');
        const csvText = await response.text();
        
        const rows = csvText.split('\n').map(row => {
          const cols = row.split(',');
          return cols;
        });
        
        const processedData = rows.slice(1).filter(row => row.length > 5).map(row => ({
          timestamp: row[0],
          email: row[1],
          location: row[2],
          coachee: row[3],
          progress: row[4],
          strengths: row[5],
          improvements: row[6],
          recommendations: row[7]
        }));

        const metrics = calculateMetrics(processedData);
        setData(metrics);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setData(getSampleData());
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateMetrics = (rawData) => {
    const coaches = {};
    const sites = {};
    const progressCount = {
      'Fully Implemented': 0,
      'Partially implemented': 0,
      'Not implemented': 0,
      'First time': 0,
      'First meeting': 0
    };
    
    const strengthThemes = {};
    const improvementThemes = {};
    
    rawData.forEach(entry => {
      const coach = entry.email.split('@')[0].replace('.', ' ');
      coaches[coach] = (coaches[coach] || 0) + 1;
      sites[entry.location] = (sites[entry.location] || 0) + 1;
      
      const progress = entry.progress.toLowerCase();
      if (progress.includes('fully')) progressCount['Fully Implemented']++;
      else if (progress.includes('partially')) progressCount['Partially implemented']++;
      else if (progress.includes('not')) progressCount['Not implemented']++;
      else if (progress.includes('first')) {
        progressCount['First time']++;
        progressCount['First meeting']++;
      }

      extractThemes(entry.strengths, strengthThemes, entry, 'strength');
      extractThemes(entry.improvements, improvementThemes, entry, 'improvement');
    });

    return {
      totalVisits: rawData.length,
      coaches: Object.entries(coaches).map(([name, visits]) => ({ name, visits })).sort((a, b) => b.visits - a.visits),
      sites: Object.entries(sites).map(([name, visits]) => ({ name, visits })).sort((a, b) => b.visits - a.visits),
      progress: Object.entries(progressCount).map(([name, value]) => ({ name, value })),
      strengthThemes: Object.entries(strengthThemes).map(([theme, data]) => ({ 
        theme, 
        count: data.count,
        sources: data.sources 
      })).sort((a, b) => b.count - a.count),
      improvementThemes: Object.entries(improvementThemes).map(([theme, data]) => ({ 
        theme, 
        count: data.count,
        sources: data.sources 
      })).sort((a, b) => b.count - a.count),
      rawData
    };
  };

  const extractThemes = (text, themeObj, entry, type) => {
    const lowerText = text.toLowerCase();
    const themes = {
      'Strong Relationships': ['relationship', 'rapport', 'connection', 'communication with'],
      'Good Structure': ['structure', 'organized', 'routine', 'system'],
      'Student Engagement': ['engaged', 'participating', 'active', 'involvement'],
      'Effective Transitions': ['transition', 'smooth', 'flow'],
      'Staff Collaboration': ['collaboration', 'teamwork', 'working together'],
      'Staffing Issues': ['need staff', 'down staff', 'lack of staff', 'more staff'],
      'Supervision Concerns': ['supervision', 'line of sight', 'monitoring'],
      'Space/Classroom Needs': ['space', 'classroom', 'room'],
      'Communication Needs': ['communication need', 'need to communicate', 'improve communication'],
      'Admin/Procare Support': ['procare', 'admin', 'paperwork', 'documentation']
    };

    Object.entries(themes).forEach(([themeName, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        if (!themeObj[themeName]) {
          themeObj[themeName] = { count: 0, sources: [] };
        }
        themeObj[themeName].count++;
        themeObj[themeName].sources.push({
          site: entry.location,
          coach: entry.email.split('@')[0].replace('.', ' '),
          date: entry.timestamp,
          text: text.substring(0, 150) + (text.length > 150 ? '...' : '')
        });
      }
    });
  };

  const getSampleData = () => ({
    totalVisits: 100,
    coaches: [
      { name: 'Jafahri Oler', visits: 15 },
      { name: 'Joe Howard', visits: 14 }
    ],
    sites: [
      { name: 'Foothill High School', visits: 8 }
    ],
    progress: [
      { name: 'Fully Implemented', value: 15 }
    ],
    strengthThemes: [
      { theme: 'Strong Relationships', count: 28, sources: [] }
    ],
    improvementThemes: [
      { theme: 'Staffing Issues', count: 18, sources: [] }
    ],
    rawData: []
  });

  const getFilteredData = () => {
    if (!data) return null;
    
    let filtered = data.rawData;
    
    if (selectedCoach !== 'all') {
      filtered = filtered.filter(entry => 
        entry.email.split('@')[0].replace('.', ' ') === selectedCoach
      );
    }
    
    if (selectedSite !== 'all') {
      filtered = filtered.filter(entry => entry.location === selectedSite);
    }
    
    return calculateMetrics(filtered);
  };

  const displayData = getFilteredData() || data;

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading coaching data...</p>
        </div>
      </div>
    );
  }

  const FilterBar = () => (
    <div className="bg-white rounded-2xl shadow-xl p-10 mb-10 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-6">
          <Filter size={40} className="text-blue-600" />
          <span className="font-bold text-3xl text-gray-800">Filters</span>
        </div>
        
        <div className="flex flex-col gap-8">
          <div className="w-full">
            <label className="block text-2xl font-bold text-gray-800 mb-4">Select Coach</label>
            <select
              value={selectedCoach}
              onChange={(e) => setSelectedCoach(e.target.value)}
              className="w-full px-8 py-5 text-xl border-4 border-blue-400 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:border-blue-600 font-semibold bg-white shadow-md"
            >
              <option value="all">All Coaches</option>
              {data.coaches.map(coach => (
                <option key={coach.name} value={coach.name}>{coach.name}</option>
              ))}
            </select>
          </div>
          
          <div className="w-full">
            <label className="block text-2xl font-bold text-gray-800 mb-4">Select Site</label>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="w-full px-8 py-5 text-xl border-4 border-green-400 rounded-2xl focus:ring-4 focus:ring-green-500 focus:border-green-600 font-semibold bg-white shadow-md"
            >
              <option value="all">All Sites</option>
              {data.sites.map(site => (
                <option key={site.name} value={site.name}>{site.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {(selectedCoach !== 'all' || selectedSite !== 'all') && (
          <button
            onClick={() => {
              setSelectedCoach('all');
              setSelectedSite('all');
            }}
            className="mt-8 flex items-center justify-center gap-3 px-10 py-5 text-xl bg-red-500 hover:bg-red-600 rounded-2xl text-white font-bold shadow-lg mx-auto"
          >
            <X size={28} />
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );

  const ThemeDrillDown = ({ theme, sources, type }) => {
    const isExpanded = expandedTheme === theme;
    const strengthClass = "bg-green-500 text-white";
    const improvementClass = "bg-orange-500 text-white";
    const badgeClass = type === 'strength' ? strengthClass : improvementClass;
    
    const themeColors = {
      'Strong Relationships': 'bg-blue-400 hover:bg-blue-500 border-blue-600 text-blue-900',
      'Good Structure': 'bg-green-400 hover:bg-green-500 border-green-600 text-green-900',
      'Student Engagement': 'bg-yellow-400 hover:bg-yellow-500 border-yellow-600 text-yellow-900',
      'Effective Transitions': 'bg-purple-400 hover:bg-purple-500 border-purple-600 text-purple-900',
      'Staff Collaboration': 'bg-indigo-400 hover:bg-indigo-500 border-indigo-600 text-indigo-900',
      'Staffing Issues': 'bg-red-400 hover:bg-red-500 border-red-600 text-red-900',
      'Supervision Concerns': 'bg-orange-400 hover:bg-orange-500 border-orange-600 text-orange-900',
      'Space/Classroom Needs': 'bg-yellow-400 hover:bg-yellow-500 border-yellow-600 text-yellow-900',
      'Communication Needs': 'bg-blue-400 hover:bg-blue-500 border-blue-600 text-blue-900',
      'Admin/Procare Support': 'bg-green-400 hover:bg-green-500 border-green-600 text-green-900'
    };
    
    const buttonColor = themeColors[theme] || 'bg-gray-400 hover:bg-gray-500 border-gray-600 text-gray-900';
    
    return (
      <div className={"border-4 rounded-2xl mb-6 overflow-hidden shadow-xl " + buttonColor}>
        <button
          onClick={() => setExpandedTheme(isExpanded ? null : theme)}
          className={"w-full flex justify-between items-center p-8 transition-all transform hover:scale-105 " + buttonColor}
        >
          <div className="flex items-center gap-6">
            {isExpanded ? <ChevronDown size={40} className="font-bold" /> : <ChevronRight size={40} className="font-bold" />}
            <span className="font-black text-2xl">{theme}</span>
            <span className={"px-6 py-3 rounded-full text-xl font-black shadow-lg " + badgeClass}>
              {sources.length} mentions
            </span>
          </div>
        </button>
        
        {isExpanded && (
          <div className="bg-white p-8 border-t-4">
            <div className="space-y-6">
              {sources.map((source, idx) => (
                <div key={idx} className="bg-gray-50 p-8 rounded-2xl shadow-lg border-2 border-gray-300 hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <span className="font-black text-2xl text-gray-900">{source.site}</span>
                      <span className="text-gray-700 text-xl ml-4 font-semibold">• Coach: {source.coach}</span>
                    </div>
                    <span className="text-lg text-gray-600 font-medium">{source.date}</span>
                  </div>
                  <p className="text-xl text-gray-800 italic leading-relaxed font-medium">"{source.text}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Visits</p>
              <p className="text-3xl font-bold text-gray-800">{displayData.totalVisits}</p>
            </div>
            <Calendar className="text-blue-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Coaches</p>
              <p className="text-3xl font-bold text-gray-800">{displayData.coaches.length}</p>
            </div>
            <Users className="text-green-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sites Visited</p>
              <p className="text-3xl font-bold text-gray-800">{displayData.sites.length}</p>
            </div>
            <MapPin className="text-purple-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Needs Attention</p>
              <p className="text-3xl font-bold text-red-600">
                {displayData.progress.find(p => p.name === 'Not implemented')?.value || 0}
              </p>
            </div>
            <AlertCircle className="text-red-500" size={32} />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Implementation Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={displayData.progress}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={entry => entry.name + ": " + entry.value}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {displayData.progress.map((entry, index) => (
                  <Cell key={"cell-" + index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Coaches by Visits</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={displayData.coaches.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={11} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="visits" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {displayData.progress.find(p => p.name === 'Not implemented')?.value > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow p-6">
          <div className="flex items-start">
            <AlertCircle className="text-red-500 mr-3 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Sites Needing Attention</h3>
              <p className="text-sm text-red-700">
                {displayData.progress.find(p => p.name === 'Not implemented')?.value || 0} visits marked as "Not Implemented"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const CoachViewTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Coach Activity Leaderboard</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rank</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Coach</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Visits</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Avg per Month</th>
              </tr>
            </thead>
            <tbody>
              {displayData.coaches.map((coach, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {idx === 0 && <Award className="text-yellow-500 inline" size={20} />}
                    {idx === 1 && <Award className="text-gray-400 inline" size={20} />}
                    {idx === 2 && <Award className="text-orange-600 inline" size={20} />}
                    {idx > 2 && <span className="text-gray-600">{idx + 1}</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 capitalize">{coach.name}</td>
                  <td className="px-4 py-3 text-gray-700">{coach.visits}</td>
                  <td className="px-4 py-3 text-gray-700">{(coach.visits / 2).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Coach Performance Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={displayData.coaches}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} fontSize={11} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="visits" fill="#6366f1" name="Total Visits" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const SiteViewTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Most Visited Sites</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={displayData.sites.slice(0, 15)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={200} fontSize={11} />
            <Tooltip />
            <Bar dataKey="visits" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Site Visit Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Site Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Visits</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayData.sites.slice(0, 20).map((site, idx) => {
                const statusClass = site.visits >= 4 ? 'bg-green-100 text-green-800' : (site.visits >= 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800');
                const statusText = site.visits >= 4 ? 'Well Monitored' : (site.visits >= 2 ? 'Regular' : 'Needs Attention');
                
                return (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{site.name}</td>
                    <td className="px-4 py-3 text-gray-700">{site.visits}</td>
                    <td className="px-4 py-3">
                      <span className={"px-3 py-1 rounded-full text-xs font-medium " + statusClass}>
                        {statusText}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const InsightsTab = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">Common Strengths</h3>
          <div className="space-y-2">
            {displayData.strengthThemes.slice(0, 6).map((theme, idx) => (
              <ThemeDrillDown 
                key={idx} 
                theme={theme.theme} 
                sources={theme.sources}
                type="strength"
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-orange-800 mb-4">Common Improvement Areas</h3>
          <div className="space-y-2">
            {displayData.improvementThemes.slice(0, 6).map((theme, idx) => (
              <ThemeDrillDown 
                key={idx} 
                theme={theme.theme} 
                sources={theme.sources}
                type="improvement"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Theme Analysis Comparison</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={[...displayData.strengthThemes.slice(0, 5), ...displayData.improvementThemes.slice(0, 5)]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="theme" angle={-45} textAnchor="end" height={120} fontSize={10} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-blue-50 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">Key Insights</h3>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start">
            <TrendingUp className="text-blue-600 mr-2 flex-shrink-0 mt-1" size={20} />
            <span><strong>Top Strength:</strong> {displayData.strengthThemes[0]?.theme} ({displayData.strengthThemes[0]?.count} mentions)</span>
          </li>
          <li className="flex items-start">
            <AlertCircle className="text-blue-600 mr-2 flex-shrink-0 mt-1" size={20} />
            <span><strong>Top Challenge:</strong> {displayData.improvementThemes[0]?.theme} ({displayData.improvementThemes[0]?.count} mentions)</span>
          </li>
          <li className="flex items-start">
            <Users className="text-blue-600 mr-2 flex-shrink-0 mt-1" size={20} />
            <span><strong>Total Visits:</strong> {displayData.totalVisits} coaching sessions analyzed</span>
          </li>
          <li className="flex items-start">
            <MapPin className="text-blue-600 mr-2 flex-shrink-0 mt-1" size={20} />
            <span><strong>Sites Covered:</strong> {displayData.sites.length} unique locations</span>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-3">Coaching Dashboard</h1>
          <p className="text-xl text-gray-600">2025-26 EXLP Coaching Log Analytics</p>
        </header>

        <FilterBar />

        <div className="bg-white rounded-lg shadow mb-6 max-w-4xl mx-auto">
          <nav className="flex justify-center space-x-2 p-3">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'coaches', label: 'Coach View' },
              { id: 'sites', label: 'Site View' },
              { id: 'insights', label: 'Insights' }
            ].map(tab => {
              const activeClass = "bg-blue-600 text-white";
              const inactiveClass = "text-gray-600 hover:bg-gray-100";
              const buttonClass = activeTab === tab.id ? activeClass : inactiveClass;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={"px-8 py-4 rounded-xl font-bold text-lg transition-colors " + buttonClass}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'coaches' && <CoachViewTab />}
          {activeTab === 'sites' && <SiteViewTab />}
          {activeTab === 'insights' && <InsightsTab />}
        </div>
      </div>
    </div>
  );
};

export default CoachingDashboard;
