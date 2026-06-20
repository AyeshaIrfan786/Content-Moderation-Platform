import { useState } from 'react';
import api from '../api/axios';

export default function AppealModal({ submissionId, imageIndex, filename, onClose, onSuccess }) {
  const [justification, setJustification] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!justification.trim()) { setError('Please provide a justification'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/appeals', { submissionId, imageIndex, justification });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit appeal');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Appeal Verdict</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 12 }}>
          Image: {filename}
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Why should this verdict be overturned?</label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain your reasoning..."
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Appeal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
