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




function UserEdit() {

  const navigate =
    useNavigate();

  const { userId } =
    useParams();

  const {
    accessToken,
    isAuthenticated,
    hasPermission,
  } = useAuth();


  // ============================================================
  // STATE
  // ============================================================

  const [roles, setRoles] =
    useState([]);

  const [departments, setDepartments] =
    useState([]);

  const [subDepartments, setSubDepartments] =
    useState([]);

  const [managers, setManagers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  const [formData, setFormData] =
    useState({

      employee_code: "",

      first_name: "",

      last_name: "",

      email: "",

      department_id: "",

      sub_department_id: "",

      manager_id: "",

      role_id: "",

      is_active: true,

    });


  // ============================================================
  // API REQUEST
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

            if (
              typeof data.detail ===
              "string"
            ) {

              message =
                data.detail;

            } else if (
              Array.isArray(
                data.detail
              )
            ) {

              message =
                data.detail
                  .map(
                    item => {

                      if (
                        typeof item ===
                        "string"
                      ) {

                        return item;

                      }

                      return (
                        item?.msg ||
                        JSON.stringify(
                          item
                        )
                      );

                    }
                  )
                  .join(", ");

            } else {

              message =
                JSON.stringify(
                  data.detail
                );

            }

          }

        } catch {

          try {

            const text =
              await response.text();

            if (text) {
              message = text;
            }

          } catch {
            // Ignore.
          }

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
  // LOAD USER
  // ============================================================

  const fetchUser =
    async () => {

      const user =
        await apiRequest(
          `/users/${userId}`
        );


      setFormData({

        employee_code:
          user.employee_code ||
          "",

        first_name:
          user.first_name ||
          "",

        last_name:
          user.last_name ||
          "",

        email:
          user.email ||
          "",

        department_id:
          user.department_id ??
          "",

        sub_department_id:
          user.sub_department_id ??
          "",

        manager_id:
          user.manager_id ??
          "",

        role_id:
          user.role_id ??
          "",

        is_active:
          user.is_active,

      });


      return user;

    };


  // ============================================================
  // LOAD ROLES
  // ============================================================

  const fetchRoles =
    async () => {

      const data =
        await apiRequest(
          "/roles/"
        );


      setRoles(
        Array.isArray(data)
          ? data
          : []
      );

    };


  // ============================================================
  // LOAD DEPARTMENTS
  // ============================================================

  const fetchDepartments =
    async () => {

      const data =
        await apiRequest(
          "/departments/"
        );


      setDepartments(
        Array.isArray(data)
          ? data
          : []
      );

    };


  // ============================================================
  // LOAD SUB DEPARTMENTS
  // ============================================================

  const fetchSubDepartments =
    async departmentId => {

      if (!departmentId) {

        setSubDepartments([]);

        return;

      }


      const data =
        await apiRequest(
          `/sub-departments/?department_id=${departmentId}`
        );


      setSubDepartments(
        Array.isArray(data)
          ? data
          : []
      );

    };


  // ============================================================
  // LOAD MANAGERS
  // ============================================================

  const fetchManagers =
    async () => {

      const data =
        await apiRequest(
          "/users/managers"
        );


      setManagers(
        Array.isArray(data)
          ? data
          : []
      );

    };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    if (
      !isAuthenticated ||
      !accessToken
    ) {

      setLoading(false);

      return;

    }


    const load =
      async () => {

        try {

          setLoading(true);

          setError("");


          const user =
            await fetchUser();


          await Promise.all([

            fetchRoles(),

            fetchDepartments(),

            fetchManagers(),

            fetchSubDepartments(
              user.department_id
            ),

          ]);

        } catch (error) {

          console.error(
            "Failed to load user:",
            error
          );

          setError(
            error.message
          );

        } finally {

          setLoading(false);

        }

      };


    load();

  }, [
    userId,
    accessToken,
    isAuthenticated,
  ]);


  // ============================================================
  // DEPARTMENT CHANGE
  // ============================================================

  const handleDepartmentChange =
    async event => {

      const value =
        event.target.value;


      setFormData(
        previous => ({

          ...previous,

          department_id:
            value,

          sub_department_id:
            "",

          manager_id:
            "",

        })
      );


      setSubDepartments([]);


      if (!value) {
        return;
      }


      try {

        await fetchSubDepartments(
          value
        );

      } catch (error) {

        console.error(error);

        setError(
          error.message
        );

      }

    };


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
  // UPDATE USER
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


      if (
        !hasPermission(
          "manage_users"
        )
      ) {

        setError(
          "You do not have permission to update users."
        );

        return;

      }


      if (
        !formData.first_name.trim()
      ) {

        setError(
          "Please enter the first name."
        );

        return;

      }


      if (
        !formData.last_name.trim()
      ) {

        setError(
          "Please enter the last name."
        );

        return;

      }


      if (
        !formData.email.trim()
      ) {

        setError(
          "Please enter an email address."
        );

        return;

      }


      if (
        !formData.department_id
      ) {

        setError(
          "Please select a department."
        );

        return;

      }


      if (
        !formData.sub_department_id
      ) {

        setError(
          "Please select a sub department."
        );

        return;

      }


      if (
        !formData.role_id
      ) {

        setError(
          "Please select a role."
        );

        return;

      }


      const payload = {

        first_name:
          formData.first_name.trim(),

        last_name:
          formData.last_name.trim(),

        email:
          formData.email.trim(),

        department_id:
          Number(
            formData.department_id
          ),

        sub_department_id:
          Number(
            formData.sub_department_id
          ),

        manager_id:
          formData.manager_id
            ? Number(
                formData.manager_id
              )
            : null,

        role_id:
          Number(
            formData.role_id
          ),

        is_active:
          formData.is_active,

      };


      try {

        setSaving(true);

        setError("");


        await apiRequest(
          `/users/${userId}`,
          {
            method:
              "PATCH",

            body:
              JSON.stringify(
                payload
              ),

          }
        );


        navigate(
          "/users",
          {
            replace: true,
          }
        );

      } catch (error) {

        console.error(
          "Failed to update user:",
          error
        );

        setError(
          error.message
        );

      } finally {

        setSaving(false);

      }

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
        "/users"
      );

    };


  // ============================================================
  // AUTH
  // ============================================================

  if (!isAuthenticated) {

    return (

      <div className="empty-state">

        <strong>
          Authentication required
        </strong>

        <p>
          Please login first.
        </p>

      </div>

    );

  }


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <div className="loading-state">
        Loading user...
      </div>

    );

  }


  // ============================================================
  // UI
  // ============================================================

  return (

    <div className="page-container user-form-page">

      
<style>{`
  .user-form-page {
    --ui-border: #e5e7eb;
    --ui-muted: #64748b;
    --ui-text: #0f172a;
  }

  .user-form-page .page-header {
    align-items: center;
    margin-bottom: 24px;
  }

  .user-form-page .admin-page-kicker {
    display: block;
    margin-bottom: 5px;
    color: #64748b;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .09em;
    text-transform: uppercase;
  }

  .user-form-page .page-header h2 {
    margin: 0;
    color: var(--ui-text);
    font-size: 28px;
    line-height: 1.15;
  }

  .user-form-page .page-header p {
    max-width: 680px;
    margin: 8px 0 0;
    color: var(--ui-muted);
    font-size: 14px;
  }

  .user-form-page .section-card {
    border: 1px solid var(--ui-border);
    border-radius: 18px;
    background: #fff;
    box-shadow: 0 7px 24px rgba(15, 23, 42, .05);
    overflow: hidden;
  }

  .user-form-page .section-card-header {
    padding: 20px 22px 16px;
    border-bottom: 1px solid #eef2f7;
    background: linear-gradient(to bottom, #fff, #fcfdff);
  }

  .user-form-page .section-card-header h3 {
    margin: 0;
    color: var(--ui-text);
    font-size: 17px;
  }

  .user-form-page .section-card-header p {
    margin: 5px 0 0;
    color: var(--ui-muted);
    font-size: 13px;
  }

  .user-form-page form {
    padding: 22px;
  }

  .user-form-page .form-grid {
    gap: 18px;
  }

  .user-form-page .form-section-title {
    grid-column: 1 / -1;
    margin-top: 5px;
    padding: 13px 0 8px;
    border-bottom: 1px solid #eef2f7;
    color: #334155;
    font-size: 12px;
    font-weight: 850;
    letter-spacing: .07em;
    text-transform: uppercase;
  }

  .user-form-page .form-group {
    min-width: 0;
  }

  .user-form-page .form-group label {
    display: block;
    margin-bottom: 7px;
    color: #334155;
    font-size: 12px;
    font-weight: 750;
  }

  .user-form-page .form-group input:not([type="checkbox"]),
  .user-form-page .form-group select {
    width: 100%;
    min-height: 42px;
    box-sizing: border-box;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    background: #fff;
    color: #0f172a;
    padding: 0 12px;
    font-size: 13px;
    outline: none;
    transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
  }

  .user-form-page .form-group input:not([type="checkbox"])::placeholder {
    color: #94a3b8;
  }

  .user-form-page .form-group input:not([type="checkbox"]):focus,
  .user-form-page .form-group select:focus {
    border-color: #818cf8;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, .11);
  }

  .user-form-page .form-group input:not([type="checkbox"]):disabled,
  .user-form-page .form-group select:disabled {
    background: #f8fafc;
    color: #94a3b8;
    cursor: not-allowed;
  }

  .user-form-page .form-group small {
    display: block;
    margin-top: 6px;
    color: #94a3b8;
    font-size: 11px;
    line-height: 1.4;
  }

  .user-form-page .form-group label:has(input[type="checkbox"]) {
    display: flex;
    align-items: center;
    gap: 9px;
    min-height: 42px;
    margin: 0;
    padding: 0 12px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #f8fafc;
    cursor: pointer;
  }

  .user-form-page input[type="checkbox"] {
    width: 16px;
    height: 16px;
    margin: 0;
    accent-color: #4f46e5;
  }

  .user-form-page .error-message {
    margin-bottom: 18px;
    border: 1px solid #fecaca;
    border-radius: 12px;
    background: #fff7f7;
    color: #b91c1c;
    padding: 12px 14px;
    font-size: 13px;
    font-weight: 650;
  }

  .user-form-page .form-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    margin-top: 24px;
    padding-top: 18px;
    border-top: 1px solid #eef2f7;
  }

  .user-form-page .primary-button,
  .user-form-page .secondary-button {
    min-height: 42px;
    padding: 0 17px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 800;
    transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
  }

  .user-form-page .primary-button:hover:not(:disabled),
  .user-form-page .secondary-button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .user-form-page .primary-button {
    border: 0;
    box-shadow: 0 7px 18px rgba(15, 23, 42, .10);
  }

  .user-form-page .secondary-button {
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #334155;
  }

  .user-form-page .secondary-button:hover:not(:disabled) {
    background: #f8fafc;
  }

  .user-form-page button:disabled {
    cursor: not-allowed;
    opacity: .55;
  }

  @media (max-width: 760px) {
    .user-form-page .page-header {
      align-items: flex-start;
      gap: 14px;
      flex-direction: column;
    }

    .user-form-page .page-header .secondary-button {
      width: 100%;
    }

    .user-form-page .page-header h2 {
      font-size: 24px;
    }

    .user-form-page form {
      padding: 16px;
    }

    .user-form-page .form-actions {
      flex-direction: column-reverse;
    }

    .user-form-page .form-actions button {
      width: 100%;
    }
  }
`}</style>


      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="page-header">

        <div>

          <span className="admin-page-kicker">
            User Management
          </span>

          <h2>
            Edit User
          </h2>

          <p>
            Update the employee's organization,
            manager and access information.
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
          ← Back to Users
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

            <h3>
              User Information
            </h3>

            <p>
              Update the employee's account
              and organizational assignment.
            </p>

          </div>

        </div>


        <form
          onSubmit={
            handleSubmit
          }
        >

          <div className="form-grid">

            {/* EMPLOYEE CODE */}

            <div className="form-group">

              <label>
                Employee Code
              </label>

              <input
                type="text"
                value={
                  formData.employee_code
                }
                disabled
              />

              <small>
                Employee code cannot be changed.
              </small>

            </div>


            {/* EMAIL */}

            <div className="form-group">

              <label>
                Email *
              </label>

              <input
                type="email"
                name="email"
                value={
                  formData.email
                }
                onChange={
                  handleChange
                }
                required
              />

            </div>


            {/* FIRST NAME */}

            <div className="form-group">

              <label>
                First Name *
              </label>

              <input
                type="text"
                name="first_name"
                value={
                  formData.first_name
                }
                onChange={
                  handleChange
                }
                required
              />

            </div>


            {/* LAST NAME */}

            <div className="form-group">

              <label>
                Last Name *
              </label>

              <input
                type="text"
                name="last_name"
                value={
                  formData.last_name
                }
                onChange={
                  handleChange
                }
                required
              />

            </div>


            {/* ==================================================
                ORGANIZATION
            =================================================== */}

            <div className="form-section-title">
              Organization
            </div>


            {/* DEPARTMENT */}

            <div className="form-group">

              <label>
                Department *
              </label>

              <select
                name="department_id"
                value={
                  formData.department_id
                }
                onChange={
                  handleDepartmentChange
                }
                required
              >

                <option value="">
                  Select Department
                </option>


                {departments
                  .map(
                    department => (

                      <option
                        key={
                          department.id
                        }
                        value={
                          department.id
                        }
                      >
                        {department.name}
                      </option>

                    )
                  )}

              </select>

            </div>


            {/* SUB DEPARTMENT */}

            <div className="form-group">

              <label>
                Sub Department *
              </label>

              <select
                name="sub_department_id"
                value={
                  formData.sub_department_id
                }
                onChange={
                  handleChange
                }
                disabled={
                  !formData.department_id
                }
                required
              >

                <option value="">
                  {
                    formData.department_id
                      ? "Select Sub Department"
                      : "Select Department First"
                  }
                </option>


                {subDepartments
                  .map(
                    subDepartment => (

                      <option
                        key={
                          subDepartment.id
                        }
                        value={
                          subDepartment.id
                        }
                      >
                        {subDepartment.name}
                      </option>

                    )
                  )}

              </select>

            </div>


            {/* MANAGER */}

            <div className="form-group">

              <label>
                Reporting Manager
              </label>

              <select
                name="manager_id"
                value={
                  formData.manager_id
                }
                onChange={
                  handleChange
                }
                disabled={
                  !formData.department_id
                }
              >

                <option value="">
                  No Manager
                </option>


                {managers
                  .filter(
                    manager =>
                      Number(
                        manager.department_id
                      ) ===
                      Number(
                        formData.department_id
                      ) ||
                      Number(
                        manager.id
                      ) ===
                      Number(
                        formData.manager_id
                      )
                  )
                  .map(
                    manager => (

                      <option
                        key={
                          manager.id
                        }
                        value={
                          manager.id
                        }
                      >
                        {manager.first_name}{" "}
                        {manager.last_name}
                        {" · "}
                        {manager.employee_code}
                      </option>

                    )
                  )}

              </select>


              <small>
                Managers are limited to the
                selected department.
              </small>

            </div>


            {/* ROLE */}

            <div className="form-group">

              <label>
                Role *
              </label>

              <select
                name="role_id"
                value={
                  formData.role_id
                }
                onChange={
                  handleChange
                }
                required
              >

                <option value="">
                  Select Role
                </option>


                {roles
                  .map(
                    role => (

                      <option
                        key={
                          role.id
                        }
                        value={
                          role.id
                        }
                      >
                        {role.name}
                      </option>

                    )
                  )}

              </select>

            </div>


            {/* ==================================================
                STATUS
            =================================================== */}

            <div className="form-section-title">
              Account Status
            </div>


            <div className="form-group">

              <label>
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

                {" "}

                User is active

              </label>

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
                ? "Saving Changes..."
                : "Save Changes"}
            </button>

          </div>

        </form>

      </section>

    </div>

  );

}


export default UserEdit;


