import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import VerdictBadge from '../../components/VerdictBadge';
import VerdictBreakdown from '../../components/VerdictBreakdown';
import { OUTCOMES } from '../../utils/constants';

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [overriding, setOverriding] = useState(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/submissions');
      setSubmissions(res.data);
    } catch {
      setSubmissions([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const handleOverride = async (submissionId, imageIndex, newOutcome) => {
    setOverriding(`${submissionId}-${imageIndex}`);
    try {
      await api.patch('/admin/submissions/override', { submissionId, imageIndex, newOutcome });
      fetchSubmissions();
    } catch (err) {
      alert(err.response?.data?.message || 'Override failed');
    }
    setOverriding(null);
  };

  return (
    <Layout>
      <div className="page-header">
        <h2>All Submissions</h2>
        <p>Review and manually override verdicts.</p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      ) : submissions.length === 0 ? (
        <div className="empty">No submissions yet.</div>
      ) : (
        submissions.map((sub) => (
          <div key={sub._id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong>{sub.user?.name}</strong>
                <span style={{ color: 'var(--muted)', marginLeft: 8, fontSize: '0.85rem' }}>{sub.user?.email}</span>
              </div>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                {new Date(sub.createdAt).toLocaleString()}
              </span>
            </div>

            {sub.images.map((img, idx) => (
              <div key={idx} style={{ marginTop: 12, padding: '12px 0', borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{img.filename}</strong>
                  <VerdictBadge outcome={img.outcome} />
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setExpanded(expanded === `${sub._id}-${idx}` ? null : `${sub._id}-${idx}`)}
                  >
                    Details
                  </button>
                  {OUTCOMES.filter((o) => o !== img.outcome).map((o) => (
                    <button
                      key={o}
                      className="btn btn-sm btn-secondary"
                      disabled={overriding === `${sub._id}-${idx}`}
                      onClick={() => handleOverride(sub._id, idx, o)}
                    >
                      → {o}
                    </button>
                  ))}
                </div>
                {expanded === `${sub._id}-${idx}` && (
                  <div style={{ marginTop: 10 }}><VerdictBreakdown details={img.verdictDetails} /></div>
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </Layout>
  );
}
