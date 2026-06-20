import { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import VerdictBadge from '../components/VerdictBadge';
import VerdictBreakdown from '../components/VerdictBreakdown';
import AppealModal from '../components/AppealModal';
import { CATEGORIES, CATEGORY_LABELS, OUTCOMES } from '../utils/constants';

export default function History() {
  const [submissions, setSubmissions] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ outcome: '', category: '', startDate: '', endDate: '' });
  const [appealTarget, setAppealTarget] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.outcome) params.outcome = filters.outcome;
      if (filters.category) params.category = filters.category;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const [subsRes, appealsRes] = await Promise.all([
        api.get('/submissions', { params }),
        api.get('/appeals/my'),
      ]);
      setSubmissions(subsRes.data);
      setAppeals(appealsRes.data);
    } catch {
      setSubmissions([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchData();
  };

  const getAppealStatus = (submissionId, imageIndex) => {
    const appeal = appeals.find(
      (a) => String(a.submission?._id || a.submission) === String(submissionId) && a.imageIndex === imageIndex
    );
    return appeal?.status || null;
  };

  return (
    <Layout>
      <div className="page-header">
        <h2>Submission History</h2>
        <p>View past submissions, filter results, and file appeals.</p>
      </div>

      <form className="filters card" onSubmit={handleFilter}>
        <div className="form-group">
          <label>Outcome</label>
          <select value={filters.outcome} onChange={(e) => setFilters({ ...filters, outcome: e.target.value })}>
            <option value="">All</option>
            {OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Category</label>
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>From</label>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
        </div>
        <div className="form-group">
          <label>To</label>
          <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
        </div>
        <button type="submit" className="btn btn-primary">Filter</button>
      </form>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      ) : submissions.length === 0 ? (
        <div className="empty">No submissions found.</div>
      ) : (
        submissions.map((sub) => (
          <div key={sub._id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                {new Date(sub.createdAt).toLocaleString()} · {sub.images.length} image(s)
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setExpanded(expanded === sub._id ? null : sub._id)}
              >
                {expanded === sub._id ? 'Collapse' : 'Details'}
              </button>
            </div>

            {sub.images.map((img, idx) => {
              const appealStatus = getAppealStatus(sub._id, idx);
              return (
                <div key={idx} style={{ marginTop: 12, padding: '12px 0', borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{img.filename}</strong>
                    <VerdictBadge outcome={img.outcome} />
                    {appealStatus && <span className={`badge badge-${appealStatus}`}>appeal: {appealStatus}</span>}
                    {img.outcome !== 'approved' && !appealStatus && (
                      <button className="btn btn-secondary btn-sm" onClick={() => setAppealTarget({ submissionId: sub._id, imageIndex: idx, filename: img.filename })}>
                        Appeal
                      </button>
                    )}
                  </div>
                  {expanded === sub._id && <div style={{ marginTop: 10 }}><VerdictBreakdown details={img.verdictDetails} /></div>}
                </div>
              );
            })}
          </div>
        ))
      )}

      {appealTarget && (
        <AppealModal
          {...appealTarget}
          onClose={() => setAppealTarget(null)}
          onSuccess={fetchData}
        />
      )}
    </Layout>
  );
}
