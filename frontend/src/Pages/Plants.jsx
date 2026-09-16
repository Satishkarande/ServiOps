import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { API_URL } from "../config";
function Plants() {
  const {
    accessToken,
    isAuthenticated,
  } = useAuth();

  const navigate = useNavigate();

  const [plants, setPlants] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deactivatingId, setDeactivatingId] =
    useState(null);


  // ============================================================
  // FETCH PLANTS
  // ============================================================

  const fetchPlants = async () => {

    if (!isAuthenticated || !accessToken) {
      return;
    }

    try {

      setError("");

      const response = await fetch(
        `${API_URL}/plants/`,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {

        const errorText =
          await response.text();

        throw new Error(
          `Failed to fetch plants: ${response.status} ${errorText}`
        );

      }

      const data =
        await response.json();

      setPlants(data);

    } catch (error) {

      console.error(
        "Failed to fetch plants:",
        error
      );

      setError(
        error.message
      );

    }

  };


  // ============================================================
  // FETCH CUSTOMERS
  // ============================================================

  const fetchCustomers = async () => {

    if (!isAuthenticated || !accessToken) {
      return;
    }

    try {

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

        const errorText =
          await response.text();

        throw new Error(
          `Failed to fetch customers: ${response.status} ${errorText}`
        );

      }

      const data =
        await response.json();

      setCustomers(data);

    } catch (error) {

      console.error(
        "Failed to fetch customers:",
        error
      );

      setError(
        error.message
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

      await Promise.all([
        fetchPlants(),
        fetchCustomers(),
      ]);

      setLoading(false);

    };


    loadData();

  }, [
    accessToken,
    isAuthenticated,
  ]);


  // ============================================================
  // ADD PLANT
  // ============================================================

  const handleOpenAddForm = () => {

    navigate(
      "/plants/new"
    );

  };


  // ============================================================
  // EDIT PLANT
  // ============================================================

  const handleOpenEditForm = (
    plant
  ) => {

    navigate(
      `/plants/${plant.id}/edit`
    );

  };

  // ============================================================
// VIEW PLANT
// ============================================================

const handleOpenDetails = (
  plant
) => {

  navigate(
    `/plants/${plant.id}`
  );

};


  // ============================================================
  // DEACTIVATE PLANT
  // ============================================================

  const handleDeactivate = async (
    plant
  ) => {

    const confirmed =
      window.confirm(
        `Are you sure you want to deactivate ${plant.name} (${plant.plant_code})?`
      );

    if (!confirmed) {
      return;
    }

    if (!accessToken) {

      setError(
        "You are not logged in."
      );

      return;

    }

    try {

      setDeactivatingId(
        plant.id
      );

      setError("");

      const response =
        await fetch(
          `${API_URL}/plants/${plant.id}`,
          {
            method: "DELETE",

            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          }
        );

      if (!response.ok) {

        const errorText =
          await response.text();

        throw new Error(
          `Failed to deactivate plant: ${response.status} ${errorText}`
        );

      }

      await fetchPlants();

    } catch (error) {

      console.error(
        "Failed to deactivate plant:",
        error
      );

      setError(
        error.message
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
      <div className="plants-page"><div className="loading-state">
        Loading plants...</div></div>
    );

  }


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <div className="plants-page">
      <style>{`
.plants-page{--pl-text:#172033;--pl-muted:#667085;--pl-border:#e5e7eb;--pl-primary:#2563eb;--pl-shadow:0 12px 32px rgba(15,23,42,.07);color:var(--pl-text)}
.plants-page *{box-sizing:border-box}
.plants-page .page-header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:24px}
.plants-page .page-header h2{margin:0;font-size:28px;line-height:1.2;letter-spacing:-.02em}.plants-page .page-header p{margin:8px 0 0;color:var(--pl-muted);font-size:14px}
.plants-page .ticket-section-card{overflow:hidden;border:1px solid var(--pl-border);border-radius:16px;background:#fff;box-shadow:var(--pl-shadow)}
.plants-page .ticket-section-header{padding:20px 22px;border-bottom:1px solid #eef0f3;background:linear-gradient(180deg,#fff 0%,#fbfcfe 100%)}
.plants-page .ticket-section-header h3{margin:0;font-size:17px}.plants-page .ticket-section-header p{margin:5px 0 0;color:var(--pl-muted);font-size:13px}
.plants-page .table-container{border:0!important;border-radius:0!important;box-shadow:none!important;overflow-x:auto}
.plants-page .data-table{min-width:1100px}.plants-page .data-table th{background:#f8fafc;color:#667085;font-size:11px;letter-spacing:.04em;text-transform:uppercase}.plants-page .data-table td{vertical-align:middle}
.plants-page .data-table tbody tr{transition:background .15s}.plants-page .data-table tbody tr:hover{background:#fbfcff}
.plants-page .history-row-number{display:inline-grid;min-width:26px;height:26px;place-items:center;border:1px solid #e5e7eb;border-radius:8px;background:#f8fafc;color:#667085;font-size:12px;font-weight:650}
.plants-page .status-active,.plants-page .status-inactive{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:700}.plants-page .status-active{background:#f0fdf4;color:#15803d}.plants-page .status-inactive{background:#f1f5f9;color:#64748b}
.plants-page .status-active:before,.plants-page .status-inactive:before{content:"";width:6px;height:6px;margin-right:7px;border-radius:50%;background:currentColor;opacity:.75}
.plants-page .action-buttons{display:flex;gap:7px;flex-wrap:wrap}.plants-page .secondary-button,.plants-page .edit-button,.plants-page .deactivate-button{border-radius:8px;transition:transform .15s,background .15s,border-color .15s}
.plants-page .secondary-button:hover:not(:disabled),.plants-page .edit-button:hover:not(:disabled),.plants-page .deactivate-button:hover:not(:disabled){transform:translateY(-1px)}
.plants-page .empty-state{padding:38px 20px;text-align:center}.plants-page .error-message{margin-bottom:18px}
@media(max-width:900px){.plants-page .page-header{align-items:stretch;flex-direction:column}.plants-page .page-header h2{font-size:24px}}
`}</style>



      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

      <div className="page-header">

        <div>

          <h2>
            Plants
          </h2>

          <p>
            Manage customer plants,
            locations and contact details.
          </p>

        </div>


        <button
          type="button"
          className="primary-button"
          onClick={
            handleOpenAddForm
          }
        >
          + Add Plant
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
          PLANT DIRECTORY
      ======================================================= */}

      <section className="ticket-section-card">

        <div className="ticket-section-header">

          <div>

            <h3>
              Plant Directory
            </h3>

            <p>
              {plants.length}{" "}
              {plants.length === 1
                ? "plant"
                : "plants"}{" "}
              in ServiOps
            </p>

          </div>

        </div>


        {plants.length === 0 ? (

          <div className="empty-state">

            <strong>
              No plants found
            </strong>

            <p>
              Add your first plant
              to get started.
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

                  <th>#</th>
                  <th>Plant Code</th>
                  <th>Plant Name</th>
                  <th>Customer</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Country</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Actions</th>

                </tr>

              </thead>


              <tbody>

                {plants.map(
                  (
                    plant,
                    index
                  ) => {

                    const customer =
                      customers.find(
                        item =>
                          item.id ===
                          plant.customer_id
                      );


                    return (

                      <tr
                        key={
                          plant.id
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

                          <button type="button" className="entity-link entity-link-block" onClick={() => navigate(`/plants/${plant.id}`)}>
                            <strong>{plant.plant_code}</strong>
                          </button>

                        </td>


                        <td>

                          <button type="button" className="entity-link entity-link-block" onClick={() => navigate(`/plants/${plant.id}`)}>
                            <strong>{plant.name}</strong>
                          </button>

                        </td>


                        <td>

                          {customer ? (

                            <div>

                              <button type="button" className="entity-link entity-link-block" onClick={() => navigate(`/customers/${customer.id}`)}>
                                <strong>{customer.customer_code}</strong>
                              </button>

                              <button type="button" className="entity-link entity-link-block entity-link-muted" onClick={() => navigate(`/customers/${customer.id}`)}>
                                {customer.name}
                              </button>

                            </div>

                          ) : (

                            <span>
                              -
                            </span>

                          )}

                        </td>


                        <td>
                          {
                            plant.city ||
                            "-"
                          }
                        </td>


                        <td>
                          {
                            plant.state ||
                            "-"
                          }
                        </td>


                        <td>
                          {
                            plant.country ||
                            "-"
                          }
                        </td>


                        <td>

                          <div>

                            <strong
                              style={{
                                display:
                                  "block",
                                fontSize:
                                  "13px",
                              }}
                            >
                              {
                                plant.contact_name ||
                                "-"
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


                            {plant.contact_email && (

                              <span
                                style={{
                                  display:
                                    "block",
                                  color:
                                    "#94a3b8",
                                  fontSize:
                                    "11px",
                                  marginTop:
                                    "2px",
                                }}
                              >
                                {
                                  plant.contact_email
                                }
                              </span>

                            )}

                          </div>

                        </td>


                        <td>

                          <span
                            className={
                              plant.is_active
                                ? "status-active"
                                : "status-inactive"
                            }
                          >
                            {
                              plant.is_active
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
        plant
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
        plant
      )
    }
  >
    Edit
  </button>


  {plant.is_active && (

    <button
      type="button"
      className="deactivate-button"
      onClick={() =>
        handleDeactivate(
          plant
        )
      }
      disabled={
        deactivatingId ===
        plant.id
      }
    >
      {
        deactivatingId ===
        plant.id
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

export default Plants;


