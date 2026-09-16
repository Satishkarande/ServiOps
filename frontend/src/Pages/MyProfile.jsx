import {
  useEffect,
  useState,
} from "react";

import { API_URL } from "../config";
import {
  useAuth,
} from "../auth/AuthContext";




function MyProfile() {

  const {
    accessToken,
    isAuthenticated,
  } = useAuth();


  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [savingUsername, setSavingUsername] =
    useState(false);

  const [usernameMessage, setUsernameMessage] =
    useState("");


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

              Authorization:
                `Bearer ${accessToken}`,

              ...(options.body
                ? {
                    "Content-Type":
                      "application/json",
                  }
                : {}),

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


          if (data?.detail) {

            message =
              typeof data.detail ===
              "string"
                ? data.detail
                : JSON.stringify(
                    data.detail
                  );

          }

        } catch {
          // Keep default message.
        }


        throw new Error(
          message
        );

      }


      return response.json();

    };


  // ============================================================
  // LOAD PROFILE
  // ============================================================

  useEffect(() => {

    if (
      !isAuthenticated ||
      !accessToken
    ) {

      setLoading(false);

      return;

    }


    const loadProfile =
      async () => {

        try {

          setLoading(true);

          setError("");


          const data =
            await apiRequest(
              "/users/me"
            );


          setProfile(data);
          setUsername(data?.username || "");

        } catch (error) {

          console.error(
            "Failed to load profile:",
            error
          );

          setError(
            error.message
          );

        } finally {

          setLoading(false);

        }

      };


    loadProfile();

  }, [
    accessToken,
    isAuthenticated,
  ]);


  // ============================================================
  // HELPERS
  // ============================================================

  const getInitials =
    () => {

      if (!profile) {
        return "U";
      }


      const first =
        profile.first_name ||
        "";

      const last =
        profile.last_name ||
        "";


      const initials =
        `${first.charAt(0)}${last.charAt(0)}`
          .toUpperCase();


      return initials ||
        "U";

    };


  const getFullName =
    () => {

      if (!profile) {
        return "User";
      }


      return [
        profile.first_name,
        profile.last_name,
      ]
        .filter(Boolean)
        .join(" ") ||
        "User";

    };


  const getDepartmentName =
    () => {

      return (
        profile?.department?.name ||
        "Not assigned"
      );

    };


  const getSubDepartmentName =
    () => {

      return (
        profile?.sub_department?.name ||
        "Not assigned"
      );

    };


  const getRoleName =
    () => {

      return (
        profile?.role?.name ||
        "Not assigned"
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
        Loading profile...
      </div>

    );

  }


  // ============================================================
  // ERROR
  // ============================================================

  if (error && !profile) {

    return (

      <div className="page-container">

        <div className="error-message">
          {error}
        </div>

      </div>

    );

  }


  // ============================================================
  // UI
  // ============================================================

  return (

    <div className="profile-page">

      <style>{`
        .profile-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 6px 0 40px;
          color: #0f172a;
        }

        .profile-hero {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 22px;
        }

        .profile-kicker {
          display: inline-block;
          margin-bottom: 6px;
          color: #2563eb;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .profile-title {
          margin: 0;
          font-size: 30px;
          line-height: 1.15;
          letter-spacing: -0.7px;
          color: #0b1730;
        }

        .profile-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .profile-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 12px;
          border: 1px solid #dbe7f5;
          border-radius: 999px;
          background: #f8fbff;
          color: #334155;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .profile-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
        }

        .profile-card {
          margin-bottom: 18px;
          border: 1px solid #dbe4ef;
          border-radius: 14px;
          background: #ffffff;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.055);
          overflow: hidden;
        }

        .profile-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 22px;
          border-bottom: 1px solid #e7edf5;
          background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
        }

        .profile-card-header h3 {
          margin: 0;
          font-size: 16px;
          color: #0f172a;
        }

        .profile-card-header p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 12px;
        }

        .profile-card-body {
          padding: 22px;
        }

        .profile-summary {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 22px;
          background:
            radial-gradient(circle at 100% 0%, rgba(37, 99, 235, 0.08), transparent 34%),
            linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
        }

        .profile-avatar {
          width: 78px;
          height: 78px;
          flex: 0 0 78px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          background: #eaf2ff;
          border: 1px solid #d6e5ff;
          color: #2563eb;
          font-size: 25px;
          font-weight: 800;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
        }

        .profile-summary-name {
          margin: 0;
          font-size: 23px;
          line-height: 1.2;
          letter-spacing: -0.35px;
        }

        .profile-summary-role {
          margin: 6px 0 0;
          color: #334155;
          font-size: 13px;
          font-weight: 700;
        }

        .profile-summary-org {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 12px;
        }

        .profile-summary-code {
          display: inline-flex;
          margin-top: 10px;
          padding: 5px 9px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #475569;
          font-size: 11px;
          font-weight: 700;
        }

        .profile-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px 20px;
        }

        .profile-field {
          min-width: 0;
        }

        .profile-field-full {
          grid-column: 1 / -1;
        }

        .profile-label {
          display: block;
          margin-bottom: 7px;
          color: #334155;
          font-size: 12px;
          font-weight: 700;
        }

        .profile-edit-row {
          display: flex;
          gap: 9px;
          align-items: stretch;
        }

        .profile-input {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #0f172a;
          font-size: 13px;
          outline: none;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .profile-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.11);
        }

        .profile-input:disabled {
          background: #f8fafc;
          border-color: #e2e8f0;
          color: #64748b;
          cursor: not-allowed;
        }

        .profile-save-button {
          flex: 0 0 auto;
          min-width: 78px;
          border: 0;
          border-radius: 8px;
          padding: 0 16px;
          background: #2563eb;
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.18);
          transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
        }

        .profile-save-button:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(37, 99, 235, 0.23);
        }

        .profile-save-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .profile-help {
          margin: 7px 0 0;
          color: #94a3b8;
          font-size: 11px;
        }

        .profile-success {
          margin: 8px 0 0;
          color: #15803d;
          font-size: 12px;
          font-weight: 700;
        }

        .profile-manager {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 2px;
        }

        .profile-manager-avatar {
          width: 58px;
          height: 58px;
          flex: 0 0 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #eaf2ff;
          border: 1px solid #d6e5ff;
          color: #2563eb;
          font-size: 17px;
          font-weight: 800;
        }

        .profile-manager-name {
          margin: 0;
          font-size: 15px;
          color: #0f172a;
        }

        .profile-manager-line {
          margin-top: 4px;
          color: #64748b;
          font-size: 12px;
        }

        .profile-manager-role {
          display: inline-flex;
          margin-top: 7px;
          padding: 4px 8px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #475569;
          font-size: 10px;
          font-weight: 700;
        }

        .profile-team-count {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 7px 10px;
          border: 1px solid #dbe7f5;
          border-radius: 8px;
          background: #f8fbff;
        }

        .profile-team-count strong {
          color: #2563eb;
          font-size: 16px;
        }

        .profile-team-count span {
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .profile-table-wrap {
          overflow-x: auto;
        }

        .profile-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
        }

        .profile-table th {
          padding: 11px 14px;
          text-align: left;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .profile-table td {
          padding: 13px 14px;
          border-bottom: 1px solid #edf2f7;
          color: #475569;
          font-size: 12px;
          vertical-align: middle;
        }

        .profile-table tbody tr:hover {
          background: #f8fbff;
        }

        .profile-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .profile-table-name {
          color: #0f172a;
          font-weight: 700;
        }

        .profile-empty {
          padding: 28px 22px;
          text-align: center;
          border: 1px dashed #d6dee9;
          border-radius: 10px;
          background: #f8fafc;
        }

        .profile-empty strong {
          display: block;
          color: #334155;
          font-size: 13px;
        }

        .profile-empty p {
          margin: 5px 0 0;
          color: #94a3b8;
          font-size: 12px;
        }

        .profile-error {
          margin-bottom: 16px;
          padding: 11px 13px;
          border: 1px solid #fecaca;
          border-radius: 9px;
          background: #fff7f7;
          color: #b91c1c;
          font-size: 12px;
          font-weight: 600;
        }

        .profile-loading {
          padding: 40px;
          text-align: center;
          color: #64748b;
          font-size: 13px;
        }

        @media (max-width: 760px) {
          .profile-page {
            padding: 0 0 30px;
          }

          .profile-hero {
            align-items: flex-start;
            flex-direction: column;
          }

          .profile-title {
            font-size: 26px;
          }

          .profile-form-grid {
            grid-template-columns: 1fr;
          }

          .profile-field-full {
            grid-column: auto;
          }

          .profile-card-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .profile-summary {
            align-items: flex-start;
          }

          .profile-edit-row {
            flex-direction: column;
          }

          .profile-save-button {
            min-height: 40px;
          }
        }
      `}</style>

      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

      <div className="profile-hero">

        <div>

          <span className="profile-kicker">
            My Account
          </span>

          <h1 className="profile-title">
            My Profile
          </h1>

          <p className="profile-subtitle">
            Manage your username and view your ServiOps organization details.
          </p>

        </div>

        <div className="profile-status-pill">
          <span className="profile-status-dot" />
          Active account
        </div>

      </div>


      {error && (
        <div className="profile-error">
          {error}
        </div>
      )}


      {/* ======================================================
          PROFILE SUMMARY
      ======================================================= */}

      <section className="profile-card">

        <div className="profile-summary">

          <div className="profile-avatar">
            {getInitials()}
          </div>

          <div>

            <h2 className="profile-summary-name">
              {getFullName()}
            </h2>

            <p className="profile-summary-role">
              {getRoleName()}
            </p>

            <p className="profile-summary-org">
              {getDepartmentName()} · {getSubDepartmentName()}
            </p>

            <span className="profile-summary-code">
              Employee {profile?.employee_code || "—"}
            </span>

          </div>

        </div>

      </section>


      {/* ======================================================
          PERSONAL INFORMATION
      ======================================================= */}

      <section className="profile-card">

        <div className="profile-card-header">

          <div>
            <h3>Personal Information</h3>
            <p>Your basic employee information.</p>
          </div>

        </div>

        <div className="profile-card-body">

          <div className="profile-form-grid">

            {/* USERNAME */}

            <div className="profile-field profile-field-full">

              <label className="profile-label">
                Username
              </label>

              <div className="profile-edit-row">

                <input
                  className="profile-input"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  placeholder="Choose a username"
                  maxLength={50}
                  autoComplete="username"
                />

                <button
                  type="button"
                  className="profile-save-button"
                  disabled={savingUsername}
                  onClick={async () => {

                    try {

                      setSavingUsername(true);
                      setError("");
                      setUsernameMessage("");

                      const response =
                        await apiRequest(
                          "/users/me/username",
                          {
                            method: "PATCH",
                            body: JSON.stringify({
                              username: username.trim(),
                            }),
                          }
                        );

                      setUsername(
                        response.username || ""
                      );

                      setProfile((previous) => ({
                        ...previous,
                        username:
                          response.username || "",
                      }));

                      setUsernameMessage(
                        "Username updated successfully."
                      );

                    } catch (error) {

                      console.error(
                        "Failed to update username:",
                        error
                      );

                      setError(error.message);

                    } finally {

                      setSavingUsername(false);

                    }

                  }}
                >
                  {savingUsername ? "Saving..." : "Save"}
                </button>

              </div>

              <p className="profile-help">
                You can change only your ServiOps username. Other employee information is managed by administrators.
              </p>

              {usernameMessage && (
                <p className="profile-success">
                  {usernameMessage}
                </p>
              )}

            </div>


            <div className="profile-field">

              <label className="profile-label">
                First Name
              </label>

              <input
                className="profile-input"
                value={profile?.first_name || ""}
                disabled
              />

            </div>


            <div className="profile-field">

              <label className="profile-label">
                Last Name
              </label>

              <input
                className="profile-input"
                value={profile?.last_name || ""}
                disabled
              />

            </div>


            <div className="profile-field">

              <label className="profile-label">
                Employee Code
              </label>

              <input
                className="profile-input"
                value={profile?.employee_code || ""}
                disabled
              />

            </div>


            <div className="profile-field">

              <label className="profile-label">
                Email
              </label>

              <input
                className="profile-input"
                value={profile?.email || ""}
                disabled
              />

            </div>

          </div>

        </div>

      </section>


      {/* ======================================================
          ORGANIZATION
      ======================================================= */}

      <section className="profile-card">

        <div className="profile-card-header">

          <div>
            <h3>Organization</h3>
            <p>Your current department, sub-department and role.</p>
          </div>

        </div>

        <div className="profile-card-body">

          <div className="profile-form-grid">

            <div className="profile-field">

              <label className="profile-label">
                Department
              </label>

              <input
                className="profile-input"
                value={getDepartmentName()}
                disabled
              />

            </div>


            <div className="profile-field">

              <label className="profile-label">
                Sub Department
              </label>

              <input
                className="profile-input"
                value={getSubDepartmentName()}
                disabled
              />

            </div>


            <div className="profile-field">

              <label className="profile-label">
                Role
              </label>

              <input
                className="profile-input"
                value={getRoleName()}
                disabled
              />

            </div>

          </div>

        </div>

      </section>


      {/* ======================================================
          REPORTING MANAGER
      ======================================================= */}

      <section className="profile-card">

        <div className="profile-card-header">

          <div>
            <h3>Reporting Manager</h3>
            <p>The person you report to.</p>
          </div>

        </div>

        <div className="profile-card-body">

          {profile?.manager ? (

            <div className="profile-manager">

              <div className="profile-manager-avatar">

                {(
                  profile.manager.first_name?.[0] || ""
                ).toUpperCase()}

                {(
                  profile.manager.last_name?.[0] || ""
                ).toUpperCase()}

              </div>

              <div>

                <h4 className="profile-manager-name">
                  {profile.manager.first_name}{" "}
                  {profile.manager.last_name}
                </h4>

                <div className="profile-manager-line">
                  {profile.manager.employee_code}
                </div>

                <div className="profile-manager-line">
                  {profile.manager.department?.name || "Department not assigned"}
                  {" · "}
                  {profile.manager.sub_department?.name || "Sub Department not assigned"}
                </div>

                <span className="profile-manager-role">
                  {profile.manager.role?.name || "Role not assigned"}
                </span>

              </div>

            </div>

          ) : (

            <div className="profile-empty">

              <strong>
                No reporting manager
              </strong>

              <p>
                No manager is currently assigned to your profile.
              </p>

            </div>

          )}

        </div>

      </section>


      {/* ======================================================
          MY TEAM
      ======================================================= */}

      <section className="profile-card">

        <div className="profile-card-header">

          <div>
            <h3>My Team</h3>
            <p>People who directly report to you.</p>
          </div>

          <div className="profile-team-count">

            <strong>
              {profile?.team?.length || 0}
            </strong>

            <span>
              Direct Reports
            </span>

          </div>

        </div>


        {!profile?.team ||
        profile.team.length === 0 ? (

          <div className="profile-card-body">

            <div className="profile-empty">

              <strong>
                No direct reports
              </strong>

              <p>
                There are currently no active users reporting directly to you.
              </p>

            </div>

          </div>

        ) : (

          <div className="profile-table-wrap">

            <table className="profile-table">

              <thead>

                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Sub Department</th>
                  <th>Role</th>
                </tr>

              </thead>

              <tbody>

                {profile.team.map(
                  (member, index) => (

                    <tr key={member.id}>

                      <td>
                        {index + 1}
                      </td>

                      <td>
                        {member.employee_code}
                      </td>

                      <td className="profile-table-name">
                        {member.first_name}{" "}
                        {member.last_name}
                      </td>

                      <td>
                        {member.email}
                      </td>

                      <td>
                        {member.department?.name || "—"}
                      </td>

                      <td>
                        {member.sub_department?.name || "—"}
                      </td>

                      <td>
                        {member.role?.name || "—"}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>

  );

}

export default MyProfile;


