import { useEffect, useState } from "react";

import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function Machines() {
  const {
    accessToken,
    isAuthenticated,
  } = useAuth();

  const navigate = useNavigate();

  const [machines, setMachines] = useState([]);
  const [plants, setPlants] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deactivatingId, setDeactivatingId] =
    useState(null);


  // ============================================================
  // FETCH MACHINES
  // ============================================================

  const fetchMachines = async () => {

    if (
      !isAuthenticated ||
      !accessToken
    ) {
      return;
    }

    try {

      setError("");

      const response =
        await fetch(
          `${API_URL}/machines/`,
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
          `Failed to fetch machines: ${response.status} ${errorText}`
        );

      }


      const data =
        await response.json();

      setMachines(data);

    } catch (error) {

      console.error(
        "Failed to fetch machines:",
        error
      );

      setError(
        error.message
      );

    }

  };


  // ============================================================
  // FETCH PLANTS
  // ============================================================

  const fetchPlants = async () => {

    if (
      !isAuthenticated ||
      !accessToken
    ) {
      return;
    }

    try {

      const response =
        await fetch(
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

    if (
      !isAuthenticated ||
      !accessToken
    ) {
      return;
    }

    try {

      const response =
        await fetch(
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
        fetchMachines(),
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
  // ADD MACHINE
  // ============================================================

  const handleOpenAddForm = () => {

    navigate(
      "/machines/new"
    );

  };


  // ============================================================
  // EDIT MACHINE
  // ============================================================

  const handleOpenEditForm = (
    machine
  ) => {

    navigate(
      `/machines/${machine.id}/edit`
    );

  };


  // ============================================================
  // DEACTIVATE MACHINE
  // ============================================================

  const handleDeactivate = async (
    machine
  ) => {

    const confirmed =
      window.confirm(
        `Are you sure you want to deactivate ${machine.name} (${machine.machine_code})?`
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
        machine.id
      );

      setError("");


      const response =
        await fetch(
          `${API_URL}/machines/${machine.id}`,
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
          `Failed to deactivate machine: ${response.status} ${errorText}`
        );

      }


      await fetchMachines();

    } catch (error) {

      console.error(
        "Failed to deactivate machine:",
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
      <div className="machines-page"><div className="empty-state">

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
      <div className="machines-page"><div className="loading-state">
        Loading machines...
      </div></div>
    );

  }


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <div className="machines-page">
      <style>{`
.machines-page{--m-text:#172033;--m-muted:#667085;--m-border:#e5e7eb;--m-primary:#2563eb;--m-shadow:0 12px 32px rgba(15,23,42,.07);color:var(--m-text)}
.machines-page *{box-sizing:border-box}
.machines-page .page-header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:24px}
.machines-page .page-header h2{margin:0;font-size:28px;line-height:1.2;letter-spacing:-.02em}
.machines-page .page-header p{margin:8px 0 0;color:var(--m-muted);font-size:14px}
.machines-page .ticket-section-card{overflow:hidden;border:1px solid var(--m-border);border-radius:16px;background:#fff;box-shadow:var(--m-shadow)}
.machines-page .ticket-section-header{padding:20px 22px;border-bottom:1px solid #eef0f3;background:linear-gradient(180deg,#fff 0%,#fbfcfe 100%)}
.machines-page .ticket-section-header h3{margin:0;font-size:17px}.machines-page .ticket-section-header p{margin:5px 0 0;color:var(--m-muted);font-size:13px}
.machines-page .table-container{border:0!important;border-radius:0!important;box-shadow:none!important;overflow-x:auto}
.machines-page .data-table{min-width:1250px}.machines-page .data-table th{background:#f8fafc;color:#667085;font-size:11px;letter-spacing:.04em;text-transform:uppercase}.machines-page .data-table td{vertical-align:middle}
.machines-page .data-table tbody tr{transition:background .15s}.machines-page .data-table tbody tr:hover{background:#fbfcff}
.machines-page .history-row-number{display:inline-grid;min-width:26px;height:26px;place-items:center;border:1px solid #e5e7eb;border-radius:8px;background:#f8fafc;color:#667085;font-size:12px;font-weight:650}
.machines-page .status-active,.machines-page .status-inactive{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}
.machines-page .status-active{background:#f0fdf4;color:#15803d}.machines-page .status-inactive{background:#f1f5f9;color:#64748b}
.machines-page .status-active:before,.machines-page .status-inactive:before{content:"";width:6px;height:6px;margin-right:7px;border-radius:50%;background:currentColor;opacity:.75}
.machines-page .action-buttons{display:flex;gap:7px;flex-wrap:wrap}
.machines-page .secondary-button,.machines-page .edit-button,.machines-page .deactivate-button{border-radius:8px;transition:transform .15s,background .15s,border-color .15s}
.machines-page .secondary-button:hover:not(:disabled),.machines-page .edit-button:hover:not(:disabled),.machines-page .deactivate-button:hover:not(:disabled){transform:translateY(-1px)}
.machines-page .empty-state{padding:38px 20px;text-align:center}.machines-page .error-message{margin-bottom:18px}
@media(max-width:900px){.machines-page .page-header{align-items:stretch;flex-direction:column}.machines-page .page-header h2{font-size:24px}}
`}</style>



      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

      <div className="page-header">

        <div>

          <h2>
            Machines
          </h2>

          <p>
            Manage machines across
            customer plants.
          </p>

        </div>


        <button
          type="button"
          className="primary-button"
          onClick={
            handleOpenAddForm
          }
        >
          + Add Machine
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
          MACHINE DIRECTORY
      ======================================================= */}

      <section className="ticket-section-card">

        <div className="ticket-section-header">

          <div>

            <h3>
              Machine Directory
            </h3>

            <p>

              {machines.length}{" "}

              {
                machines.length === 1
                  ? "machine"
                  : "machines"
              }{" "}

              in ServiOps

            </p>

          </div>

        </div>


        {/* ====================================================
            EMPTY STATE
        ===================================================== */}

        {machines.length === 0 ? (

          <div className="empty-state">

            <strong>
              No machines found
            </strong>

            <p>
              Add your first machine
              to get started.
            </p>

          </div>

        ) : (

          <div
            className="table-container"
            style={{
              border:
                "none",
              borderRadius:
                0,
              boxShadow:
                "none",
            }}
          >

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
                    Customer
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
                  ) => {

                    const plant =
                      plants.find(
                        item =>
                          item.id ===
                          machine.plant_id
                      );


                    const customer =
                      plant
                        ? customers.find(
                            item =>
                              item.id ===
                              plant.customer_id
                          )
                        : null;


                    return (

                      <tr
                        key={
                          machine.id
                        }
                      >

                        {/* NUMBER */}

                        <td>

                          <span
                            className="history-row-number"
                          >
                            {
                              index + 1
                            }
                          </span>

                        </td>


                        {/* MACHINE */}

                        <td>

                          <button type="button" className="entity-link entity-link-block" onClick={() => navigate(`/machines/${machine.id}`)}>
                            <strong>{machine.machine_code}</strong>
                          </button>


                          <button type="button" className="entity-link entity-link-block entity-link-muted" onClick={() => navigate(`/machines/${machine.id}`)}>
                            {machine.name}
                          </button>

                        </td>


                        {/* PLANT */}

                        <td>

                          {plant ? (

                            <div>

                              <button type="button" className="entity-link entity-link-block" onClick={() => navigate(`/plants/${plant.id}`)}>
                                <strong>{plant.plant_code}</strong>
                              </button>


                              <button type="button" className="entity-link entity-link-block entity-link-muted" onClick={() => navigate(`/plants/${plant.id}`)}>
                                {plant.name}
                              </button>

                            </div>

                          ) : (

                            "-"

                          )}

                        </td>


                        {/* CUSTOMER */}

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

                            "-"

                          )}

                        </td>


                        {/* MODEL */}

                        <td>
                          {
                            machine.model ||
                            "-"
                          }
                        </td>


                        {/* SERIAL */}

                        <td>
                          {
                            machine.serial_number ||
                            "-"
                          }
                        </td>


                        {/* MANUFACTURER */}

                        <td>
                          {
                            machine.manufacturer ||
                            "-"
                          }
                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            className={
                              machine.status ===
                                "ACTIVE" ||
                              machine.status ===
                                "IN-SERVICE"

                                ? "status-active"

                                : "status-inactive"
                            }
                          >

                            {
                              machine.status ||
                              "-"
                            }

                          </span>

                        </td>


                        {/* WARRANTY */}

                        <td>

                          {
                            machine.warranty_expiry ||
                            "-"
                          }

                        </td>


                        {/* ACTIONS */}

                        <td>

                          <div className="action-buttons">

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


  <button
    type="button"
    className="edit-button"
    onClick={() =>
      handleOpenEditForm(
        machine
      )
    }
  >
    Edit
  </button>


  {machine.is_active && (

    <button
      type="button"
      className="deactivate-button"
      onClick={() =>
        handleDeactivate(
          machine
        )
      }
      disabled={
        deactivatingId ===
        machine.id
      }
    >

      {
        deactivatingId ===
        machine.id

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

export default Machines;


