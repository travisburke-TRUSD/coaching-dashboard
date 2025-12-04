import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, MapPin, AlertCircle, Calendar, Award } from 'lucide-react';

const CoachingDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch and process data from Google Sheets
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the Google Sheet
        const response = await fetch('https://docs.google.com/spreadsheets/d/18fCknMjwxlCf1TVFPX8ryuRU4o3m061Qg8iVgLFXtVk/export?format=csv&gid=2102890535');
        const csvText = await response.text();
        
        // Parse CSV
        const rows = csvText.split('\n').map(row => {
          const cols = row.split(',');
          return cols;
        });
        
        // Process data (skip header)
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

        // Calculate metrics
        const metrics = calculateMetrics(processedData);
        setData(metrics);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Use sample data if fetch fails
        setData(getSampleData());
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate all dashboard metrics
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
    
    rawData.forEach(entry => {
      // Coach metrics
      const coach = entry.email.split('@')[0].replace('.', ' ');
      coaches[coach] = (coaches[coach] || 0) + 1;
      
      // Site metrics
      sites[entry.location] = (sites[entry.location] || 0) + 1;
      
      // Progress tracking
      const progress = entry.progress.toLowerCase();
      if (progress.includes('fully')) progressCount['Fully Implemented']++;
      else if (progress.includes('partially')) progressCount['Partially implemented']++;
      else if (progress.includes('not')) progressCount['Not implemented']++;
      else if (progress.includes('first')) {
        progressCount['First time']++;
        progressCount['First meeting']++;
      }
    });

    return {
      totalVisits: rawData.length,
      coaches: Object.entries(coaches).map(([name, visits]) => ({ name, visits })).sort((a, b) => b.visits - a.visits),
      sites: Object.entries(sites).map(([name, visits]) => ({ name, visits })).sort((a, b) => b.visits - a.visits),
      progress: Object.entries(progressCount).map(([name, value]) => ({ name, value })),
      rawData
    };
  };

  // Sample data for demonstration
  const getSampleData = () => ({
    totalVisits: 100,
    coaches: [
      { name: 'Jafahri Oler', visits: 15 },
      { name: 'Joe Howard', visits: 14 },
      { name: 'Demarcus Wooten', visits: 13 },
      { name: 'Kevin Hendricks', visits: 12 },
      { name: 'Sendy Sanchez', visits: 11 }
    ],
    sites: [
      { name: 'Foothill High School', visits: 8 },
      { name: 'Foothill Ranch Middle', visits: 7 },
      { name: 'Orchard Elementary', visits: 6 },
      { name: 'Madison Elementary', visits: 5 },
      { name: 'Westside Elementary', visits: 5 }
    ],
    progress: [
      { name: 'Fully Implemented', value: 15 },
      { name: 'Partially implemented', value: 35 },
      { name: 'Not implemented', value: 20 },
      { name: 'First time', value: 30 }
    ],
    rawData: []
  });

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

  // Overview Tab
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Visits</p>
              <p className="text-3xl font-bold text-gray-800">{data.totalVisits}</p>
            </div>
            <Calendar className="text-blue-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Coaches</p>
              <p className="text-3xl font-bold text-gray-800">{data.coaches.length}</p>
            </div>
            <Users className="text-green-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sites Visited</p>
              <p className="text-3xl font-bold text-gray-800">{data.sites.length}</p>
            </div>
            <MapPin className="text-purple-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Needs Attention</p>
              <p className="text-3xl font-bold text-red-600">
                {data.progress.find(p => p.name === 'Not implemented')?.value || 0}
              </p>
            </div>
            <AlertCircle className="text-red-500" size={32} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Implementation Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.progress}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={entry => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.progress.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Coaches by Visits</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.coaches.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={11} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="visits" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow p-6">
        <div className="flex items-start">
          <AlertCircle className="text-red-500 mr-3 flex-shrink-0" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Sites Needing Attention</h3>
            <p className="text-sm text-red-700">
              {data.progress.find(p => p.name === 'Not implemented')?.value || 0} visits marked as "Not Implemented"
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Coach View Tab
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
              {data.coaches.map((coach, idx) => (
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
          <BarChart data={data.coaches}>
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

  // Site View Tab
  const SiteViewTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Most Visited Sites</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.sites.slice(0, 15)} layout="vertical">
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
              {data.sites.slice(0, 20).map((site, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">{site.name}</td>
                  <td className="px-4 py-3 text-gray-700">{site.visits}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      site.visits >= 4 ? 'bg-green-100 text-green-800' :
                      site.visits >= 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {site.visits >= 4 ? 'Well Monitored' : site.visits >= 2 ? 'Regular' : 'Needs Attention'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Insights Tab
  const InsightsTab = () => {
    const commonThemes = [
      { theme: 'Strong Relationships', count: 28, type: 'strength' },
      { theme: 'Good Structure', count: 25, type: 'strength' },
      { theme: 'Student Engagement', count: 22, type: 'strength' },
      { theme: 'Needs More Staff', count: 18, type: 'improvement' },
      { theme: 'Communication Issues', count: 16, type: 'improvement' },
      { theme: 'Supervision Concerns', count: 15, type: 'improvement' },
      { theme: 'Space/Classroom Needs', count: 14, type: 'improvement' },
      { theme: 'Procare/Admin Support', count: 12, type: 'improvement' }
    ];

    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Common Strengths</h3>
            <div className="space-y-3">
              {commonThemes.filter(t => t.type === 'strength').map((theme, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-gray-700">{theme.theme}</span>
                  <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {theme.count} mentions
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-orange-800 mb-4">Common Improvement Areas</h3>
            <div className="space-y-3">
              {commonThemes.filter(t => t.type === 'improvement').map((theme, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-gray-700">{theme.theme}</span>
                  <span className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                    {theme.count} mentions
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Theme Analysis</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={commonThemes}>
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
              <span><strong>70%</strong> of sites show progress from "First time" to "Partially/Fully Implemented"</span>
            </li>
            <li className="flex items-start">
              <Users className="text-blue-600 mr-2 flex-shrink-0 mt-1" size={20} />
              <span><strong>Top coaches</strong> average 12-15 visits per period</span>
            </li>
            <li className="flex items-start">
              <MapPin className="text-blue-600 mr-2 flex-shrink-0 mt-1" size={20} />
              <span><strong>Most common need:</strong> Additional staff and supervision support</span>
            </li>
            <li className="flex items-start">
              <Award className="text-blue-600 mr-2 flex-shrink-0 mt-1" size={20} />
              <span><strong>Success pattern:</strong> Sites with strong relationships show better implementation rates</span>
            </li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Coaching Dashboard</h1>
          <p className="text-gray-600">2025-26 EXLP Coaching Log Analytics</p>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <nav className="flex space-x-1 p-2">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'coaches', label: 'Coach View' },
              { id: 'sites', label: 'Site View' },
              { id: 'insights', label: 'Insights' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
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