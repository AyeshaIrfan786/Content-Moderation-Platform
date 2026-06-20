import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import VerdictBadge from '../../components/VerdictBadge';

export default function AdminAppeals() {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);
  const [response, setResponse] = useState('');

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appeals');
      setAppeals(res.data);
    } catch {
      setAppeals([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAppeals(); }, []);

  const handleResolve = async (id, decision) => {
    try {
      await api.patch(`/appeals/${id}`, { decision, adminResponse: response });
      setResolving(null);
      setResponse('');
      fetchAppeals();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve appeal');
    }
  };

  const pending = appeals.filter((a) => a.status === 'pending');
  const resolved = appeals.filter((a) => a.status !== 'pending');

  return (
    <Layout>
      <div className="page-header">
        <h2>Appeals Queue</h2>
        <p>{pending.length} pending · {resolved.length} resolved</p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      ) : appeals.length === 0 ? (
        <div className="empty">No appeals yet.</div>
      ) : (
        <>
          {pending.map((appeal) => (
            <div key={appeal._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <strong>{appeal.user?.name}</strong>
                  <span style={{ color: 'var(--muted)', marginLeft: 8, fontSize: '0.85rem' }}>{appeal.user?.email}</span>
                  <p style={{ marginTop: 6, fontSize: '0.9rem' }}>
                    Image: {appeal.submission?.images?.[appeal.imageIndex]?.filename}
                    {' '}
                    <VerdictBadge outcome={appeal.submission?.images?.[appeal.imageIndex]?.outcome} />
                  </p>
                  <p style={{ marginTop: 6, fontSize: '0.9rem', color: 'var(--muted)' }}>
                    "{appeal.justification}"
                  </p>
                  <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                    {new Date(appeal.createdAt).toLocaleString()}
                  </span>
                </div>
                <span className="badge badge-pending">pending</span>
              </div>

              {resolving === appeal._id ? (
                <div style={{ marginTop: 14 }}>
                  <div className="form-group">
                    <label>Admin Response (optional)</label>
                    <textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Response to user..." />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-success btn-sm" onClick={() => handleResolve(appeal._id, 'accepted')}>Accept</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleResolve(appeal._id, 'rejected')}>Reject</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setResolving(null); setResponse(''); }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setResolving(appeal._id)}>
                  Review
                </button>
              )}
            </div>
          ))}

          {resolved.length > 0 && (
            <>
              <h3 style={{ margin: '24px 0 12px', color: 'var(--muted)', fontSize: '0.9rem' }}>Resolved</h3>
              {resolved.map((appeal) => (
                <div key={appeal._id} className="card" style={{ opacity: 0.7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{appeal.user?.name} — {appeal.submission?.images?.[appeal.imageIndex]?.filename}</span>
                    <span className={`badge badge-${appeal.status}`}>{appeal.status}</span>
                  </div>
                  {appeal.adminResponse && (
                    <p style={{ marginTop: 6, fontSize: '0.85rem', color: 'var(--muted)' }}>Response: {appeal.adminResponse}</p>
                  )}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </Layout>
  );
}
