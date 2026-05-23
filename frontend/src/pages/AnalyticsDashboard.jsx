import { useState, useEffect } from 'react';
import analyticsService from '../services/analytics.service';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const AnalyticsDashboard = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await analyticsService.getAiStats();
        setData(stats);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard-container fade-in">
      <div className="dashboard-header">
        <h1>Analytics Dashboard</h1>
      </div>
      
      <div className="glass-panel" style={{ padding: '2rem', height: '400px' }}>
        <h3 style={{ marginBottom: '1rem' }}>AI Suggestions by Type</h3>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="type" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No data available to display.</p>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;