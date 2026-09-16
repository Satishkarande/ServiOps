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




function Roles() {

  const navigate =
    useNavigate();

  const {
    accessToken,
    isAuthenticated,
  } = useAuth();


  // ============================================================
  // STATE
  // ============================================================

  const [roles, setRoles] =
    useState([]);

  const [permissions, setPermissions] =
    useState([]);

  const [rolePermissions, setRolePermissions] =
    useState([]);

  const [selectedRole, setSelectedRole] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [permissionsLoading, setPermissionsLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showPermissionModal, setShowPermissionModal] =
    useState(false);


  // ============================================================
  // PERMISSION GROUPING
  // ============================================================

  const permissionGroups =
    useMemo(() => {

      const groups = {

        Customers: [],

        Plants: [],

        Machines: [],

        Tickets: [],

        "Spare Parts": [],

        Administration: [],

        System: [],

        Other: [],

      };


      permissions
        .filter(
          permission =>
            permission.is_active
        )
        .forEach(
          permission => {

            const name =
              permission.name
                .toLowerCase();


            if (
              name.includes("customer")
            ) {

              groups.Customers.push(
                permission
              );

              return;

            }


            if (
              name.includes("plant")
            ) {

              groups.Plants.push(
                permission
              );

              return;

            }


            if (
              name.includes("machine")
            ) {

              groups.Machines.push(
                permission
              );

              return;

            }


            if (
              name.includes("ticket")
              ||
              name.includes("engineer")
              ||
              name.includes("close")
              ||
              name.includes("cancel")
            ) {

              groups.Tickets.push(
                permission
              );

              return;

            }


            if (
              name.includes("spare")
              ||
              name.includes("inventory")
              ||
              name.includes("stock")
            ) {

              groups["Spare Parts"].push(
                permission
              );

              return;

            }


            if (
              name.includes("user")
              ||
              name.includes("role")
              ||
              name.includes("permission")
            ) {

              groups.Administration.push(
                permission
              );

              return;

            }


            if (
              name.includes("dashboard")
              ||
              name.includes("audit")
              ||
              name.includes("system")
            ) {

              groups.System.push(
                permission
              );

              return;

            }


            groups.Other.push(
              permission
            );

          }
        );


      return groups;

    }, [
      permissions,
    ]);


  // ============================================================
  // API HELPER
  // ============================================================

  const apiRequest =
    async (
      endpoint,
      options = {}
    ) => {

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
  // FETCH PERMISSIONS
  // ============================================================

  const fetchPermissions =
    async () => {

      const data =
        await apiRequest(
          "/permissions/"
        );


      setPermissions(
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

            fetchRoles(),

            fetchPermissions(),

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
  // ROLE ACTIONS
  // ============================================================

  const handleAddRole =
    () => {

      navigate(
        "/roles/new"
      );

    };


  const handleEditRole =
    role => {

      navigate(
        `/roles/${role.id}/edit`
      );

    };


  // ============================================================
  // ROLE PERMISSIONS
  // ============================================================

  const fetchRolePermissions =
    async roleId => {

      try {

        setPermissionsLoading(
          true
        );

        setError("");


        const data =
          await apiRequest(
            `/roles/${roleId}/permissions`
          );


        setRolePermissions(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (err) {

        console.error(err);

        setError(
          err.message
        );

      } finally {

        setPermissionsLoading(
          false
        );

      }

    };


  const handleManagePermissions =
    async role => {

      setSelectedRole(
        role
      );

      setRolePermissions([]);

      setShowPermissionModal(
        true
      );

      setError("");


      await fetchRolePermissions(
        role.id
      );

    };


  const handleClosePermissionModal =
    () => {

      if (saving) {

        return;

      }


      setSelectedRole(null);

      setRolePermissions([]);

      setShowPermissionModal(
        false
      );

      setError("");

    };


  // ============================================================
  // PERMISSION HELPERS
  // ============================================================

  const getPermissionId =
    permission => {

      if (
        typeof permission ===
        "number"
      ) {

        return permission;

      }


      return (
        permission.permission_id ??
        permission.id
      );

    };


  const isPermissionAssigned =
    permissionId => {

      return rolePermissions.some(
        permission =>
          getPermissionId(
            permission
          ) === permissionId
      );

    };


  const handlePermissionToggle =
    permissionId => {

      setRolePermissions(
        previous => {

          const exists =
            previous.some(
              permission =>
                getPermissionId(
                  permission
                ) === permissionId
            );


          if (exists) {

            return previous.filter(
              permission =>
                getPermissionId(
                  permission
                ) !== permissionId
            );

          }


          return [
            ...previous,
            permissionId,
          ];

        }
      );

    };


  // ============================================================
  // SAVE PERMISSIONS
  // ============================================================

  const savePermissions =
    async () => {

      if (!selectedRole) {

        return;

      }


      if (
        selectedRole.name
          ?.trim()
          .toLowerCase()
        === "admin"
      ) {

        setError(
          "Admin has automatic full access. Individual Admin permission assignments are not required."
        );

        return;

      }


      try {

        setSaving(true);

        setError("");


        const originalPermissions =
          await apiRequest(
            `/roles/${selectedRole.id}/permissions`
          );


        const originalIds =
          new Set(
            originalPermissions.map(
              permission =>
                getPermissionId(
                  permission
                )
            )
          );


        const selectedIds =
          new Set(
            rolePermissions.map(
              permission =>
                getPermissionId(
                  permission
                )
            )
          );


        const permissionsToAdd =
          [
            ...selectedIds,
          ].filter(
            id =>
              !originalIds.has(
                id
              )
          );


        const permissionsToRemove =
          [
            ...originalIds,
          ].filter(
            id =>
              !selectedIds.has(
                id
              )
          );


        for (
          const permissionId
          of permissionsToAdd
        ) {

          await apiRequest(
            `/roles/${selectedRole.id}/permissions`,
            {
              method:
                "POST",

              body:
                JSON.stringify({
                  permission_id:
                    Number(
                      permissionId
                    ),
                }),
            }
          );

        }


        for (
          const permissionId
          of permissionsToRemove
        ) {

          await apiRequest(
            `/roles/${selectedRole.id}/permissions/${permissionId}`,
            {
              method:
                "DELETE",
            }
          );

        }


        await fetchRolePermissions(
          selectedRole.id
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
  // SUMMARY
  // ============================================================

  const activeRoles =
    useMemo(
      () =>
        roles.filter(
          role =>
            role.is_active
        ).length,
      [roles]
    );


  const inactiveRoles =
    roles.length -
    activeRoles;


  // ============================================================
  // AUTH
  // ============================================================

  if (!isAuthenticated) {

    return (

      <div className="page-container roles-page">
<style>{`
.roles-page{--rp-border:#e7eaf0;--rp-text:#172033;--rp-muted:#687386;--rp-soft:#f7f8fb}
.roles-page .page-header{margin-bottom:24px}
.roles-page .admin-summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
.roles-page .admin-summary-card{background:#fff;border:1px solid var(--rp-border);border-radius:14px;padding:18px 20px;box-shadow:0 2px 8px rgba(23,32,51,.04)}
.roles-page .admin-summary-card span{display:block;color:var(--rp-muted);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.roles-page .admin-summary-card strong{display:block;margin-top:7px;color:var(--rp-text);font-size:27px}
.roles-page .section-card{background:#fff;border:1px solid var(--rp-border);border-radius:16px;box-shadow:0 3px 12px rgba(23,32,51,.045);overflow:hidden}
.roles-page .section-card-header{padding:22px 24px;border-bottom:1px solid var(--rp-border)}
.roles-page .section-card-header h3{margin:4px 0;color:var(--rp-text)}
.roles-page .section-card-header p{margin:0;color:var(--rp-muted)}
.roles-page .admin-card-kicker,.roles-page .admin-page-kicker{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#748096}
.roles-page .table-container{overflow-x:auto}
.roles-page .admin-data-table{min-width:760px}
.roles-page .admin-data-table tbody tr{transition:background .15s}
.roles-page .admin-data-table tbody tr:hover{background:#fafbfc}
.roles-page .admin-name-cell{display:flex;align-items:center;gap:11px}
.roles-page .admin-row-icon,.roles-page .admin-page-icon{display:inline-flex;align-items:center;justify-content:center;border-radius:10px;background:#eef2ff;color:#4f46e5;font-weight:800;font-size:11px}
.roles-page .admin-row-icon{width:34px;height:34px}.roles-page .admin-page-icon{width:40px;height:40px;margin-right:10px}
.roles-page .admin-name-cell strong{display:block;color:var(--rp-text)}
.roles-page .admin-name-cell small{display:block;color:#8a94a6;margin-top:2px}
.roles-page .admin-description{color:#596579}
.roles-page .row-number{color:#98a1b1;font-size:12px;font-weight:700}
.roles-page .action-buttons{display:flex;gap:8px;flex-wrap:wrap}
.roles-page .permissions-button{border:1px solid #d8defa;background:#f5f6ff;color:#4f46e5;border-radius:8px;padding:7px 11px;font-weight:700;cursor:pointer}
.roles-page .permissions-button:hover{background:#eef0ff}
.roles-page .admin-modal-overlay{background:rgba(15,23,42,.42);backdrop-filter:blur(3px);padding:24px}
.roles-page .admin-permissions-modal{width:min(1050px,100%);max-height:90vh;overflow:hidden;background:#fff;border:1px solid var(--rp-border);border-radius:18px;box-shadow:0 20px 60px rgba(15,23,42,.18);display:flex;flex-direction:column}
.roles-page .permissions-modal-header{display:flex;justify-content:space-between;gap:20px;padding:22px 24px;border-bottom:1px solid var(--rp-border)}
.roles-page .permissions-modal-header h3{margin:4px 0;color:var(--rp-text);font-size:21px}
.roles-page .permissions-modal-header p{margin:0;color:var(--rp-muted)}
.roles-page .modal-close-button{border:0;background:#f3f5f8;border-radius:9px;width:34px;height:34px;font-size:22px;color:#5d6778;cursor:pointer}
.roles-page .admin-info-message{margin:16px 24px 0;padding:13px 15px;border:1px solid #ddd6fe;background:#f7f5ff;border-radius:10px;color:#5b21b6}
.roles-page .admin-info-message strong{display:block;margin-bottom:3px}
.roles-page .admin-info-message span{font-size:13px;color:#6b5b8e}
.roles-page .modal-error{margin:14px 24px 0}
.roles-page .permissions-modal-body{overflow:auto;padding:20px 24px}
.roles-page .admin-permission-section{border:1px solid var(--rp-border);border-radius:12px;margin-bottom:14px;overflow:hidden}
.roles-page .permission-section-header{display:flex;justify-content:space-between;align-items:center;gap:15px;padding:14px 16px;background:#fafbfc;border-bottom:1px solid var(--rp-border)}
.roles-page .permission-section-header h4{margin:0;color:var(--rp-text)}
.roles-page .permission-group-description{font-size:12px;color:#8791a2}
.roles-page .permission-assignment-count{font-size:12px;font-weight:800;color:#596579}
.roles-page .permission-table-wrapper{overflow-x:auto}
.roles-page .permission-table{width:100%;border-collapse:collapse;min-width:650px}
.roles-page .permission-table th,.roles-page .permission-table td{padding:11px 14px;border-bottom:1px solid #eef0f3;text-align:left}
.roles-page .permission-table th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#7b8596}
.roles-page .permission-table tr:last-child td{border-bottom:0}
.roles-page .permission-row-assigned{background:#fbfcff}
.roles-page .permission-name-cell{display:flex;align-items:center;gap:10px;color:var(--rp-text);cursor:pointer}
.roles-page .permission-name-cell input{width:16px;height:16px;accent-color:#4f46e5}
.roles-page .permission-description{color:#697386;font-size:13px}
.roles-page .permission-status-column{white-space:nowrap}
.roles-page .permission-assigned,.roles-page .permission-not-assigned{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:800}
.roles-page .permission-assigned{background:#ecfdf3;color:#15803d}.roles-page .permission-not-assigned{background:#f3f4f6;color:#6b7280}
.roles-page .permissions-modal-footer{display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid var(--rp-border);background:#fafbfc}
@media(max-width:850px){.roles-page .admin-summary-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.roles-page .admin-summary-grid{grid-template-columns:1fr}.roles-page .permissions-modal-header{padding:18px}.roles-page .permissions-modal-body{padding:14px}.roles-page .permissions-modal-footer{padding:14px}.roles-page .admin-modal-overlay{padding:10px}}
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
          Loading roles...
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
                Roles
              </h2>

            </div>

          </div>

          <p>
            Manage ServiOps roles and their access permissions.
          </p>

        </div>


        <button
          type="button"
          className="primary-button"
          onClick={
            handleAddRole
          }
        >
          + Add Role
        </button>

      </div>


      {/* ======================================================
          SUMMARY
      ======================================================= */}

      <div className="admin-summary-grid">

        <div className="admin-summary-card">

          <span>
            Total Roles
          </span>

          <strong>
            {roles.length}
          </strong>

        </div>


        <div className="admin-summary-card">

          <span>
            Active
          </span>

          <strong>
            {activeRoles}
          </strong>

        </div>


        <div className="admin-summary-card">

          <span>
            Inactive
          </span>

          <strong>
            {inactiveRoles}
          </strong>

        </div>


        <div className="admin-summary-card">

          <span>
            Permissions Available
          </span>

          <strong>
            {permissions.length}
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
          ROLE TABLE
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <span className="admin-card-kicker">
              Access Control
            </span>

            <h3>
              Role Directory
            </h3>

            <p>
              Configure roles and manage their permissions.
            </p>

          </div>

        </div>


        {roles.length === 0 ? (

          <div className="empty-state">

            <strong>
              No roles found
            </strong>

            <p>
              Create your first ServiOps role to get started.
            </p>

          </div>

        ) : (

          <div className="table-container">

            <table className="data-table admin-data-table">

              <thead>

                <tr>

                  <th>
                    #
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Description
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

                {roles.map(
                  (
                    role,
                    index
                  ) => (

                    <tr
                      key={
                        role.id
                      }
                    >

                      <td>

                        <span className="row-number">
                          {index + 1}
                        </span>

                      </td>


                      <td>

                        <div className="admin-name-cell">

                          <span className="admin-row-icon">
                            RL
                          </span>

                          <div>

                            <button type="button" className="entity-link entity-link-block" onClick={() => handleEditRole(role)}>
                              <strong>{role.name}</strong>
                            </button>

                            <small>
                              Role
                            </small>

                          </div>

                        </div>

                      </td>


                      <td>

                        <span className="admin-description">
                          {
                            role.description ||
                            "No description provided."
                          }
                        </span>

                      </td>


                      <td>

                        <span
                          className={
                            role.is_active
                              ? "status-active"
                              : "status-inactive"
                          }
                        >
                          {role.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </td>


                      <td>

                        <div className="action-buttons">

                          <button
                            type="button"
                            className="edit-button"
                            onClick={() =>
                              handleEditRole(
                                role
                              )
                            }
                          >
                            Edit
                          </button>


                          <button
                            type="button"
                            className="permissions-button"
                            onClick={() =>
                              handleManagePermissions(
                                role
                              )
                            }
                          >
                            Permissions
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* ======================================================
          PERMISSIONS MODAL
      ======================================================= */}

      {showPermissionModal &&
        selectedRole && (

        <div
          className="modal-overlay admin-modal-overlay"
          onClick={
            handleClosePermissionModal
          }
        >

          <div
            className="permissions-modal admin-permissions-modal"
            onClick={
              event =>
                event.stopPropagation()
            }
          >


            {/* HEADER */}

            <div className="permissions-modal-header">

              <div>

                <span className="admin-card-kicker">
                  Access Control
                </span>

                <h3>
                  {selectedRole.name}
                </h3>

                <p>

                  {selectedRole.name
                    ?.trim()
                    .toLowerCase()
                    === "admin"

                    ? "Admin has automatic full access to ServiOps."

                    : "Manage permissions assigned to this role."}

                </p>

              </div>


              <button
                type="button"
                className="modal-close-button"
                onClick={
                  handleClosePermissionModal
                }
                disabled={
                  saving
                }
              >
                ×
              </button>

            </div>


            {/* ADMIN NOTICE */}

            {selectedRole.name
              ?.trim()
              .toLowerCase()
              === "admin" && (

              <div className="admin-info-message">

                <strong>
                  Full Access
                </strong>

                <span>
                  Admin automatically has access to all active application permissions, including newly created permissions.
                </span>

              </div>

            )}


            {/* ERROR */}

            {error && (

              <div className="error-message modal-error">
                {error}
              </div>

            )}


            {/* BODY */}

            <div className="permissions-modal-body">

              {permissionsLoading ? (

                <div className="loading-state">
                  Loading permissions...
                </div>

              ) : permissions.length === 0 ? (

                <div className="empty-state">

                  <strong>
                    No permissions available
                  </strong>

                  <p>
                    Create permissions from the Permissions page.
                  </p>

                </div>

              ) : (

                Object.entries(
                  permissionGroups
                ).map(
                  (
                    [
                      groupName,
                      groupPermissions,
                    ]
                  ) => {

                    if (
                      groupPermissions.length ===
                      0
                    ) {

                      return null;

                    }


                    const assignedCount =
                      groupPermissions.filter(
                        permission =>
                          isPermissionAssigned(
                            permission.id
                          )
                      ).length;


                    return (

                      <div
                        className="permission-section admin-permission-section"
                        key={
                          groupName
                        }
                      >

                        <div className="permission-section-header">

                          <div>

                            <h4>
                              {groupName}
                            </h4>

                            <span className="permission-group-description">

                              {
                                groupPermissions.length
                              }

                              {" "}
                              available

                            </span>

                          </div>


                          <span className="permission-assignment-count">

                            {selectedRole.name
                              ?.trim()
                              .toLowerCase()
                              === "admin"

                              ? "Full access"

                              : `${assignedCount} / ${groupPermissions.length} assigned`}

                          </span>

                        </div>


                        <div className="permission-table-wrapper">

                          <table className="permission-table">

                            <thead>

                              <tr>

                                <th>
                                  Permission
                                </th>

                                <th>
                                  Description
                                </th>

                                <th className="permission-status-column">
                                  Status
                                </th>

                              </tr>

                            </thead>


                            <tbody>

                              {groupPermissions.map(
                                permission => {

                                  const checked =
                                    isPermissionAssigned(
                                      permission.id
                                    );


                                  const isAdmin =
                                    selectedRole.name
                                      ?.trim()
                                      .toLowerCase()
                                    === "admin";


                                  return (

                                    <tr
                                      key={
                                        permission.id
                                      }
                                      className={
                                        (
                                          checked ||
                                          isAdmin
                                        )
                                          ? "permission-row-assigned"
                                          : ""
                                      }
                                    >

                                      <td>

                                        <label className="permission-name-cell">

                                          <input
                                            type="checkbox"
                                            checked={
                                              isAdmin
                                                ? true
                                                : checked
                                            }
                                            onChange={() =>
                                              handlePermissionToggle(
                                                permission.id
                                              )
                                            }
                                            disabled={
                                              saving ||
                                              isAdmin
                                            }
                                          />

                                          <strong>
                                            {
                                              permission.name
                                            }
                                          </strong>

                                        </label>

                                      </td>


                                      <td className="permission-description">

                                        {
                                          permission.description ||
                                          "No description."
                                        }

                                      </td>


                                      <td className="permission-status-column">

                                        <span
                                          className={
                                            (
                                              checked ||
                                              isAdmin
                                            )
                                              ? "permission-assigned"
                                              : "permission-not-assigned"
                                          }
                                        >

                                          {isAdmin
                                            ? "Full Access"
                                            : checked
                                              ? "Assigned"
                                              : "Not assigned"}

                                        </span>

                                      </td>

                                    </tr>

                                  );

                                }
                              )}

                            </tbody>

                          </table>

                        </div>

                      </div>

                    );

                  }
                )

              )}

            </div>


            {/* FOOTER */}

            <div className="permissions-modal-footer">

              <button
                type="button"
                className="secondary-button"
                onClick={
                  handleClosePermissionModal
                }
                disabled={
                  saving
                }
              >
                Close
              </button>


              {selectedRole.name
                ?.trim()
                .toLowerCase()
                !== "admin" && (

                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    savePermissions
                  }
                  disabled={
                    saving ||
                    permissionsLoading
                  }
                >

                  {saving
                    ? "Saving..."
                    : "Save Permissions"}

                </button>

              )}

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


export default Roles;


