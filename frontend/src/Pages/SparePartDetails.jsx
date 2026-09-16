import { useEffect, useState } from "react";
import { API_URL } from "../config";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";


function SparePartDetails() {
  const { sparePartId } = useParams();
  const navigate = useNavigate();
  const { accessToken, hasPermission, isAuthenticated } = useAuth();
  const [part, setPart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    fetch(`${API_URL}/spare-parts/${sparePartId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Failed to load spare part: ${response.status} ${await response.text()}`);
        return response.json();
      })
      .then(setPart)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [accessToken, isAuthenticated, sparePartId]);

  if (!isAuthenticated) return <div className="page-container"><div className="empty-state"><strong>Authentication required</strong><p>Please login first.</p></div></div>;
  if (!hasPermission("view_spare")) return <div className="page-container"><div className="empty-state"><strong>Access denied</strong><p>You do not have permission to view spare parts.</p></div></div>;
  if (loading) return <div className="page-container"><div className="loading-state">Loading spare part...</div></div>;

  return (
    <div className="page-container spare-details-page">
      <style>{`
        .spare-details-page .detail-header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:22px}
        .spare-details-page .detail-title{display:flex;gap:14px;align-items:center}
        .spare-details-page .detail-icon{width:48px;height:48px;border-radius:13px;display:grid;place-items:center;background:#eef2ff;color:#4f46e5;font-weight:900;font-size:12px}
        .spare-details-page h2{margin:0;color:#172033;font-size:28px}.spare-details-page .eyebrow{display:block;color:#64748b;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
        .spare-details-page .detail-subtitle{margin:7px 0 0;color:#64748b}
        .spare-details-page .detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
        .spare-details-page .detail-card{background:#fff;border:1px solid #e5e7eb;border-radius:17px;padding:21px;box-shadow:0 7px 24px rgba(15,23,42,.045)}
        .spare-details-page .detail-card h3{margin:0 0 16px;color:#172033;font-size:17px}.spare-details-page .field{padding:12px 0;border-top:1px solid #eef2f6}.spare-details-page .field:first-of-type{border-top:0;padding-top:0}.spare-details-page .field-label{display:block;color:#94a3b8;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}.spare-details-page .field-value{color:#334155;font-weight:600}.spare-details-page .description{line-height:1.6;font-weight:400}.spare-details-page .active{color:#15803d}.spare-details-page .inactive{color:#dc2626}
        @media(max-width:700px){.spare-details-page .detail-header{flex-direction:column}.spare-details-page .detail-grid{grid-template-columns:1fr}.spare-details-page h2{font-size:23px}}
      `}</style>
      <div className="detail-header">
        <div>
          <div className="detail-title"><span className="detail-icon">SP</span><div><span className="eyebrow">Spare Parts</span><h2>{part?.name || "Spare Part"}</h2><p className="detail-subtitle">{part?.part_code || "—"}</p></div></div>
        </div>
        <div className="action-buttons">
          <button type="button" className="secondary-button" onClick={() => navigate("/spare-parts")}>← Back to Spare Parts</button>
          {hasPermission("update_spare") && <button type="button" className="primary-button" onClick={() => navigate(`/spare-parts/${part.id}/edit`)}>Edit</button>}
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      {part && <div className="detail-grid">
        <section className="detail-card"><h3>Part Information</h3>
          <div className="field"><span className="field-label">Part Code</span><span className="field-value">{part.part_code}</span></div>
          <div className="field"><span className="field-label">Name</span><span className="field-value">{part.name}</span></div>
          <div className="field"><span className="field-label">Category</span><span className="field-value">{part.category || "—"}</span></div>
          <div className="field"><span className="field-label">Manufacturer</span><span className="field-value">{part.manufacturer || "—"}</span></div>
          <div className="field"><span className="field-label">Description</span><span className="field-value description">{part.description || "No description provided."}</span></div>
        </section>
        <section className="detail-card"><h3>Inventory Settings</h3>
          <div className="field"><span className="field-label">Unit</span><span className="field-value">{part.unit || "—"}</span></div>
          <div className="field"><span className="field-label">Minimum Stock</span><span className="field-value">{part.minimum_stock ?? "—"}</span></div>
          <div className="field"><span className="field-label">Status</span><span className={`field-value ${part.is_active ? "active" : "inactive"}`}>{part.is_active ? "Active" : "Inactive"}</span></div>
        </section>
      </div>}
    </div>
  );
}
export default SparePartDetails;



