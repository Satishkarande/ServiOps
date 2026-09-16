import {
  useEffect,
  useState,
} from "react";

import { API_URL } from "../config";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useAuth,
} from "../auth/AuthContext";




function PermissionForm() {

  const navigate =
    useNavigate();

  const {
    permissionId,
  } = useParams();


  const isEditMode =
    Boolean(permissionId);


  const {
    accessToken,
    isAuthenticated,
  } = useAuth();


  // ============================================================
  // STATE
  // ============================================================

  const [loading, setLoading] =
    useState(
      isEditMode
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  const [formData, setFormData] =
    useState({

      name: "",

      description: "",

      is_active: true,

    });


  // ============================================================
  // API HELPER
  // ============================================================

  const apiRequest =
    async (
      endpoint,
      options = {}
    ) => {

      if (!accessToken) {

        throw new Error(
          "Authentication token is missing."
        );

      }


      const response =
        await fetch(
          `${API_URL}${endpoint}`,
          {
            ...options,

            headers: {

              ...(options.body
                ? {
                    "Content-Type":
                      "application/json",
                  }
                : {}),

              Authorization:
                `Bearer ${accessToken}`,

              ...(options.headers || {}),

            },

          }
        );


      if (!response.ok) {

        let message =
          `Request failed: ${response.status}`;


        try {

          const data =
            await response.json();


          if (
            data?.detail
          ) {

            message =
              typeof data.detail ===
              "string"
                ? data.detail
                : JSON.stringify(
                    data.detail
                  );

          }

        } catch {

          // Ignore parsing errors.

        }


        throw new Error(
          message
        );

      }


      return response.status === 204
        ? null
        : response.json();

    };


  // ============================================================
  // LOAD PERMISSION
  // ============================================================

  const fetchPermission =
    async () => {

      try {

        setLoading(true);

        setError("");


        const data =
          await apiRequest(
            `/permissions/${permissionId}`
          );


        setFormData({

          name:
            data.name || "",

          description:
            data.description || "",

          is_active:
            data.is_active !== false,

        });

      } catch (err) {

        console.error(err);

        setError(
          err.message
        );

      } finally {

        setLoading(false);

      }

    };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    if (!isEditMode) {

      setLoading(false);

      return;

    }


    if (
      !isAuthenticated ||
      !accessToken
    ) {

      setLoading(false);

      return;

    }


    fetchPermission();

  }, [
    permissionId,
    accessToken,
    isAuthenticated,
    isEditMode,
  ]);


  // ============================================================
  // INPUT CHANGE
  // ============================================================

  const handleChange =
    event => {

      const {
        name,
        value,
        type,
        checked,
      } = event.target;


      setFormData(
        previous => ({

          ...previous,

          [name]:
            type === "checkbox"
              ? checked
              : value,

        })
      );

    };


  // ============================================================
  // BACK
  // ============================================================

  const handleBack =
    () => {

      if (saving) {

        return;

      }


      navigate(
        "/permissions"
      );

    };


  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit =
    async event => {

      event.preventDefault();


      setError("");


      if (!accessToken) {

        setError(
          "You are not logged in."
        );

        return;

      }


      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

      if (
        !formData.name.trim()
      ) {

        setError(
          "Permission name is required."
        );

        return;

      }


      if (
        !formData.description.trim()
      ) {

        setError(
          "Permission description is required."
        );

        return;

      }


      // --------------------------------------------------------
      // PAYLOAD
      // --------------------------------------------------------

      const payload = {

        name:
          formData.name.trim(),

        description:
          formData.description.trim(),

      };


      if (isEditMode) {

        payload.is_active =
          formData.is_active;

      }


      // --------------------------------------------------------
      // SAVE
      // --------------------------------------------------------

      try {

        setSaving(true);


        if (isEditMode) {

          await apiRequest(
            `/permissions/${permissionId}`,
            {
              method:
                "PATCH",

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        } else {

          await apiRequest(
            "/permissions/",
            {
              method:
                "POST",

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        }


        navigate(
          "/permissions",
          {
            replace: true,
          }
        );

      } catch (err) {

        console.error(err);

        setError(
          err.message
        );

      } finally {

        setSaving(false);

      }

    };


  // ============================================================
  // AUTH
  // ============================================================

  if (!isAuthenticated) {

    return (

      <div className="page-container permission-form-page"><style>{`
.permissions-page,.permission-form-page{--admin-border:#e5e7eb;--admin-text:#172033;--admin-muted:#64748b}
.permissions-page .page-header,.permission-form-page .page-header{align-items:center;margin-bottom:24px}
.permissions-page .admin-page-title,.permission-form-page .admin-page-title{display:flex;gap:13px;align-items:center}
.permissions-page .admin-page-icon,.permission-form-page .admin-page-icon{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:#eef2ff;color:#4f46e5;font-size:13px;font-weight:800}
.permissions-page .admin-page-kicker,.permission-form-page .admin-page-kicker,.permissions-page .admin-card-kicker,.permission-form-page .admin-card-kicker{display:block;color:#64748b;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px}
.permissions-page .page-header h2,.permission-form-page .page-header h2{margin:0;color:var(--admin-text);font-size:28px;letter-spacing:-.02em}
.permissions-page .page-header p,.permission-form-page .page-header p{margin:7px 0 0;color:var(--admin-muted)}
.permissions-page .admin-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:22px}
.permissions-page .admin-summary-card{padding:18px 20px;border:1px solid var(--admin-border);border-radius:16px;background:#fff;box-shadow:0 5px 18px rgba(15,23,42,.04)}
.permissions-page .admin-summary-card span{display:block;color:var(--admin-muted);font-size:12px;font-weight:700;margin-bottom:8px}
.permissions-page .admin-summary-card strong{font-size:25px;color:var(--admin-text)}
.permissions-page .section-card,.permission-form-page .section-card{background:#fff;border:1px solid var(--admin-border);border-radius:18px;box-shadow:0 7px 24px rgba(15,23,42,.045);overflow:hidden}
.permissions-page .section-card-header,.permission-form-page .section-card-header{padding:21px 24px;border-bottom:1px solid #edf0f4;background:#fbfcfe}
.permissions-page .section-card-header h3,.permission-form-page .section-card-header h3{margin:2px 0 4px;color:var(--admin-text);font-size:18px}
.permissions-page .section-card-header p,.permission-form-page .section-card-header p{margin:0;color:var(--admin-muted);font-size:13px}
.permissions-page .admin-data-table th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;background:#f8fafc}
.permissions-page .admin-data-table td{padding:15px 16px;vertical-align:middle}
.permissions-page .row-number{display:inline-grid;place-items:center;min-width:28px;height:28px;border-radius:9px;background:#f1f5f9;color:#64748b;font-size:12px;font-weight:800}
.permissions-page .admin-name-cell{display:flex;align-items:center;gap:11px}
.permissions-page .admin-row-icon{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:#eef2ff;color:#4f46e5;font-size:10px;font-weight:900}
.permissions-page .admin-name-cell strong{display:block;color:#172033}
.permissions-page .admin-name-cell small{display:block;margin-top:3px;color:#94a3b8;font-size:11px}
.permissions-page .admin-description{display:block;max-width:520px;color:#64748b;line-height:1.5}
.permissions-page .status-active,.permissions-page .status-inactive{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:800}
.permissions-page .status-active{background:#f0fdf4;color:#15803d}.permissions-page .status-inactive{background:#fef2f2;color:#dc2626}
.permissions-page .status-active:before,.permissions-page .status-inactive:before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.permission-form-page form{padding:24px}
.permission-form-page .form-group label:not(.checkbox-label){display:block;margin-bottom:7px;color:#334155;font-size:12px;font-weight:800}
.permission-form-page .form-group input,.permission-form-page .form-group textarea{width:100%;box-sizing:border-box;border:1px solid #dbe2ea;border-radius:11px;background:#fff;padding:11px 13px;color:#172033;outline:none;transition:border-color .15s,box-shadow .15s}
.permission-form-page .form-group input:focus,.permission-form-page .form-group textarea:focus{border-color:#93c5fd;box-shadow:0 0 0 3px rgba(59,130,246,.11)}
.permission-form-page .form-group textarea{resize:vertical;min-height:145px;line-height:1.55}
.permission-form-page .form-group small{display:block;margin-top:7px;color:#94a3b8;font-size:11px}
.permission-form-page .checkbox-label{display:flex;align-items:center;gap:9px;min-height:42px;padding:10px 12px;border:1px solid #dbe2ea;border-radius:11px;background:#f8fafc;color:#334155;font-size:13px;font-weight:700;cursor:pointer}
.permission-form-page .checkbox-label input{width:16px;height:16px;accent-color:#2563eb}
.permissions-page .action-buttons,.permission-form-page .form-actions{gap:8px}
.permissions-page .edit-button,.permissions-page .primary-button,.permission-form-page .primary-button,.permission-form-page .secondary-button{border-radius:10px}
@media(max-width:900px){.permissions-page .admin-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.permissions-page .page-header,.permission-form-page .page-header{align-items:flex-start;gap:16px;flex-direction:column}}
@media(max-width:640px){.permissions-page .admin-summary-grid{grid-template-columns:1fr}.permissions-page .page-header h2,.permission-form-page .page-header h2{font-size:23px}.permissions-page .section-card-header,.permission-form-page .section-card-header,.permission-form-page form{padding:18px}.permission-form-page .form-grid{grid-template-columns:1fr}}
`}</style>

        <div className="empty-state">

          <strong>
            Authentication required
          </strong>

          <p>
            Please login first.
          </p>

        </div>

      </div>

    );

  }


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <div className="page-container">

        <div className="loading-state">
          Loading permission...
        </div>

      </div>

    );

  }


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <div className="page-container">


      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="page-header">

        <div>

          <div className="admin-page-title">

            <span className="admin-page-icon">
              PR
            </span>

            <div>

              <span className="admin-page-kicker">
                Administration
              </span>

              <h2>

                {isEditMode
                  ? "Edit Permission"
                  : "Create Permission"}

              </h2>

            </div>

          </div>


          <p>

            {isEditMode
              ? "Update the permission name, description and status."
              : "Create a new access permission for ServiOps roles."}

          </p>

        </div>


        <button
          type="button"
          className="secondary-button"
          onClick={
            handleBack
          }
          disabled={
            saving
          }
        >
          ← Back to Permissions
        </button>

      </div>


      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (

        <div className="error-message">
          {error}
        </div>

      )}


      {/* ======================================================
          FORM
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <span className="admin-card-kicker">
              Access Control
            </span>

            <h3>
              Permission Configuration
            </h3>

            <p>
              Define exactly what this permission allows within ServiOps.
            </p>

          </div>

        </div>


        <form
          onSubmit={
            handleSubmit
          }
        >

          <div className="form-grid">


            {/* ==================================================
                NAME
            =================================================== */}

            <div className="form-group">

              <label>
                Permission Name *
              </label>

              <input
                type="text"
                name="name"
                value={
                  formData.name
                }
                onChange={
                  handleChange
                }
                placeholder="e.g. view_customer"
                required
              />

              <small>
                Use a clear, consistent permission name.
              </small>

            </div>


            {/* ==================================================
                STATUS
            =================================================== */}

            {isEditMode && (

              <div className="form-group">

                <label>
                  Status
                </label>

                <label className="checkbox-label">

                  <input
                    type="checkbox"
                    name="is_active"
                    checked={
                      formData.is_active
                    }
                    onChange={
                      handleChange
                    }
                  />

                  Active Permission

                </label>

              </div>

            )}


            {/* ==================================================
                DESCRIPTION
            =================================================== */}

            <div className="form-group full-width">

              <label>
                Description *
              </label>

              <textarea
                name="description"
                value={
                  formData.description
                }
                onChange={
                  handleChange
                }
                placeholder="Describe exactly what this permission allows."
                rows="6"
                required
              />

            </div>

          </div>


          {/* ==================================================
              ACTIONS
          =================================================== */}

          <div className="form-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={
                handleBack
              }
              disabled={
                saving
              }
            >
              Cancel
            </button>


            <button
              type="submit"
              className="primary-button"
              disabled={
                saving
              }
            >

              {saving
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Permission"}

            </button>

          </div>

        </form>

      </section>

    </div>

  );

}


export default PermissionForm;


