import { useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import VerdictBadge from '../components/VerdictBadge';
import VerdictBreakdown from '../components/VerdictBreakdown';

export default function Submit() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const handleFiles = (e) => {
    const f = Array.from(e.target.files || []).slice(0, 6);
    setFiles(f);
    setPreviews(f.map((file) => URL.createObjectURL(file)));
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;
    const form = new FormData();
    files.forEach((f) => form.append('images', f));
    setUploading(true);
    setProgress(0);
    try {
      const res = await api.post('/submissions', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.response?.data?.message || 'Upload failed' });
    }
    setUploading(false);
  };

  return (
    <Layout>
      <div className="page-header">
        <h2>Submit Images</h2>
        <p>Upload up to 6 images for AI moderation screening.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Images</label>
            <input type="file" accept="image/*" multiple onChange={handleFiles} />
          </div>

          {previews.length > 0 && (
            <div className="img-grid">
              {previews.map((src, i) => (
                <img key={i} src={src} alt={`preview-${i}`} className="img-preview" />
              ))}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={uploading || files.length === 0} style={{ marginTop: 16 }}>
            {uploading ? `Uploading ${progress}%` : 'Upload & Screen'}
          </button>

          {uploading && (
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          )}
        </form>
      </div>

      {result && (
        <div style={{ marginTop: 20 }}>
          {result.error ? (
            <div className="alert alert-error">{result.error}</div>
          ) : (
            <>
              <div className="alert alert-success">Screening complete — {result.images?.length} image(s) analyzed.</div>
              {result.images?.map((img, i) => (
                <div key={i} className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <strong>{img.filename}</strong>
                    <VerdictBadge outcome={img.outcome} />
                  </div>
                  <VerdictBreakdown details={img.verdictDetails} />
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </Layout>
  );
}
