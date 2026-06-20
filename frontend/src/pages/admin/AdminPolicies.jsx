import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import { CATEGORY_LABELS } from '../../utils/constants';

export default function AdminPolicies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/policies');
      setPolicies(res.data);
    } catch {
      setPolicies([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPolicies(); }, []);

  const updateLocal = (category, field, value) => {
    setPolicies((prev) =>
      prev.map((p) => (p.category === category ? { ...p, [field]: value } : p))
    );
  };

  const savePolicy = async (policy) => {
    setSaving(policy.category);
    try {
      const res = await api.put(`/admin/policies/${policy.category}`, {
        enabled: policy.enabled,
        threshold: policy.threshold,
        enforcement: policy.enforcement,
      });
      setPolicies((prev) => prev.map((p) => (p.category === policy.category ? res.data : p)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    }
    setSaving(null);
  };

  return (
    <Layout>
      <div className="page-header">
        <h2>Policy Configuration</h2>
        <p>Configure moderation rules per category.</p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      ) : (
        <div className="card">
          {policies.map((policy) => (
            <div key={policy.category} className="policy-row">
              <div className="policy-name">{CATEGORY_LABELS[policy.category] || policy.category}</div>

              <label className="toggle" title="Enabled">
                <input
                  type="checkbox"
                  checked={policy.enabled}
                  onChange={(e) => updateLocal(policy.category, 'enabled', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>

              <div className="slider-group">
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Threshold</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={policy.threshold}
                  onChange={(e) => updateLocal(policy.category, 'threshold', Number(e.target.value))}
                />
                <span style={{ fontSize: '0.85rem', minWidth: 36 }}>{policy.threshold}%</span>
              </div>

              <select
                value={policy.enforcement}
                onChange={(e) => updateLocal(policy.category, 'enforcement', e.target.value)}
                style={{ width: 'auto', minWidth: 140 }}
              >
                <option value="flag_review">Flag for Review</option>
                <option value="auto_block">Auto Block</option>
              </select>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => savePolicy(policy)}
                disabled={saving === policy.category}
              >
                {saving === policy.category ? 'Saving...' : 'Save'}
              </button>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
