import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_URL } from "../config";
import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../auth/AuthContext";




function Users() {

  const navigate =
    useNavigate();

  const {
    accessToken,
    isAuthenticated,
  } = useAuth();


  // ============================================================
  // STATE
  // ============================================================

  const [users, setUsers] =
    useState([]);

  const [roles, setRoles] =
    useState([]);

  const [departments, setDepartments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [deactivatingId, setDeactivatingId] =
    useState(null);


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
                    item =>
                      typeof item ===
                      "string"
                        ? item
                        : item?.msg ||
                          JSON.stringify(
                            item
                          )
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

              message =
                text;

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
  // FETCH USERS
  // ============================================================

  const fetchUsers =
    async () => {

      const data =
        await apiRequest(
          "/users/"
        );


      setUsers(
        Array.isArray(data)
          ? data
          : []
      );

    };


  // ============================================================
  // FETCH ROLES
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
  // FETCH DEPARTMENTS
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
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    const loadData =
      async () => {

        if (
          !isAuthenticated ||
          !accessToken
        ) {

          setLoading(false);

          return;

        }


        try {

          setLoading(true);

          setError("");


          await Promise.all([

            fetchUsers(),

            fetchRoles(),

            fetchDepartments(),

          ]);

        } catch (err) {

          console.error(err);

          setError(
            err.message
          );

        } finally {

          setLoading(false);

        }

      };


    loadData();

  }, [
    accessToken,
    isAuthenticated,
  ]);


  // ============================================================
  // OPEN CREATE PAGE
  // ============================================================

  const handleOpenAdd =
    () => {

      navigate(
        "/users/new"
      );

    };


  // ============================================================
  // OPEN EDIT PAGE
  // ============================================================

  const handleOpenEdit =
    user => {

      navigate(
        `/users/${user.id}/edit`
      );

    };


  // ============================================================
  // DEACTIVATE USER
  // ============================================================

  const handleDeactivate =
    async user => {

      const confirmed =
        window.confirm(
          `Are you sure you want to deactivate ${user.first_name} ${user.last_name}?`
        );


      if (!confirmed) {

        return;

      }


      try {

        setDeactivatingId(
          user.id
        );

        setError("");


        await apiRequest(
          `/users/${user.id}`,
          {
            method:
              "DELETE",
          }
        );


        await fetchUsers();

      } catch (err) {

        console.error(err);

        setError(
          err.message
        );

      } finally {

        setDeactivatingId(
          null
        );

      }

    };


  // ============================================================
  // SUMMARY
  // ============================================================

  const activeUsers =
    useMemo(
      () =>
        users.filter(
          user =>
            user.is_active
        ).length,
      [users]
    );


  const inactiveUsers =
    users.length -
    activeUsers;


  // ============================================================
  // AUTH
  // ============================================================

  if (!isAuthenticated) {

    return (

      <div className="page-container admin-users-page">

      
<style>{`
  .admin-users-page {
    --ui-border: #e5e7eb;
    --ui-muted: #64748b;
    --ui-text: #0f172a;
    --ui-surface: #ffffff;
    --ui-soft: #f8fafc;
  }

  .admin-users-page .page-header {
    align-items: center;
    margin-bottom: 24px;
  }

  .admin-users-page .admin-page-title {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .admin-users-page .admin-page-icon {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: #eef2ff;
    color: #4338ca;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .04em;
    box-shadow: inset 0 0 0 1px #e0e7ff;
  }

  .admin-users-page .admin-page-kicker,
  .admin-users-page .admin-card-kicker {
    display: block;
    margin-bottom: 4px;
    color: #64748b;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .09em;
    text-transform: uppercase;
  }

  .admin-users-page .page-header h2 {
    margin: 0;
    color: var(--ui-text);
    font-size: 28px;
    line-height: 1.15;
  }

  .admin-users-page .page-header p {
    margin: 8px 0 0;
    color: var(--ui-muted);
    font-size: 14px;
  }

  .admin-users-page .primary-button {
    min-height: 42px;
    padding: 0 18px;
    border: 0;
    border-radius: 11px;
    font-weight: 750;
    box-shadow: 0 7px 18px rgba(15, 23, 42, .10);
    transition: transform .16s ease, box-shadow .16s ease;
  }

  .admin-users-page .primary-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(15, 23, 42, .14);
  }

  .admin-users-page .admin-summary-grid {
    gap: 14px;
    margin-bottom: 22px;
  }

  .admin-users-page .admin-summary-card {
    position: relative;
    overflow: hidden;
    min-height: 104px;
    padding: 18px 20px;
    border: 1px solid var(--ui-border);
    border-radius: 16px;
    background: var(--ui-surface);
    box-shadow: 0 5px 18px rgba(15, 23, 42, .045);
  }

  .admin-users-page .admin-summary-card::after {
    content: "";
    position: absolute;
    right: -24px;
    bottom: -28px;
    width: 82px;
    height: 82px;
    border-radius: 50%;
    background: #f1f5f9;
    opacity: .7;
  }

  .admin-users-page .admin-summary-card span {
    position: relative;
    z-index: 1;
    display: block;
    color: var(--ui-muted);
    font-size: 12px;
    font-weight: 700;
  }

  .admin-users-page .admin-summary-card strong {
    position: relative;
    z-index: 1;
    display: block;
    margin-top: 8px;
    color: var(--ui-text);
    font-size: 28px;
    line-height: 1;
  }

  .admin-users-page .error-message {
    margin-bottom: 18px;
    border-radius: 12px;
    border: 1px solid #fecaca;
    background: #fff7f7;
    color: #b91c1c;
    padding: 12px 14px;
    font-size: 13px;
    font-weight: 650;
  }

  .admin-users-page .section-card {
    overflow: hidden;
    border: 1px solid var(--ui-border);
    border-radius: 18px;
    background: var(--ui-surface);
    box-shadow: 0 7px 24px rgba(15, 23, 42, .05);
  }

  .admin-users-page .section-card-header {
    padding: 20px 22px 16px;
    border-bottom: 1px solid #eef2f7;
  }

  .admin-users-page .section-card-header h3 {
    margin: 0;
    color: var(--ui-text);
    font-size: 17px;
  }

  .admin-users-page .section-card-header p {
    margin: 5px 0 0;
    color: var(--ui-muted);
    font-size: 13px;
  }

  .admin-users-page .table-container {
    overflow-x: auto;
  }

  .admin-users-page .users-data-table {
    min-width: 980px;
    border-collapse: separate;
    border-spacing: 0;
  }

  .admin-users-page .users-data-table th {
    padding: 12px 16px;
    background: #f8fafc;
    border-bottom: 1px solid var(--ui-border);
    color: #64748b;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .06em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .admin-users-page .users-data-table td {
    padding: 14px 16px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }

  .admin-users-page .users-data-table tbody tr {
    transition: background .14s ease;
  }

  .admin-users-page .users-data-table tbody tr:hover {
    background: #fafbff;
  }

  .admin-users-page .users-data-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .admin-users-page .row-number {
    display: inline-grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 9px;
    background: #f1f5f9;
    color: #64748b;
    font-size: 11px;
    font-weight: 800;
  }

  .admin-users-page .admin-name-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .admin-users-page .admin-row-icon {
    flex: 0 0 auto;
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    background: #eef2ff;
    color: #4338ca;
    font-size: 11px;
    font-weight: 850;
  }

  .admin-users-page .admin-name-cell strong {
    display: block;
    color: var(--ui-text);
    font-size: 13px;
  }

  .admin-users-page .admin-name-cell small {
    display: block;
    margin-top: 2px;
    color: #94a3b8;
    font-size: 10px;
  }

  .admin-users-page .table-primary-text {
    color: #1e293b;
    font-size: 13px;
  }

  .admin-users-page .table-secondary-text {
    color: #64748b;
    font-size: 13px;
  }

  .admin-users-page .role-pill {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border: 1px solid #e0e7ff;
    border-radius: 999px;
    background: #f5f7ff;
    color: #4338ca;
    font-size: 11px;
    font-weight: 750;
    white-space: nowrap;
  }

  .admin-users-page .status-active,
  .admin-users-page .status-inactive {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
  }

  .admin-users-page .status-active {
    background: #f0fdf4;
    color: #15803d;
  }

  .admin-users-page .status-inactive {
    background: #f1f5f9;
    color: #64748b;
  }

  .admin-users-page .status-active::before,
  .admin-users-page .status-inactive::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .admin-users-page .action-buttons {
    display: flex;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
  }

  .admin-users-page .edit-button,
  .admin-users-page .deactivate-button {
    min-height: 32px;
    padding: 0 10px;
    border-radius: 9px;
    font-size: 11px;
    font-weight: 750;
    transition: background .14s ease, border-color .14s ease, transform .14s ease;
  }

  .admin-users-page .edit-button {
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #334155;
  }

  .admin-users-page .edit-button:hover {
    background: #f8fafc;
    border-color: #94a3b8;
  }

  .admin-users-page .deactivate-button {
    border: 1px solid #fecaca;
    background: #fff7f7;
    color: #dc2626;
  }

  .admin-users-page .deactivate-button:hover:not(:disabled) {
    background: #feecec;
  }

  .admin-users-page button:disabled {
    cursor: not-allowed;
    opacity: .55;
  }

  .admin-users-page .empty-state {
    margin: 22px;
    border: 1px dashed #cbd5e1;
    border-radius: 14px;
    background: #f8fafc;
    padding: 34px 20px;
    text-align: center;
  }

  .admin-users-page .empty-state strong {
    color: var(--ui-text);
  }

  .admin-users-page .empty-state p {
    margin: 6px 0 0;
    color: var(--ui-muted);
    font-size: 13px;
  }

  @media (max-width: 760px) {
    .admin-users-page .page-header {
      align-items: flex-start;
      gap: 16px;
      flex-direction: column;
    }

    .admin-users-page .page-header .primary-button {
      width: 100%;
    }

    .admin-users-page .page-header h2 {
      font-size: 24px;
    }
  }
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
          Loading users...
        </div>

      </div>

    );

  }


  // ============================================================
  // UI
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
              US
            </span>

            <div>

              <span className="admin-page-kicker">
                Administration
              </span>

              <h2>
                Users
              </h2>

            </div>

          </div>

          <p>
            Manage ServiOps users,
            departments and access roles.
          </p>

        </div>


        <button
          type="button"
          className="primary-button"
          onClick={
            handleOpenAdd
          }
        >
          + Add User
        </button>

      </div>


      {/* ======================================================
          SUMMARY
      ======================================================= */}

      <div className="admin-summary-grid">

        <div className="admin-summary-card">

          <span>
            Total Users
          </span>

          <strong>
            {users.length}
          </strong>

        </div>


        <div className="admin-summary-card">

          <span>
            Active Users
          </span>

          <strong>
            {activeUsers}
          </strong>

        </div>


        <div className="admin-summary-card">

          <span>
            Inactive Users
          </span>

          <strong>
            {inactiveUsers}
          </strong>

        </div>


        <div className="admin-summary-card">

          <span>
            Departments
          </span>

          <strong>
            {departments.length}
          </strong>

        </div>

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
          USERS TABLE
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <span className="admin-card-kicker">
              User Directory
            </span>

            <h3>
              ServiOps Users
            </h3>

            <p>
              View user accounts,
              access roles and
              department assignments.
            </p>

          </div>

        </div>


        {users.length === 0 ? (

          <div className="empty-state">

            <strong>
              No users found
            </strong>

            <p>
              Create your first ServiOps
              user to get started.
            </p>

          </div>

        ) : (

          <div className="table-container">

            <table className="data-table admin-data-table users-data-table">

              <thead>

                <tr>

                  <th>
                    #
                  </th>

                  <th>
                    Employee
                  </th>

                  <th>
                    Name
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Department
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {users.map(
                  (
                    user,
                    index
                  ) => {

                    const role =
                      roles.find(
                        item =>
                          Number(
                            item.id
                          ) ===
                          Number(
                            user.role_id
                          )
                      );


                    const department =
                      departments.find(
                        item =>
                          Number(
                            item.id
                          ) ===
                          Number(
                            user.department_id
                          )
                      );


                    const fullName =
                      [
                        user.first_name,
                        user.last_name,
                      ]
                        .filter(Boolean)
                        .join(" ");


                    const initials =
                      (
                        `${user.first_name || ""}${user.last_name || ""}`
                      )
                        .trim()
                        .slice(
                          0,
                          2
                        )
                        .toUpperCase() ||
                      "US";


                    return (

                      <tr
                        key={
                          user.id
                        }
                      >


                        {/* Number */}

                        <td>

                          <span className="row-number">
                            {index + 1}
                          </span>

                        </td>


                        {/* Employee */}

                        <td>

                          <div className="admin-name-cell">

                            <span className="admin-row-icon">
                              {initials}
                            </span>

                            <div>

                              <button type="button" className="entity-link entity-link-block" onClick={() => navigate(`/users/${user.id}/edit`)}>
                                <strong>{user.employee_code}</strong>
                              </button>

                              <small>
                                Employee
                              </small>

                            </div>

                          </div>

                        </td>


                        {/* Name */}

                        <td>

                          <button type="button" className="entity-link entity-link-block">
                            <strong className="table-primary-text" onClick={() => navigate(`/users/${user.id}/edit`)}>
                              {fullName || "Unnamed User"}
                            </strong>
                          </button>

                        </td>


                        {/* Email */}

                        <td>

                          <span className="table-secondary-text">

                            {
                              user.email ||
                              "—"
                            }

                          </span>

                        </td>


                        {/* Department */}

                        <td>

                          <span className="table-primary-text">

                            {department
                              ? department.name
                              : "—"}

                          </span>

                        </td>


                        {/* Role */}

                        <td>

                          {role ? (

                            <button type="button" className="entity-link role-pill" onClick={() => navigate(`/roles/${role.id}/edit`)}>
                              {role.name}
                            </button>

                          ) : (

                            <span className="table-secondary-text">
                              —
                            </span>

                          )}

                        </td>


                        {/* Status */}

                        <td>

                          <span
                            className={
                              user.is_active
                                ? "status-active"
                                : "status-inactive"
                            }
                          >

                            {user.is_active
                              ? "Active"
                              : "Inactive"}

                          </span>

                        </td>


                        {/* Actions */}

                        <td>

                          <div className="action-buttons">

                            <button
                              type="button"
                              className="edit-button"
                              onClick={() =>
                                handleOpenEdit(
                                  user
                                )
                              }
                            >
                              Edit
                            </button>


                            {user.is_active && (

                              <button
                                type="button"
                                className="deactivate-button"
                                onClick={() =>
                                  handleDeactivate(
                                    user
                                  )
                                }
                                disabled={
                                  deactivatingId ===
                                  user.id
                                }
                              >

                                {
                                  deactivatingId ===
                                  user.id
                                    ? "Deactivating..."
                                    : "Deactivate"
                                }

                              </button>

                            )}

                          </div>

                        </td>

                      </tr>

                    );

                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>

  );

}


export default Users;


