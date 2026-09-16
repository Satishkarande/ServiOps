import { useEffect, useState } from "react";
import { API_URL } from "../config";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const emptyForm = { part_code: "", name: "", description: "", manufacturer: "", category: "", unit: "PCS", minimum_stock: "0" };

function SparePartForm() {
  const { accessToken, hasPermission, isAuthenticated } = useAuth();
  const { sparePartId } = useParams(); const navigate = useNavigate(); const isEdit = Boolean(sparePartId);
  const [formData, setFormData] = useState(emptyForm); const [loading, setLoading] = useState(isEdit); const [saving, setSaving] = useState(false); const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit || !accessToken) return;
    fetch(`${API_URL}/spare-parts/${sparePartId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(async (response) => { if (!response.ok) throw new Error(`Failed to load spare part: ${response.status} ${await response.text()}`); return response.json(); })
      .then((part) => setFormData({ part_code: part.part_code, name: part.name, description: part.description || "", manufacturer: part.manufacturer || "", category: part.category || "", unit: part.unit, minimum_stock: String(part.minimum_stock) }))
      .catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [accessToken, isEdit, sparePartId]);

  const submit = async (event) => {
    event.preventDefault(); setError("");
    const minimumStock = Number(formData.minimum_stock);
    if (!formData.name.trim() || (!isEdit && !formData.part_code.trim())) { setError("Part code and name are required."); return; }
    if (!Number.isInteger(minimumStock) || minimumStock < 0) { setError("Minimum stock must be a whole number of zero or greater."); return; }
    const shared = { name: formData.name.trim(), description: formData.description.trim() || null, manufacturer: formData.manufacturer.trim() || null, category: formData.category.trim() || null, unit: formData.unit.trim().toUpperCase(), minimum_stock: minimumStock };
    const payload = isEdit ? shared : { part_code: formData.part_code.trim(), ...shared };
    setSaving(true);
    try {
      const response = await fetch(isEdit ? `${API_URL}/spare-parts/${sparePartId}` : `${API_URL}/spare-parts/`, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`Failed to ${isEdit ? "update" : "create"} spare part: ${response.status} ${await response.text()}`);
      navigate("/spare-parts");
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const allowed = isEdit ? hasPermission("update_spare") : hasPermission("create_spare");
  if (!isAuthenticated) return <div className="spare-form-page"><div className="spare-state-card">Please log in to manage spare parts.</div></div>;
  if (!allowed) return <div className="spare-form-page"><div className="spare-state-card">You do not have permission to {isEdit ? "update" : "create"} spare parts.</div></div>;
  if (loading) return <div className="spare-form-page"><div className="spare-state-card">Loading spare part…</div></div>;

  return <div className="spare-form-page"><style>{`
    .spare-form-page{max-width:1100px;margin:0 auto;padding:28px 24px 48px;color:#172033}.spare-form-page *{box-sizing:border-box}.spare-form-hero{display:flex;align-items:center;gap:16px;margin-bottom:24px}.spare-form-icon{width:48px;height:48px;border-radius:14px;background:#eef4ff;color:#3157b7;display:grid;place-items:center;font-size:22px;font-weight:800}.spare-form-hero h2{margin:0;font-size:28px}.spare-form-hero p{margin:5px 0 0;color:#6b7280}.spare-form-alert{margin-bottom:18px;padding:13px 15px;border:1px solid #fecaca;background:#fff5f5;color:#b42318;border-radius:12px}.spare-form-card{background:#fff;border:1px solid #e5e9f0;border-radius:18px;box-shadow:0 8px 28px rgba(31,41,55,.06);overflow:hidden}.spare-form-section{padding:24px}.spare-form-section+ .spare-form-section{border-top:1px solid #edf0f4}.spare-form-section h3{margin:0;font-size:16px}.spare-form-section p{margin:5px 0 18px;color:#7b8494;font-size:13px}.spare-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.spare-field{display:flex;flex-direction:column;gap:7px}.spare-field.full{grid-column:1/-1}.spare-field label{font-size:13px;font-weight:700;color:#374151}.spare-field input,.spare-field textarea{width:100%;border:1px solid #d9dee8;border-radius:10px;padding:11px 12px;font:inherit;color:#172033;background:#fff;outline:none;transition:.18s}.spare-field textarea{min-height:110px;resize:vertical}.spare-field input:focus,.spare-field textarea:focus{border-color:#6b8fe8;box-shadow:0 0 0 3px rgba(107,143,232,.13)}.spare-field input:disabled{background:#f5f7fa;color:#667085}.spare-info{margin-top:18px;padding:13px 15px;border-radius:12px;background:#f7f9fc;border:1px solid #e8ecf2;color:#667085;font-size:13px}.spare-actions{display:flex;justify-content:flex-end;gap:10px;padding:18px 24px;background:#fafbfc;border-top:1px solid #edf0f4}.spare-actions button{border:0;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer}.spare-secondary{background:#eef1f5;color:#344054}.spare-primary{background:#3157b7;color:#fff}.spare-primary:disabled{opacity:.6;cursor:not-allowed}.spare-state-card{max-width:700px;margin:48px auto;padding:20px;border:1px solid #e5e9f0;border-radius:14px;background:#fff;box-shadow:0 8px 24px rgba(31,41,55,.05)}@media(max-width:700px){.spare-form-page{padding:20px 14px 36px}.spare-form-grid{grid-template-columns:1fr}.spare-field.full{grid-column:auto}.spare-actions{flex-direction:column}.spare-actions button{width:100%}}
  `}</style><div className="spare-form-hero"><div className="spare-form-icon">▣</div><div><h2>{isEdit ? "Edit Spare Part" : "Add Spare Part"}</h2><p>{isEdit ? "Update the catalog details for this part." : "Create a new catalog item for inventory tracking."}</p></div></div>{error && <div className="spare-form-alert">{error}</div>}<form className="spare-form-card" onSubmit={submit}><div className="spare-form-section"><h3>Part Details</h3><p>Keep the catalog information clear and consistent for inventory teams.</p><div className="spare-form-grid">{!isEdit && <div className="spare-field"><label htmlFor="part_code">Part code</label><input id="part_code" name="part_code" maxLength="50" value={formData.part_code} onChange={(e) => setFormData({ ...formData, part_code: e.target.value })} required /></div>}<div className="spare-field"><label htmlFor="name">Part name</label><input id="name" name="name" maxLength="200" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div><div className="spare-field"><label htmlFor="category">Category</label><input id="category" name="category" maxLength="100" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} /></div><div className="spare-field"><label htmlFor="manufacturer">Manufacturer</label><input id="manufacturer" name="manufacturer" maxLength="150" value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} /></div><div className="spare-field"><label htmlFor="unit">Unit</label><input id="unit" name="unit" maxLength="30" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} required /></div><div className="spare-field"><label htmlFor="minimum_stock">Minimum stock</label><input id="minimum_stock" name="minimum_stock" type="number" min="0" step="1" value={formData.minimum_stock} onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })} required /></div><div className="spare-field full"><label htmlFor="description">Description</label><textarea id="description" name="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div></div><div className="spare-info">Minimum stock is used by Inventory to identify parts that need attention.</div></div><div className="spare-actions"><button type="button" className="spare-secondary" onClick={() => navigate("/spare-parts")}>Cancel</button><button className="spare-primary" disabled={saving}>{saving ? "Saving…" : isEdit ? "Save Changes" : "Create Spare Part"}</button></div></form></div>;
}
export default SparePartForm;



