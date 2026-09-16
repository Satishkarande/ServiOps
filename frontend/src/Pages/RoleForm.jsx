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




function RoleForm() {

  const navigate =
    useNavigate();

  const { roleId } =
    useParams();

  const isEditMode =
    Boolean(roleId);


  const {
    accessToken,
    isAuthenticated,
    hasPermission,
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
  // LOAD ROLE
  // ============================================================

  const fetchRole =
    async () => {

      try {

        setLoading(true);

        setError("");


        const data =
          await apiRequest(
            `/roles/${roleId}`
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

    if (
      !isEditMode
    ) {

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


    fetchRole();

  }, [
    roleId,
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
        "/roles"
      );

    };


  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit =
    async event => {

      event.preventDefault();


      setError("");


      // --------------------------------------------------------
      // PERMISSION
      // --------------------------------------------------------

      if (
        !hasPermission(
          "manage_roles"
        )
      ) {

        setError(
          isEditMode
            ? "You do not have permission to edit roles."
            : "You do not have permission to create roles."
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
          "Role name is required."
        );

        return;

      }


      if (
        !formData.description.trim()
      ) {

        setError(
          "Role description is required."
        );

        return;

      }


      // ========================================================
      // PAYLOAD
      // ========================================================

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


      // ========================================================
      // SAVE
      // ========================================================

      try {

        setSaving(true);


        if (isEditMode) {

          await apiRequest(
            `/roles/${roleId}`,
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
            "/roles/",
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
          "/roles",
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

      <div className="page-container role-form-page">
<style>{`
.role-form-page{--rf-border:#e7eaf0;--rf-text:#172033;--rf-muted:#687386}
.role-form-page .page-header{margin-bottom:24px}
.role-form-page .section-card{background:#fff;border:1px solid var(--rf-border);border-radius:16px;box-shadow:0 3px 12px rgba(23,32,51,.045);overflow:hidden}
.role-form-page .section-card-header{padding:22px 24px;border-bottom:1px solid var(--rf-border)}
.role-form-page .section-card-header h3{margin:4px 0;color:var(--rf-text)}
.role-form-page .section-card-header p{margin:0;color:var(--rf-muted)}
.role-form-page .form-grid{padding:24px}
.role-form-page .form-group label{display:block;margin-bottom:7px;color:#465166;font-size:13px;font-weight:700}
.role-form-page input[type="text"],.role-form-page textarea{width:100%;box-sizing:border-box;border:1px solid #d9dee7;border-radius:9px;background:#fff;color:var(--rf-text);padding:10px 12px;font:inherit;outline:none;transition:border-color .15s,box-shadow .15s}
.role-form-page input[type="text"]:focus,.role-form-page textarea:focus{border-color:#818cf8;box-shadow:0 0 0 3px rgba(99,102,241,.10)}
.role-form-page textarea{resize:vertical;min-height:140px}
.role-form-page .checkbox-label{display:flex!important;align-items:center;gap:9px;padding:11px 12px;border:1px solid #d9dee7;border-radius:9px;background:#fafbfc}
.role-form-page .checkbox-label input{width:16px;height:16px;accent-color:#4f46e5}
.role-form-page .form-actions{display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid var(--rf-border);background:#fafbfc}
@media(max-width:700px){.role-form-page .form-grid{padding:18px}.role-form-page .form-actions{padding:14px;flex-direction:column-reverse}.role-form-page .form-actions button{width:100%}}
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
  // PERMISSION
  // ============================================================

  if (
    !hasPermission(
      "manage_roles"
    )
  ) {

    return (

      <div className="page-container">

        <div className="empty-state">

          <strong>
            Access denied
          </strong>

          <p>
            You do not have permission
            to manage roles.
          </p>


          <button
            type="button"
            className="secondary-button"
            onClick={
              handleBack
            }
          >
            ← Back to Roles
          </button>

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
          Loading role...
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
              RL
            </span>

            <div>

              <span className="admin-page-kicker">
                Administration
              </span>

              <h2>
                {isEditMode
                  ? "Edit Role"
                  : "Create Role"}
              </h2>

            </div>

          </div>

          <p>

            {isEditMode
              ? "Update the role name, description and status."
              : "Create a new ServiOps role and configure its purpose."}

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
          ← Back to Roles
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
          ROLE INFORMATION
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <span className="admin-card-kicker">
              Role Configuration
            </span>

            <h3>
              Role Information
            </h3>

            <p>
              Define the role and describe
              its responsibilities.
            </p>

          </div>

        </div>


        <form
          onSubmit={
            handleSubmit
          }
        >

          <div className="form-grid">


            {/* ROLE NAME */}

            <div className="form-group">

              <label>
                Role Name *
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
                placeholder="e.g. Service Engineer"
                required
              />

            </div>


            {/* STATUS */}

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

                  Active Role

                </label>

              </div>

            )}


            {/* DESCRIPTION */}

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
                placeholder="Describe the responsibilities and access level of this role."
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
                  : "Create Role"}

            </button>

          </div>

        </form>

      </section>

    </div>

  );

}


export default RoleForm;


