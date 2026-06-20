import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import { CATEGORY_LABELS } from '../../utils/constants';

const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899'];

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics')
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><p style={{ color: 'var(--muted)' }}>Loading...</p></Layout>;
  if (!data) return <Layout><div className="empty">Failed to load analytics.</div></Layout>;

  const outcomeData = Object.entries(data.outcomeCount).map(([name, value]) => ({ name, value }));
  const categoryData = Object.entries(data.categoryViolationCount).map(([key, value]) => ({
    name: CATEGORY_LABELS[key] || key,
    value,
  }));
  const appealData = [
    { name: 'Pending', value: data.appealStats.pending },
    { name: 'Accepted', value: data.appealStats.accepted },
    { name: 'Rejected', value: data.appealStats.rejected },
  ];

  return (
    <Layout>
      <div className="page-header">
        <h2>Analytics Dashboard</h2>
        <p>Platform moderation statistics.</p>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-value">{data.totalSubmissions}</div>
          <div className="stat-label">Total Submissions</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{data.totalImages}</div>
          <div className="stat-label">Total Images</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{data.appealStats.total}</div>
          <div className="stat-label">Total Appeals</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Verdict Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={outcomeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {outcomeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Appeal Status</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={appealData}>
              <XAxis dataKey="name" tick={{ fill: '#8b92a8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#8b92a8', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {categoryData.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">Violations by Category</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} layout="vertical">
              <XAxis type="number" tick={{ fill: '#8b92a8', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={160} tick={{ fill: '#8b92a8', fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.rankedUsers?.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">Top Users by Submissions</div>
          <table className="verdict-table">
            <thead>
              <tr><th>User</th><th>Email</th><th>Submissions</th></tr>
            </thead>
            <tbody>
              {data.rankedUsers.map((entry, i) => (
                <tr key={i}>
                  <td>{entry.user.name}</td>
                  <td>{entry.user.email}</td>
                  <td>{entry.submissionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
