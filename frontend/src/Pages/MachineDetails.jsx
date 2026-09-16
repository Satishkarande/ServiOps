import {
  useEffect,
  useState,
} from "react";

import { API_URL } from "../config";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { useAuth } from "../auth/AuthContext";


function MachineDetails() {

  const {
    accessToken,
    isAuthenticated,
  } = useAuth();

  const navigate =
    useNavigate();

  const {
    machineId,
  } = useParams();


  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ============================================================
  // FETCH MACHINE DETAILS
  // ============================================================

  useEffect(() => {

    if (
      !isAuthenticated ||
      !accessToken ||
      !machineId
    ) {

      setLoading(false);

      return;

    }


    const fetchDetails =
      async () => {

        try {

          setLoading(true);

          setError("");


          const response =
            await fetch(
              `${API_URL}/machines/${machineId}/details`,
              {
                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                },
              }
            );


          if (!response.ok) {

            const text =
              await response.text();

            throw new Error(
              `Failed to fetch machine details: ${response.status} ${text}`
            );

          }


          const result =
            await response.json();


          setData(result);

        } catch (err) {

          console.error(
            "Failed to fetch machine details:",
            err
          );

          setError(
            err.message
          );

        } finally {

          setLoading(false);

        }

      };


    fetchDetails();

  }, [
    accessToken,
    isAuthenticated,
    machineId,
  ]);


  // ============================================================
  // AUTHENTICATION
  // ============================================================

  if (!isAuthenticated) {

    return (

      <div className="machine-details-page"><div className="empty-state">

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

      <div className="machine-details-page"><div className="loading-state">
        Loading machine details...
      </div></div>

    );

  }


  // ============================================================
  // ERROR / NOT FOUND
  // ============================================================

  if (
    error ||
    !data
  ) {

    return (

      <div className="machine-details-page">

        <div className="page-header">

          <div>

            <span className="admin-page-kicker">
              Machines
            </span>

            <h2>
              Machine Details
            </h2>

          </div>


          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate("/machines")
            }
          >
            ← Back to Machines
          </button>

        </div>


        <div className="error-message">
          {error || "Machine not found."}
        </div>

      </div>

    );

  }


  const {
    machine,
    customer,
    plant,
    service_history,
    spare_parts_used,
  } = data;


  // ============================================================
  // HELPERS
  // ============================================================

  const formatDate =
    value => {

      if (!value) {
        return "-";
      }

      return new Date(
        value
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

    };


  const formatDateTime =
    value => {

      if (!value) {
        return "-";
      }

      return new Date(
        value
      ).toLocaleString(
        "en-IN"
      );

    };


  const getStatusClass =
    status => {

      switch (status) {

        case "OPEN":
          return "status-open";

        case "ASSIGNED":
          return "status-assigned";

        case "IN_PROGRESS":
          return "status-active";

        case "RESOLVED":
          return "status-resolved";

        case "CLOSE_REQUESTED":
          return "status-close-requested";

        case "CLOSED":
          return "status-closed";

        case "CANCELLED":
          return "status-cancelled";

        default:
          return "status-inactive";

      }

    };


  const getPriorityClass =
    priority => {

      switch (priority) {

        case "LOW":
          return "priority-low";

        case "MEDIUM":
          return "priority-medium";

        case "HIGH":
          return "priority-high";

        case "CRITICAL":
          return "priority-critical";

        default:
          return "";

      }

    };


  const getUserName =
    user => {

      if (!user) {
        return "-";
      }

      const fullName =
        `${user.first_name || ""} ${user.last_name || ""}`
          .trim();

      return (
        fullName ||
        user.employee_code ||
        "-"
      );

    };


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <div className="machine-details-page">
      <style>{`
.machine-details-page{--md-text:#172033;--md-muted:#667085;--md-border:#e5e7eb;--md-shadow:0 12px 32px rgba(15,23,42,.07);color:var(--md-text)}
.machine-details-page *{box-sizing:border-box}
.machine-details-page .page-header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:24px}
.machine-details-page .admin-page-kicker{display:inline-block;margin-bottom:7px;color:#64748b;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.machine-details-page .page-header h2{margin:0;font-size:28px;line-height:1.2;letter-spacing:-.02em}.machine-details-page .page-header p{margin:8px 0 0;color:var(--md-muted);font-size:14px}
.machine-details-page .admin-summary-grid{margin-bottom:22px}
.machine-details-page .admin-summary-card{border:1px solid var(--md-border);border-radius:14px;background:#fff;box-shadow:0 5px 18px rgba(15,23,42,.045);transition:transform .15s,box-shadow .15s}
.machine-details-page .admin-summary-card:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(15,23,42,.07)}
.machine-details-page .section-card{margin-top:20px;border:1px solid var(--md-border);border-radius:16px;background:#fff;box-shadow:var(--md-shadow);overflow:hidden}
.machine-details-page .section-card-header{padding:20px 22px;border-bottom:1px solid #eef0f3;background:linear-gradient(180deg,#fff 0%,#fbfcfe 100%)}
.machine-details-page .section-card-header h3{margin:0;font-size:17px}.machine-details-page .section-card-header p{margin:5px 0 0;color:var(--md-muted);font-size:13px}
.machine-details-page .section-card>.form-grid{padding:22px}.machine-details-page .form-group{padding:2px 0}.machine-details-page .form-group label{display:block;margin-bottom:7px;color:#667085;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.03em}.machine-details-page .form-group>div{min-height:42px;padding:10px 12px;border:1px solid #eef0f3;border-radius:9px;background:#f8fafc;color:#172033;font-size:14px}
.machine-details-page .table-container{border:0;border-radius:0;box-shadow:none;overflow-x:auto}.machine-details-page .data-table{min-width:1000px}.machine-details-page .data-table th{background:#f8fafc;color:#667085;font-size:11px;letter-spacing:.04em;text-transform:uppercase}.machine-details-page .data-table td{vertical-align:middle}.machine-details-page .data-table tbody tr:hover{background:#fbfcff}
.machine-details-page .history-row-number{display:inline-grid;min-width:26px;height:26px;place-items:center;border:1px solid #e5e7eb;border-radius:8px;background:#f8fafc;color:#667085;font-size:12px;font-weight:650}
.machine-details-page .status-active,.machine-details-page .status-inactive{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}.machine-details-page .status-active{background:#f0fdf4;color:#15803d}.machine-details-page .status-inactive{background:#f1f5f9;color:#64748b}
.machine-details-page .status-active:before,.machine-details-page .status-inactive:before{content:"";width:6px;height:6px;margin-right:7px;border-radius:50%;background:currentColor;opacity:.75}
.machine-details-page .ticket-priority{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:700}.machine-details-page .priority-low{background:#f0fdf4;color:#15803d}.machine-details-page .priority-medium{background:#fff8df;color:#b45309}.machine-details-page .priority-high{background:#fff0f2;color:#dc2626}.machine-details-page .priority-critical{background:#f3efff;color:#6d28d9}
.machine-details-page .status-open,.machine-details-page .status-assigned,.machine-details-page .status-resolved,.machine-details-page .status-close-requested,.machine-details-page .status-closed,.machine-details-page .status-cancelled{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}.machine-details-page .status-open{background:#eaf2ff;color:#1d4ed8}.machine-details-page .status-assigned{background:#f1f5f9;color:#475569}.machine-details-page .status-resolved,.machine-details-page .status-closed{background:#f0fdf4;color:#15803d}.machine-details-page .status-close-requested{background:#fff4e8;color:#c2410c}.machine-details-page .status-cancelled{background:#fff0f2;color:#dc2626}
.machine-details-page .status-open:before,.machine-details-page .status-assigned:before,.machine-details-page .status-resolved:before,.machine-details-page .status-close-requested:before,.machine-details-page .status-closed:before,.machine-details-page .status-cancelled:before{content:"";width:6px;height:6px;margin-right:7px;border-radius:50%;background:currentColor;opacity:.75}
.machine-details-page .action-buttons{display:flex;gap:8px;flex-wrap:wrap}.machine-details-page .secondary-button,.machine-details-page .edit-button{border-radius:9px;transition:transform .15s,background .15s,border-color .15s}.machine-details-page .secondary-button:hover,.machine-details-page .edit-button:hover{transform:translateY(-1px)}
.machine-details-page .table-secondary-text{margin-top:3px;color:#64748b;font-size:12px}.machine-details-page .empty-state{padding:34px 20px;text-align:center}.machine-details-page .error-message{margin-bottom:18px}
@media(max-width:900px){.machine-details-page .page-header{align-items:stretch;flex-direction:column}.machine-details-page .page-header h2{font-size:24px}}
`}</style>



      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="page-header">

        <div>

          <span className="admin-page-kicker">
            Machines
          </span>

          <h2>
            {machine.name}
          </h2>

          <p>
            {machine.machine_code}
            {" · "}
            {customer.name}
            {" · "}
            {plant.name}
          </p>

        </div>


        <div className="action-buttons">

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate("/machines")
            }
          >
            ← Back to Machines
          </button>


          <button
            type="button"
            className="edit-button"
            onClick={() =>
              navigate(
                `/machines/${machine.id}/edit`
              )
            }
          >
            Edit Machine
          </button>

        </div>

      </div>


      {/* ======================================================
          MACHINE SUMMARY
      ======================================================= */}

      <div className="admin-summary-grid">

        <div className="admin-summary-card">

          <span>
            Machine Code
          </span>

          <strong>
            {machine.machine_code}
          </strong>

        </div>


        <div className="admin-summary-card">

          <span>
            Model
          </span>

          <strong>
            {machine.model || "-"}
          </strong>

        </div>


        <div className="admin-summary-card">

          <span>
            Service Tickets
          </span>

          <strong>
            {service_history.length}
          </strong>

        </div>


        <div className="admin-summary-card">

          <span>
            Spare Parts Used
          </span>

          <strong>
            {spare_parts_used.length}
          </strong>

        </div>

      </div>


      {/* ======================================================
          MACHINE INFORMATION
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              Machine Information
            </h3>

            <p>
              Core information and lifecycle details.
            </p>

          </div>

        </div>


        <div className="form-grid">


          <div className="form-group">

            <label>
              Machine Code
            </label>

            <div>
              {machine.machine_code}
            </div>

          </div>


          <div className="form-group">

            <label>
              Machine Name
            </label>

            <div>
              {machine.name}
            </div>

          </div>


          <div className="form-group">

            <label>
              Model
            </label>

            <div>
              {machine.model || "-"}
            </div>

          </div>


          <div className="form-group">

            <label>
              Serial Number
            </label>

            <div>
              {machine.serial_number}
            </div>

          </div>


          <div className="form-group">

            <label>
              Manufacturer
            </label>

            <div>
              {machine.manufacturer || "-"}
            </div>

          </div>


          <div className="form-group">

            <label>
              Status
            </label>

            <div>

              <span
                className={
                  machine.status === "ACTIVE" ||
                  machine.status === "IN-SERVICE"
                    ? "status-active"
                    : "status-inactive"
                }
              >
                {machine.status}
              </span>

            </div>

          </div>


          <div className="form-group">

            <label>
              Installation Date
            </label>

            <div>
              {formatDate(
                machine.installation_date
              )}
            </div>

          </div>


          <div className="form-group">

            <label>
              Warranty Expiry
            </label>

            <div>
              {formatDate(
                machine.warranty_expiry
              )}
            </div>

          </div>


        </div>

      </section>


      {/* ======================================================
          LOCATION
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              Location
            </h3>

            <p>
              Customer and plant where this machine operates.
            </p>

          </div>

        </div>


        <div className="admin-summary-grid">


          <div className="admin-summary-card">

            <span>
              Customer
            </span>

            <strong>
              {customer.customer_code}
            </strong>

            <small>
              {customer.name}
            </small>

          </div>


          <div className="admin-summary-card">

            <span>
              Plant
            </span>

            <strong>
              {plant.plant_code}
            </strong>

            <small>
              {plant.name}
            </small>

          </div>


        </div>

      </section>


      {/* ======================================================
          SERVICE HISTORY
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              Service History
            </h3>

            <p>
              Tickets recorded against this machine.
            </p>

          </div>

        </div>


        {service_history.length === 0 ? (

          <div className="empty-state">

            <strong>
              No service history
            </strong>

            <p>
              No tickets have been recorded against this machine yet.
            </p>

          </div>

        ) : (

          <div className="table-container">

            <table className="data-table">

              <thead>

                <tr>

                  <th>
                    #
                  </th>

                  <th>
                    Ticket
                  </th>

                  <th>
                    Title
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Priority
                  </th>

                  <th>
                    Assigned To
                  </th>

                  <th>
                    Created
                  </th>

                  <th>
                    Closed
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {service_history.map(
                  (
                    ticket,
                    index
                  ) => (

                    <tr
                      key={
                        ticket.id
                      }
                    >

                      <td>

                        <span className="history-row-number">
                          {index + 1}
                        </span>

                      </td>


                      <td>

                        <strong>
                          {ticket.ticket_number}
                        </strong>

                      </td>


                      <td>

                        <div>
                          {ticket.title}
                        </div>

                      </td>


                      <td>

                        <span
                          className={
                            getStatusClass(
                              ticket.status
                            )
                          }
                        >
                          {ticket.status}
                        </span>

                      </td>


                      <td>

                        <span
                          className={
                            `ticket-priority ${getPriorityClass(
                              ticket.priority
                            )}`
                          }
                        >
                          {ticket.priority}
                        </span>

                      </td>


                      <td>
                        {
                          getUserName(
                            ticket.assigned_to
                          )
                        }
                      </td>


                      <td>
                        {
                          formatDateTime(
                            ticket.created_at
                          )
                        }
                      </td>


                      <td>
                        {
                          formatDateTime(
                            ticket.closed_at
                          )
                        }
                      </td>


                      <td>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            navigate(
                              `/tickets/${ticket.id}`
                            )
                          }
                        >
                          View
                        </button>

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
          SPARE PARTS USED
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              Spare Parts Used
            </h3>

            <p>
              Factual material consumption recorded against tickets for this machine.
            </p>

          </div>

        </div>


        {spare_parts_used.length === 0 ? (

          <div className="empty-state">

            <strong>
              No spare parts have been used
            </strong>

            <p>
              No material consumption has been recorded against this machine yet.
            </p>

          </div>

        ) : (

          <div className="table-container">

            <table className="data-table">

              <thead>

                <tr>

                  <th>
                    Part
                  </th>

                  <th>
                    Ticket
                  </th>

                  <th>
                    Quantity
                  </th>

                  <th>
                    Location
                  </th>

                  <th>
                    Used By
                  </th>

                  <th>
                    Used At
                  </th>

                  <th>
                    Notes
                  </th>

                </tr>

              </thead>


              <tbody>

                {spare_parts_used.map(
                  usage => (

                    <tr
                      key={
                        usage.id
                      }
                    >

                      <td>

                        <strong>
                          {
                            usage.spare_part.part_code
                          }
                        </strong>

                        <div className="table-secondary-text">
                          {
                            usage.spare_part.name
                          }
                        </div>

                      </td>


                      <td>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            navigate(
                              `/tickets/${usage.ticket_id}`
                            )
                          }
                        >
                          Ticket #{usage.ticket_id}
                        </button>

                      </td>


                      <td>
                        {usage.quantity}{" "}
                        {usage.spare_part.unit}
                      </td>


                      <td>
                        {usage.location}
                      </td>


                      <td>

                        {
                          getUserName(
                            usage.created_by
                          )
                        }

                      </td>


                      <td>

                        {
                          formatDateTime(
                            usage.created_at
                          )
                        }

                      </td>


                      <td>
                        {usage.notes || "—"}
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


export default MachineDetails;


