import {
  useEffect,
  useState,
} from "react";
import { API_URL } from "../config";
import {
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function Customers() {
  const {
    accessToken,
    isAuthenticated,
  } = useAuth();

  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [deactivatingId, setDeactivatingId] =
    useState(null);

  const [error, setError] = useState("");


  // ============================================================
  // FETCH CUSTOMERS
  // ============================================================

  const fetchCustomers = async () => {

    if (!accessToken) {
      return;
    }

    try {

      setError("");

      const response = await fetch(
        `${API_URL}/customers/`,
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
          `Failed to fetch customers: ${response.status} ${text}`
        );

      }


      const data =
        await response.json();


      console.log(
        "CUSTOMERS API RESPONSE:",
        data
      );


      setCustomers(data);

    } catch (err) {

      console.error(
        "Failed to fetch customers:",
        err
      );

      setError(
        err.message
      );

    }

  };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    const loadData = async () => {

      if (
        !isAuthenticated ||
        !accessToken
      ) {

        setLoading(false);

        return;
      }


      setLoading(true);

      await fetchCustomers();

      setLoading(false);

    };


    loadData();

  }, [
    accessToken,
    isAuthenticated,
  ]);


  // ============================================================
  // ADD CUSTOMER
  // ============================================================

  const handleAddCustomer = () => {

    navigate(
      "/customers/new"
    );

  };

// ============================================================
// VIEW CUSTOMER
// ============================================================

const handleOpenDetails =
  customer => {

    navigate(
      `/customers/${customer.id}`
    );

  };
  // ============================================================
  // EDIT CUSTOMER
  // ============================================================

  const handleOpenEditForm = (
    customer
  ) => {

    navigate(
      `/customers/${customer.id}/edit`
    );

  };


  // ============================================================
  // DEACTIVATE CUSTOMER
  // ============================================================

  const handleDeactivate = async (
    customer
  ) => {

    const confirmed =
      window.confirm(
        `Are you sure you want to deactivate ${customer.name}?`
      );


    if (!confirmed) {
      return;
    }


    try {

      setDeactivatingId(
        customer.id
      );

      setError("");


      const response =
        await fetch(
          `${API_URL}/customers/${customer.id}`,
          {
            method: "DELETE",

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
          `Failed to deactivate customer: ${response.status} ${text}`
        );

      }


      await fetchCustomers();

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
  // AUTHENTICATION
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
        Loading customers...
      </div>
    );

  }


  // ============================================================
  // UI
  // ============================================================

  return (

    <div className="page-container customers-page">

      
<style>{`
  .customers-page .page-header{align-items:center;margin-bottom:24px}
  .customers-page .page-header h2{margin:0;font-size:28px;line-height:1.15;color:#0f172a}
  .customers-page .page-header p{margin:8px 0 0;color:#64748b;font-size:14px}
  .customers-page .admin-page-kicker{display:block;margin-bottom:5px;color:#64748b;font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
  .customers-page .primary-button{min-height:42px;padding:0 18px;border:0;border-radius:11px;font-weight:800;box-shadow:0 7px 18px rgba(15,23,42,.10);transition:transform .15s ease,box-shadow .15s ease}
  .customers-page .primary-button:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 22px rgba(15,23,42,.14)}
  .customers-page .ticket-section-card{overflow:hidden;border:1px solid #e5e7eb;border-radius:18px;background:#fff;box-shadow:0 7px 24px rgba(15,23,42,.05)}
  .customers-page .ticket-section-header{padding:20px 22px 16px;border-bottom:1px solid #eef2f7;background:linear-gradient(to bottom,#fff,#fcfdff)}
  .customers-page .ticket-section-header h3{margin:0;color:#0f172a;font-size:17px}
  .customers-page .ticket-section-header p{margin:5px 0 0;color:#64748b;font-size:13px}
  .customers-page .table-container{overflow-x:auto}
  .customers-page .data-table{min-width:1080px;border-collapse:separate;border-spacing:0}
  .customers-page .data-table th{padding:12px 16px;background:#f8fafc;border-bottom:1px solid #e5e7eb;color:#64748b;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
  .customers-page .data-table td{padding:14px 16px;border-bottom:1px solid #f1f5f9;color:#475569;font-size:13px;vertical-align:middle}
  .customers-page .data-table tbody tr:hover{background:#fafbff}
  .customers-page .data-table tbody tr:last-child td{border-bottom:0}
  .customers-page .history-row-number{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:9px;background:#f1f5f9;color:#64748b;font-size:11px;font-weight:800}
  .customers-page .data-table td strong{color:#1e293b;font-size:13px}
  .customers-page .status-active,.customers-page .status-inactive{display:inline-flex;align-items:center;gap:7px;min-height:28px;padding:0 10px;border-radius:999px;font-size:11px;font-weight:800}
  .customers-page .status-active{background:#f0fdf4;color:#15803d}
  .customers-page .status-inactive{background:#f1f5f9;color:#64748b}
  .customers-page .status-active::before,.customers-page .status-inactive::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
  .customers-page .action-buttons{display:flex;align-items:center;gap:7px;white-space:nowrap}
  .customers-page .secondary-button,.customers-page .edit-button,.customers-page .deactivate-button{min-height:32px;padding:0 10px;border-radius:9px;font-size:11px;font-weight:750}
  .customers-page .secondary-button,.customers-page .edit-button{border:1px solid #cbd5e1;background:#fff;color:#334155}
  .customers-page .secondary-button:hover,.customers-page .edit-button:hover{background:#f8fafc;border-color:#94a3b8}
  .customers-page .deactivate-button{border:1px solid #fecaca;background:#fff7f7;color:#dc2626}
  .customers-page .deactivate-button:hover:not(:disabled){background:#feecec}
  .customers-page .error-message{margin-bottom:18px;border:1px solid #fecaca;border-radius:12px;background:#fff7f7;color:#b91c1c;padding:12px 14px;font-size:13px;font-weight:650}
  .customers-page .empty-state{margin:22px;border:1px dashed #cbd5e1;border-radius:14px;background:#f8fafc;padding:34px 20px;text-align:center}
  .customers-page .empty-state strong{color:#0f172a}
  .customers-page .empty-state p{margin:6px 0 0;color:#64748b;font-size:13px}
  @media(max-width:760px){.customers-page .page-header{align-items:flex-start;flex-direction:column;gap:14px}.customers-page .page-header .primary-button{width:100%}.customers-page .page-header h2{font-size:24px}}
`}</style>



      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

      <div className="page-header">

        <div>

          <h2>
            Customers
          </h2>

          <p>
            Manage ServiOps customers and
            their service information.
          </p>

        </div>


        <button
          type="button"
          className="primary-button"
          onClick={
            handleAddCustomer
          }
        >
          + Add Customer
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
          CUSTOMER DIRECTORY
      ======================================================= */}

      <section className="ticket-section-card">

        <div className="ticket-section-header">

          <div>

            <h3>
              Customer Directory
            </h3>

            <p>
              {customers.length}{" "}
              {customers.length === 1
                ? "customer"
                : "customers"}{" "}
              in ServiOps
            </p>

          </div>

        </div>


        {customers.length === 0 ? (

          <div className="empty-state">

            <strong>
              No customers found
            </strong>

            <p>
              Add your first customer to
              get started.
            </p>

          </div>

        ) : (

          <div
            className="table-container"
            style={{
              border: "none",
              borderRadius: 0,
              boxShadow: "none",
            }}
          >

            <table className="data-table">

              <thead>

                <tr>

                  <th>
                    #
                  </th>

                  <th>
                    Customer Code
                  </th>

                  <th>
                    Name
                  </th>

                  <th>
                    City
                  </th>

                  <th>
                    Country
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Phone
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

                {customers.map(
                  (
                    customer,
                    index
                  ) => (

                    <tr
                      key={
                        customer.id
                      }
                    >

                      <td>

                        <span
                          className="history-row-number"
                        >
                          {index + 1}
                        </span>

                      </td>


                      <td>

                        <button type="button" className="entity-link entity-link-block" onClick={() => handleOpenDetails(customer)}>
                          <strong>{customer.customer_code}</strong>
                        </button>

                      </td>


                      <td>

                        <button type="button" className="entity-link entity-link-block" onClick={() => handleOpenDetails(customer)}>
                          <strong>{customer.name}</strong>
                        </button>

                      </td>


                      <td>
                        {
                          customer.city ||
                          "-"
                        }
                      </td>


                      <td>
                        {
                          customer.country ||
                          "-"
                        }
                      </td>


                      <td>
                        {
                          customer.email ||
                          "-"
                        }
                      </td>


                      <td>
                        {
                          customer.phone ||
                          "-"
                        }
                      </td>


                      <td>

                        <span
                          className={
                            customer.is_active
                              ? "status-active"
                              : "status-inactive"
                          }
                        >
                          {
                            customer.is_active
                              ? "Active"
                              : "Inactive"
                          }
                        </span>

                      </td>


                      <td>

                        <div className="action-buttons">
                          
                          <button
  type="button"
  className="secondary-button"
  onClick={() =>
    handleOpenDetails(
      customer
    )
  }
>
  View
</button>
                          <button
                            type="button"
                            className="edit-button"
                            onClick={() =>
                              handleOpenEditForm(
                                customer
                              )
                            }
                          >
                            Edit
                          </button>


                          {customer.is_active && (

                            <button
                              type="button"
                              className="deactivate-button"
                              onClick={() =>
                                handleDeactivate(
                                  customer
                                )
                              }
                              disabled={
                                deactivatingId ===
                                customer.id
                              }
                            >

                              {
                                deactivatingId ===
                                customer.id
                                  ? "Deactivating..."
                                  : "Deactivate"
                              }

                            </button>

                          )}

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

    </div>

  );
}

export default Customers;


