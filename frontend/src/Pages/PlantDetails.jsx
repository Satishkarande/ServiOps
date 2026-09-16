import {
  useEffect,
  useMemo,
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




function PlantDetails() {

  const {
    plantId,
  } = useParams();

  const navigate =
    useNavigate();

  const {
    accessToken,
    isAuthenticated,
  } = useAuth();


  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ============================================================
  // FETCH PLANT DETAILS
  // ============================================================

  const fetchPlantDetails =
    async () => {

      const response =
        await fetch(
          `${API_URL}/plants/${plantId}/details`,
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          }
        );


      if (!response.ok) {

        let message =
          `Failed to fetch plant details: ${response.status}`;


        try {

          const errorData =
            await response.json();

          if (
            errorData?.detail
          ) {

            message =
              errorData.detail;

          }

        } catch {
          // Ignore parsing errors.
        }


        throw new Error(
          message
        );

      }


      const result =
        await response.json();


      setData(
        result
      );

    };


  // ============================================================
  // LOAD
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


          await fetchPlantDetails();

        } catch (err) {

          console.error(
            err
          );

          setError(
            err.message
          );

        } finally {

          setLoading(false);

        }

      };


    load();

  }, [
    plantId,
    accessToken,
    isAuthenticated,
  ]);


  // ============================================================
  // DATA
  // ============================================================

  const plant =
    data?.plant;

  const customer =
    data?.customer;

  const machines =
    Array.isArray(
      data?.machines
    )
      ? data.machines
      : [];

  const serviceHistory =
    Array.isArray(
      data?.service_history
    )
      ? data.service_history
      : [];

  const sparePartsUsed =
    Array.isArray(
      data?.spare_parts_used
    )
      ? data.spare_parts_used
      : [];


  const activeTickets =
    useMemo(
      () =>
        serviceHistory.filter(
          ticket =>
            ![
              "CLOSED",
              "CANCELLED",
            ].includes(
              ticket.status
            )
        ),
      [
        serviceHistory,
      ]
    );


  const closedTickets =
    useMemo(
      () =>
        serviceHistory.filter(
          ticket =>
            ticket.status ===
            "CLOSED"
        ),
      [
        serviceHistory,
      ]
    );


  const activeMachines =
    useMemo(
      () =>
        machines.filter(
          machine =>
            machine.is_active
        ),
      [
        machines,
      ]
    );


  // ============================================================
  // HELPERS
  // ============================================================

  const formatDate =
    value => {

      if (!value) {
        return "—";
      }

      return new Date(
        value
      ).toLocaleString();

    };


  const getUserName =
    user => {

      if (!user) {
        return "Unassigned";
      }

      const name =
        [
          user.first_name,
          user.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();


      return (
        name ||
        user.employee_code ||
        user.email ||
        "Unknown"
      );

    };


  const getPriorityClass =
    priority => {

      switch (
        String(
          priority ||
          ""
        ).toUpperCase()
      ) {

        case "LOW":
          return "ticket-priority priority-low";

        case "HIGH":
          return "ticket-priority priority-high";

        case "CRITICAL":
          return "ticket-priority priority-critical";

        default:
          return "ticket-priority priority-medium";

      }

    };


  const getStatusClass =
    status => {

      switch (
        String(
          status ||
          ""
        ).toUpperCase()
      ) {

        case "OPEN":
          return "status-open";

        case "ASSIGNED":
          return "status-assigned";

        case "IN_PROGRESS":
          return "status-in-progress";

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


  // ============================================================
  // AUTH
  // ============================================================

  if (!isAuthenticated) {

    return (

      <div className="plant-details-page">

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
      <div className="plant-details-page"><div className="loading-state">
        Loading plant details...</div></div>
    );

  }


  // ============================================================
  // ERROR
  // ============================================================

  if (error) {

    return (

      <div className="plant-details-page">

        <div className="error-message">
          {error}
        </div>


        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            navigate("/plants")
          }
        >
          ← Back to Plants
        </button>

      </div>

    );

  }


  if (!plant) {

    return (

      <div className="empty-state">

        <strong>
          Plant not found
        </strong>

        <p>
          The requested plant could not
          be found.
        </p>

      </div>

    );

  }


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <div className="plant-details-page">
      <style>{`
.plant-details-page{--pd-text:#172033;--pd-muted:#667085;--pd-border:#e5e7eb;--pd-soft:#f8fafc;--pd-primary:#2563eb;--pd-shadow:0 12px 32px rgba(15,23,42,.07);color:var(--pd-text)}
.plant-details-page *{box-sizing:border-box}
.plant-details-page .page-header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:24px}
.plant-details-page .admin-page-kicker{display:inline-block;margin-bottom:7px;color:#64748b;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.plant-details-page .page-header h2{margin:0;font-size:28px;line-height:1.2;letter-spacing:-.02em}
.plant-details-page .page-header p{margin:8px 0 0;color:var(--pd-muted);font-size:14px}
.plant-details-page .admin-summary-grid{margin-bottom:22px}
.plant-details-page .admin-summary-card{border:1px solid var(--pd-border);border-radius:14px;background:#fff;box-shadow:0 5px 18px rgba(15,23,42,.045);transition:transform .15s ease,box-shadow .15s ease}
.plant-details-page .admin-summary-card:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(15,23,42,.07)}
.plant-details-page .section-card{margin-top:20px;border:1px solid var(--pd-border);border-radius:16px;background:#fff;box-shadow:var(--pd-shadow);overflow:hidden}
.plant-details-page .section-card-header{padding:20px 22px;border-bottom:1px solid #eef0f3;background:linear-gradient(180deg,#fff 0%,#fbfcfe 100%)}
.plant-details-page .section-card-header h3{margin:0;font-size:17px}
.plant-details-page .section-card-header p{margin:5px 0 0;color:var(--pd-muted);font-size:13px}
.plant-details-page .section-card > .form-grid{padding:22px}
.plant-details-page .form-group label{color:#344054;font-size:13px;font-weight:650}
.plant-details-page .form-group input{border-color:#d0d5dd;border-radius:9px;background:#f8fafc}
.plant-details-page .table-container{border:0;border-radius:0;box-shadow:none}
.plant-details-page .data-table th{background:#f8fafc;color:#667085;font-size:11px;letter-spacing:.04em;text-transform:uppercase}
.plant-details-page .data-table td{vertical-align:middle}
.plant-details-page .data-table tbody tr:hover{background:#fbfcff}
.plant-details-page .history-row-number{display:inline-grid;min-width:26px;height:26px;place-items:center;border:1px solid #e5e7eb;border-radius:8px;background:#f8fafc;color:#667085;font-size:12px;font-weight:650}
.plant-details-page .ticket-priority,.plant-details-page .status-open,.plant-details-page .status-assigned,.plant-details-page .status-in-progress,.plant-details-page .status-resolved,.plant-details-page .status-close-requested,.plant-details-page .status-closed,.plant-details-page .status-cancelled,.plant-details-page .status-active,.plant-details-page .status-inactive{display:inline-flex;align-items:center;white-space:nowrap;border-radius:999px;font-size:11px;font-weight:700}
.plant-details-page .ticket-priority:before,.plant-details-page .status-open:before,.plant-details-page .status-assigned:before,.plant-details-page .status-in-progress:before,.plant-details-page .status-resolved:before,.plant-details-page .status-close-requested:before,.plant-details-page .status-closed:before,.plant-details-page .status-cancelled:before,.plant-details-page .status-active:before,.plant-details-page .status-inactive:before{content:"";width:6px;height:6px;border-radius:50%;margin-right:7px;background:currentColor;opacity:.75}
.plant-details-page .ticket-priority{padding:5px 9px}.plant-details-page .priority-low{background:#f0fdf4;color:#15803d}.plant-details-page .priority-medium{background:#fff8df;color:#b45309}.plant-details-page .priority-high{background:#fff0f2;color:#dc2626}.plant-details-page .priority-critical{background:#f3efff;color:#6d28d9}
.plant-details-page .status-open{padding:5px 9px;background:#eaf2ff;color:#1d4ed8}.plant-details-page .status-assigned{padding:5px 9px;background:#f1f5f9;color:#475569}.plant-details-page .status-in-progress,.plant-details-page .status-close-requested{padding:5px 9px;background:#fff4e8;color:#c2410c}.plant-details-page .status-resolved,.plant-details-page .status-closed{padding:5px 9px;background:#f0fdf4;color:#15803d}.plant-details-page .status-cancelled{padding:5px 9px;background:#fff0f2;color:#dc2626}.plant-details-page .status-active{padding:5px 9px;background:#f0fdf4;color:#15803d}.plant-details-page .status-inactive{padding:5px 9px;background:#f1f5f9;color:#64748b}
.plant-details-page .action-buttons{display:flex;gap:8px;flex-wrap:wrap}
.plant-details-page .secondary-button,.plant-details-page .edit-button{border-radius:9px;transition:background .15s ease,border-color .15s ease,transform .15s ease}
.plant-details-page .secondary-button:hover,.plant-details-page .edit-button:hover{transform:translateY(-1px)}
.plant-details-page .empty-state{padding:34px 20px;text-align:center}
.plant-details-page .error-message{margin-bottom:18px}
@media(max-width:900px){.plant-details-page .page-header{align-items:stretch;flex-direction:column}.plant-details-page .data-table{min-width:1050px}.plant-details-page .table-container{overflow-x:auto}.plant-details-page .page-header h2{font-size:24px}}
`}</style>



      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="page-header">

        <div>

          <span className="admin-page-kicker">
            Plant Details
          </span>

          <h2>
            {plant.name}
          </h2>

          <p>
            {plant.plant_code}
            {" · "}
            {customer?.name || "Unknown Customer"}
          </p>

        </div>


        <div className="action-buttons">

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate("/plants")
            }
          >
            ← Back to Plants
          </button>


          <button
            type="button"
            className="edit-button"
            onClick={() =>
              navigate(
                `/plants/${plant.id}/edit`
              )
            }
          >
            Edit Plant
          </button>

        </div>

      </div>


      {/* ======================================================
          SUMMARY
      ======================================================= */}

      <div className="admin-summary-grid">

        <div className="admin-summary-card">

          <span>
            Plant Code
          </span>

          <strong>
            {plant.plant_code}
          </strong>

        </div>


        <div className="admin-summary-card">

          <span>
            Machines
          </span>

          <strong>
            {machines.length}
          </strong>

        </div>


        <div className="admin-summary-card">

          <span>
            Active Tickets
          </span>

          <strong>
            {activeTickets.length}
          </strong>

        </div>


        <div className="admin-summary-card">

          <span>
            Spare Parts Used
          </span>

          <strong>
            {sparePartsUsed.length}
          </strong>

        </div>

      </div>


      {/* ======================================================
          PLANT INFORMATION
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              Plant Information
            </h3>

            <p>
              Core plant and location information.
            </p>

          </div>

        </div>


        <div className="form-grid">

          <div className="form-group">

            <label>
              Plant Code
            </label>

            <input
              value={
                plant.plant_code ||
                ""
              }
              disabled
            />

          </div>


          <div className="form-group">

            <label>
              Plant Name
            </label>

            <input
              value={
                plant.name ||
                ""
              }
              disabled
            />

          </div>


          <div className="form-group">

            <label>
              Customer
            </label>

            <input
              value={
                customer
                  ? `${customer.customer_code} - ${customer.name}`
                  : "—"
              }
              disabled
            />

          </div>


          <div className="form-group">

            <label>
              Status
            </label>

            <input
              value={
                plant.is_active
                  ? "Active"
                  : "Inactive"
              }
              disabled
            />

          </div>


          <div className="form-group">

            <label>
              City
            </label>

            <input
              value={
                plant.city ||
                "—"
              }
              disabled
            />

          </div>


          <div className="form-group">

            <label>
              State
            </label>

            <input
              value={
                plant.state ||
                "—"
              }
              disabled
            />

          </div>


          <div className="form-group">

            <label>
              Country
            </label>

            <input
              value={
                plant.country ||
                "—"
              }
              disabled
            />

          </div>


          <div className="form-group full-width">

            <label>
              Address
            </label>

            <input
              value={
                plant.address ||
                "—"
              }
              disabled
            />

          </div>

        </div>

      </section>


      {/* ======================================================
          CONTACT INFORMATION
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              Contact Information
            </h3>

            <p>
              Primary contact information for this plant.
            </p>

          </div>

        </div>


        <div className="form-grid">

          <div className="form-group">

            <label>
              Contact Name
            </label>

            <input
              value={
                plant.contact_name ||
                "—"
              }
              disabled
            />

          </div>


          <div className="form-group">

            <label>
              Contact Phone
            </label>

            <input
              value={
                plant.contact_phone ||
                "—"
              }
              disabled
            />

          </div>


          <div className="form-group">

            <label>
              Contact Email
            </label>

            <input
              value={
                plant.contact_email ||
                "—"
              }
              disabled
            />

          </div>

        </div>

      </section>


      {/* ======================================================
          MACHINES
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              Machines
            </h3>

            <p>
              {activeMachines.length} active machine
              {activeMachines.length === 1 ? "" : "s"}
              {" "}installed at this plant.
            </p>

          </div>

        </div>


        {machines.length === 0 ? (

          <div className="empty-state">

            <strong>
              No machines found
            </strong>

            <p>
              No active machines are currently
              associated with this plant.
            </p>

          </div>

        ) : (

          <div className="table-container">

            <table className="data-table">

              <thead>

                <tr>

                  <th>#</th>

                  <th>
                    Machine
                  </th>

                  <th>
                    Model
                  </th>

                  <th>
                    Serial Number
                  </th>

                  <th>
                    Manufacturer
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Warranty
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {machines.map(
                  (
                    machine,
                    index
                  ) => (

                    <tr
                      key={
                        machine.id
                      }
                    >

                      <td>

                        <span className="history-row-number">
                          {index + 1}
                        </span>

                      </td>


                      <td>

                        <strong>
                          {
                            machine.name
                          }
                        </strong>

                        <span
                          style={{
                            display:
                              "block",
                            color:
                              "#64748b",
                            fontSize:
                              "12px",
                            marginTop:
                              "3px",
                          }}
                        >
                          {
                            machine.machine_code
                          }
                        </span>

                      </td>


                      <td>
                        {
                          machine.model ||
                          "—"
                        }
                      </td>


                      <td>
                        {
                          machine.serial_number ||
                          "—"
                        }
                      </td>


                      <td>
                        {
                          machine.manufacturer ||
                          "—"
                        }
                      </td>


                      <td>

                        <span
                          className={
                            machine.is_active
                              ? "status-active"
                              : "status-inactive"
                          }
                        >
                          {
                            machine.is_active
                              ? "Active"
                              : "Inactive"
                          }
                        </span>

                      </td>


                      <td>
                        {
                          machine.warranty_expiry
                            ? new Date(
                                machine.warranty_expiry
                              ).toLocaleDateString()
                            : "—"
                        }
                      </td>


                      <td>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            navigate(
                              `/machines/${machine.id}`
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
          SERVICE HISTORY
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              Service History
            </h3>

            <p>
              Service tickets associated with this plant.
            </p>

          </div>

        </div>


        {serviceHistory.length === 0 ? (

          <div className="empty-state">

            <strong>
              No service history
            </strong>

            <p>
              No tickets have been recorded for this plant.
            </p>

          </div>

        ) : (

          <div className="table-container">

            <table className="data-table">

              <thead>

                <tr>

                  <th>#</th>

                  <th>
                    Ticket
                  </th>

                  <th>
                    Machine
                  </th>

                  <th>
                    Title
                  </th>

                  <th>
                    Priority
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Assigned Engineer
                  </th>

                  <th>
                    Created
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {serviceHistory.map(
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
                          {
                            ticket.ticket_number
                          }
                        </strong>

                      </td>


                      <td>
                        Machine #{ticket.machine_id}
                      </td>


                      <td>
                        {
                          ticket.title
                        }
                      </td>


                      <td>

                        <span
                          className={
                            getPriorityClass(
                              ticket.priority
                            )
                          }
                        >
                          {
                            ticket.priority
                          }
                        </span>

                      </td>


                      <td>

                        <span
                          className={
                            getStatusClass(
                              ticket.status
                            )
                          }
                        >
                          {
                            ticket.status
                          }
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
                          formatDate(
                            ticket.created_at
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
              Material consumption recorded against
              service tickets at this plant.
            </p>

          </div>

        </div>


        {sparePartsUsed.length === 0 ? (

          <div className="empty-state">

            <strong>
              No spare parts used
            </strong>

            <p>
              No spare parts have been consumed
              against tickets at this plant.
            </p>

          </div>

        ) : (

          <div className="table-container">

            <table className="data-table">

              <thead>

                <tr>

                  <th>#</th>

                  <th>
                    Spare Part
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

                {sparePartsUsed.map(
                  (
                    item,
                    index
                  ) => (

                    <tr
                      key={
                        item.id
                      }
                    >

                      <td>

                        <span className="history-row-number">
                          {index + 1}
                        </span>

                      </td>


                      <td>

                        <strong>
                          {
                            item.spare_part?.part_code ||
                            `Part #${item.spare_part_id}`
                          }
                        </strong>

                        <span
                          style={{
                            display:
                              "block",
                            color:
                              "#64748b",
                            fontSize:
                              "12px",
                            marginTop:
                              "3px",
                          }}
                        >
                          {
                            item.spare_part?.name ||
                            "Unknown part"
                          }
                        </span>

                      </td>


                      <td>

                        {item.ticket ? (

                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              navigate(
                                `/tickets/${item.ticket.id}`
                              )
                            }
                          >
                            {
                              item.ticket.ticket_number
                            }
                          </button>

                        ) : (

                          "—"

                        )}

                      </td>


                      <td>
                        {
                          item.quantity
                        }
                      </td>


                      <td>
                        {
                          item.location ||
                          "—"
                        }
                      </td>


                      <td>
                        {
                          getUserName(
                            item.created_by
                          )
                        }
                      </td>


                      <td>
                        {
                          formatDate(
                            item.created_at
                          )
                        }
                      </td>


                      <td>
                        {
                          item.notes ||
                          "—"
                        }
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
          TICKET SUMMARY
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              Service Summary
            </h3>

            <p>
              High-level service activity for this plant.
            </p>

          </div>

        </div>


        <div className="admin-summary-grid">

          <div className="admin-summary-card">

            <span>
              Total Tickets
            </span>

            <strong>
              {serviceHistory.length}
            </strong>

          </div>


          <div className="admin-summary-card">

            <span>
              Active Tickets
            </span>

            <strong>
              {activeTickets.length}
            </strong>

          </div>


          <div className="admin-summary-card">

            <span>
              Closed Tickets
            </span>

            <strong>
              {closedTickets.length}
            </strong>

          </div>


          <div className="admin-summary-card">

            <span>
              Parts Used
            </span>

            <strong>
              {sparePartsUsed.length}
            </strong>

          </div>

        </div>

      </section>

    </div>

  );

}


export default PlantDetails;


