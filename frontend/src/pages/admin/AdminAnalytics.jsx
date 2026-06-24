import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import { CATEGORY_LABELS } from '../../utils/constants';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const OUTCOME_COLORS = { approved: '#22c55e', flagged: '#eab308', blocked: '#ef4444' };

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/analytics');
        setData(res.data);
      } catch {
        setData(null);
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Layout>
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="empty">Could not load analytics.</div>
      </Layout>
    );
  }

  const outcomeData = Object.entries(data.outcomeCount).map(([outcome, count]) => ({
    name: outcome,
    value: count,
  }));

  const categoryData = Object.entries(data.categoryViolationCount).map(([category, count]) => ({
    name: CATEGORY_LABELS[category] || category,
    violations: count,
  }));

  return (
    <Layout>
      <div className="page-header">
        <h2>Analytics Dashboard</h2>
        <p>Platform-wide moderation activity overview.</p>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="card">
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Total Submissions</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600 }}>{data.totalSubmissions}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Total Images Screened</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600 }}>{data.totalImages}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Pending Appeals</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600 }}>{data.appealStats.pending}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Appeals Resolved</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600 }}>
            {data.appealStats.accepted + data.appealStats.rejected}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Submission Volume Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data.submissionsOverTime}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Verdict Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={outcomeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
              {outcomeData.map((entry) => (
                <Cell key={entry.name} fill={OUTCOME_COLORS[entry.name] || '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Violations by Category</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} interval={0} fontSize={12} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="violations" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Appeal Outcomes</h3>
        <p style={{ fontSize: '0.9rem' }}>
          {data.appealStats.total} total · {data.appealStats.accepted} accepted ·{' '}
          {data.appealStats.rejected} rejected · {data.appealStats.pending} pending
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Top Users — by Submission Count</h3>
          {data.rankedUsersBySubmissions.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No data yet.</p>
          ) : (
            <table className="verdict-table">
              <thead><tr><th>User</th><th>Submissions</th></tr></thead>
              <tbody>
                {data.rankedUsersBySubmissions.map((r) => (
                  <tr key={r.user._id}>
                    <td>{r.user.name}</td>
                    <td>{r.submissionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Top Users — by Violation Count</h3>
          {data.rankedUsersByViolations.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No violations yet.</p>
          ) : (
            <table className="verdict-table">
              <thead><tr><th>User</th><th>Violations</th></tr></thead>
              <tbody>
                {data.rankedUsersByViolations.map((r) => (
                  <tr key={r.user._id}>
                    <td>{r.user.name}</td>
                    <td>{r.violationCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
