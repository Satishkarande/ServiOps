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




function CustomerDetails() {

  const {
    customerId,
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
  // FETCH CUSTOMER DETAILS
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


          const response =
            await fetch(
              `${API_URL}/customers/${customerId}/details`,
              {
                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                },
              }
            );


          if (!response.ok) {

            let message =
              `Failed to fetch customer details: ${response.status}`;


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
    customerId,
    accessToken,
    isAuthenticated,
  ]);


  // ============================================================
  // DATA
  // ============================================================

  const customer =
    data?.customer;

  const plants =
    Array.isArray(
      data?.plants
    )
      ? data.plants
      : [];

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


  // ============================================================
  // SUMMARY
  // ============================================================

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
        Loading customer details...
      </div>
    );

  }


  // ============================================================
  // ERROR
  // ============================================================

  if (error) {

    return (

      <div className="page-container customer-details-page">

      
<style>{`
  .customer-details-page .page-header{align-items:center;margin-bottom:24px}
  .customer-details-page .admin-page-kicker{display:block;margin-bottom:5px;color:#64748b;font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
  .customer-details-page .page-header h2{margin:0;color:#0f172a;font-size:28px;line-height:1.15}
  .customer-details-page .page-header p{margin:8px 0 0;color:#64748b;font-size:14px}
  .customer-details-page .admin-summary-grid{gap:14px;margin-bottom:22px}
  .customer-details-page .admin-summary-card{position:relative;overflow:hidden;min-height:104px;padding:18px 20px;border:1px solid #e5e7eb;border-radius:16px;background:#fff;box-shadow:0 5px 18px rgba(15,23,42,.045)}
  .customer-details-page .admin-summary-card::after{content:"";position:absolute;right:-24px;bottom:-28px;width:82px;height:82px;border-radius:50%;background:#f1f5f9;opacity:.7}
  .customer-details-page .admin-summary-card span,.customer-details-page .admin-summary-card strong{position:relative;z-index:1}
  .customer-details-page .admin-summary-card span{display:block;color:#64748b;font-size:12px;font-weight:700}
  .customer-details-page .admin-summary-card strong{display:block;margin-top:8px;color:#0f172a;font-size:28px;line-height:1}
  .customer-details-page .section-card{overflow:hidden;margin-bottom:20px;border:1px solid #e5e7eb;border-radius:18px;background:#fff;box-shadow:0 7px 24px rgba(15,23,42,.05)}
  .customer-details-page .section-card-header{padding:20px 22px 16px;border-bottom:1px solid #eef2f7;background:linear-gradient(to bottom,#fff,#fcfdff)}
  .customer-details-page .section-card-header h3{margin:0;color:#0f172a;font-size:17px}
  .customer-details-page .section-card-header p{margin:5px 0 0;color:#64748b;font-size:13px}
  .customer-details-page .section-card>.form-grid{padding:22px}
  .customer-details-page .form-group label{display:block;margin-bottom:7px;color:#334155;font-size:12px;font-weight:750}
  .customer-details-page .form-group input{width:100%;min-height:42px;box-sizing:border-box;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;color:#475569;padding:0 12px;font-size:13px}
  .customer-details-page .table-container{overflow-x:auto}
  .customer-details-page .data-table{min-width:980px;border-collapse:separate;border-spacing:0}
  .customer-details-page .data-table th{padding:12px 16px;background:#f8fafc;border-bottom:1px solid #e5e7eb;color:#64748b;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
  .customer-details-page .data-table td{padding:14px 16px;border-bottom:1px solid #f1f5f9;color:#475569;font-size:13px;vertical-align:middle}
  .customer-details-page .data-table tbody tr:hover{background:#fafbff}
  .customer-details-page .data-table tbody tr:last-child td{border-bottom:0}
  .customer-details-page .history-row-number{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:9px;background:#f1f5f9;color:#64748b;font-size:11px;font-weight:800}
  .customer-details-page .data-table td strong{color:#1e293b;font-size:13px}
  .customer-details-page .admin-description{display:block;margin-top:3px;color:#94a3b8;font-size:11px}
  .customer-details-page .status-active,.customer-details-page .status-inactive,.customer-details-page .ticket-priority,.customer-details-page .status-open,.customer-details-page .status-assigned,.customer-details-page .status-in-progress,.customer-details-page .status-resolved,.customer-details-page .status-close-requested,.customer-details-page .status-closed,.customer-details-page .status-cancelled{display:inline-flex;align-items:center;min-height:27px;padding:0 9px;border-radius:999px;font-size:10px;font-weight:800;white-space:nowrap}
  .customer-details-page .status-active{background:#f0fdf4;color:#15803d}.customer-details-page .status-inactive{background:#f1f5f9;color:#64748b}
  .customer-details-page .status-active::before,.customer-details-page .status-inactive::before{content:"";width:6px;height:6px;margin-right:7px;border-radius:50%;background:currentColor}
  .customer-details-page .priority-low{background:#f0fdf4;color:#15803d}.customer-details-page .priority-medium{background:#fff8df;color:#b45309}.customer-details-page .priority-high{background:#fff0f2;color:#dc2626}.customer-details-page .priority-critical{background:#f3efff;color:#6d28d9}
  .customer-details-page .status-open{background:#eaf2ff;color:#1d4ed8}.customer-details-page .status-assigned{background:#f1f5f9;color:#475569}.customer-details-page .status-in-progress,.customer-details-page .status-close-requested{background:#fff7ed;color:#c2410c}.customer-details-page .status-resolved{background:#f0fdf4;color:#15803d}.customer-details-page .status-closed{background:#ecfdf5;color:#047857}.customer-details-page .status-cancelled{background:#fff1f2;color:#be123c}
  .customer-details-page .secondary-button,.customer-details-page .edit-button{min-height:34px;padding:0 11px;border-radius:9px;border:1px solid #cbd5e1;background:#fff;color:#334155;font-size:11px;font-weight:750}
  .customer-details-page .secondary-button:hover,.customer-details-page .edit-button:hover{background:#f8fafc;border-color:#94a3b8;transform:translateY(-1px)}
  .customer-details-page .action-buttons{display:flex;align-items:center;gap:8px}
  .customer-details-page .empty-state{margin:22px;border:1px dashed #cbd5e1;border-radius:14px;background:#f8fafc;padding:32px 20px;text-align:center}
  .customer-details-page .empty-state strong{color:#0f172a}.customer-details-page .empty-state p{margin:6px 0 0;color:#64748b;font-size:13px}
  .customer-details-page .error-message{margin-bottom:18px;border:1px solid #fecaca;border-radius:12px;background:#fff7f7;color:#b91c1c;padding:12px 14px;font-size:13px;font-weight:650}
  @media(max-width:760px){.customer-details-page .page-header{align-items:flex-start;flex-direction:column;gap:14px}.customer-details-page .action-buttons{flex-wrap:wrap}.customer-details-page .page-header h2{font-size:24px}.customer-details-page .section-card>.form-grid{padding:16px}}
`}</style>


        <div className="error-message">
          {error}
        </div>


        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            navigate("/customers")
          }
        >
          ← Back to Customers
        </button>

      </div>

    );

  }


  if (!customer) {

    return (

      <div className="empty-state">

        <strong>
          Customer not found
        </strong>

        <p>
          The requested customer could not
          be found.
        </p>

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

          <span className="admin-page-kicker">
            Customer Management
          </span>

          <h2>
            {customer.name}
          </h2>

          <p>
            {customer.customer_code}
            {" · "}
            Customer operational overview
          </p>

        </div>


        <div className="action-buttons">

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate("/customers")
            }
          >
            ← Back to Customers
          </button>


          <button
  type="button"
  className="edit-button"
  onClick={() =>
    navigate(`/customers/${customer.id}/edit`)
  }
>
  Edit Customer
</button>

        </div>

      </div>


      {/* ======================================================
          SUMMARY
      ======================================================= */}

      <div className="admin-summary-grid">

        <div className="admin-summary-card">

          <span>
            Plants
          </span>

          <strong>
            {plants.length}
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
          CUSTOMER INFORMATION
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              Customer Information
            </h3>

            <p>
              Core customer and contact information.
            </p>

          </div>

        </div>


        <div className="form-grid">

          <div className="form-group">

            <label>
              Customer Code
            </label>

            <input
              value={
                customer.customer_code ||
                "—"
              }
              disabled
            />

          </div>


          <div className="form-group">

            <label>
              Customer Name
            </label>

            <input
              value={
                customer.name ||
                "—"
              }
              disabled
            />

          </div>


          <div className="form-group">

            <label>
              Email
            </label>

            <input
              value={
                customer.email ||
                "—"
              }
              disabled
            />

          </div>


          <div className="form-group">

            <label>
              Phone
            </label>

            <input
              value={
                customer.phone ||
                "—"
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
                customer.city ||
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
                customer.country ||
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
                customer.address ||
                "—"
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
                customer.is_active
                  ? "Active"
                  : "Inactive"
              }
              disabled
            />

          </div>

        </div>

      </section>


      {/* ======================================================
          PLANTS
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              Plants
            </h3>

            <p>
              Active plants belonging to this customer.
            </p>

          </div>

        </div>


        {plants.length === 0 ? (

          <div className="empty-state">

            <strong>
              No plants found
            </strong>

            <p>
              This customer has no active plants.
            </p>

          </div>

        ) : (

          <div className="table-container">

            <table className="data-table">

              <thead>

                <tr>

                  <th>#</th>

                  <th>
                    Plant
                  </th>

                  <th>
                    Location
                  </th>

                  <th>
                    Contact
                  </th>

                  <th>
                    Machines
                  </th>

                  <th>
                    Active Tickets
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {plants.map(
                  (
                    plant,
                    index
                  ) => (

                    <tr
                      key={
                        plant.id
                      }
                    >

                      <td>

                        <span className="history-row-number">
                          {index + 1}
                        </span>

                      </td>


                      <td>

                        <strong>
                          {plant.name}
                        </strong>

                        <span className="admin-description">
                          {plant.plant_code}
                        </span>

                      </td>


                      <td>

                        {
                          [
                            plant.city,
                            plant.state,
                            plant.country,
                          ]
                            .filter(Boolean)
                            .join(", ") ||
                          "—"
                        }

                      </td>


                      <td>

                        <strong>
                          {
                            plant.contact_name ||
                            "—"
                          }
                        </strong>

                        {plant.contact_phone && (

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
                              plant.contact_phone
                            }
                          </span>

                        )}

                      </td>


                      <td>
                        {
                          plant.machine_count
                        }
                      </td>


                      <td>
                        {
                          plant.active_ticket_count
                        }
                      </td>


                      <td>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            navigate(
                              `/plants/${plant.id}`
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
          MACHINES
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              Machines
            </h3>

            <p>
              Active machines across the customer's plants.
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
              associated with this customer.
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
                    Plant
                  </th>

                  <th>
                    Model
                  </th>

                  <th>
                    Serial Number
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

                        <span className="admin-description">
                          {
                            machine.machine_code
                          }
                        </span>

                      </td>


                      <td>

                        {
                          machine.plant
                            ? (
                                <>
                                  <strong>
                                    {
                                      machine.plant.plant_code
                                    }
                                  </strong>

                                  <span className="admin-description">
                                    {
                                      machine.plant.name
                                    }
                                  </span>
                                </>
                              )
                            : "—"
                        }

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
              All service tickets associated with this customer.
            </p>

          </div>

        </div>


        {serviceHistory.length === 0 ? (

          <div className="empty-state">

            <strong>
              No service history
            </strong>

            <p>
              No tickets have been recorded for this customer.
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
                    Plant
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
                    Assigned To
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

                        {
                          ticket.plant
                            ? `${ticket.plant.plant_code} - ${ticket.plant.name}`
                            : "—"
                        }

                      </td>


                      <td>

                        {
                          ticket.machine
                            ? `${ticket.machine.machine_code} - ${ticket.machine.name}`
                            : "—"
                        }

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
              Material consumption recorded across
              this customer's service tickets.
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
              for this customer.
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
                    Plant
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

                        <span className="admin-description">
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
                          item.plant
                            ? `${item.plant.plant_code} - ${item.plant.name}`
                            : "—"
                        }

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
          SERVICE SUMMARY
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              Service Summary
            </h3>

            <p>
              High-level service activity for this customer.
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


export default CustomerDetails;


