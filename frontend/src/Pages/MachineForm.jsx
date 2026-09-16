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


function MachineForm() {

  const {
    accessToken,
    isAuthenticated,
  } = useAuth();

  const navigate =
    useNavigate();

  const {
    machineId,
  } = useParams();


  const isEditMode =
    Boolean(machineId);


  const [plants, setPlants] =
    useState([]);

  const [customers, setCustomers] =
    useState([]);

  const [formPlants, setFormPlants] =
    useState([]);


  const [loading, setLoading] =
    useState(isEditMode);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  const [formData, setFormData] =
    useState({

      customer_id: "",
      plant_id: "",
      machine_code: "",
      name: "",
      model: "",
      serial_number: "",
      manufacturer: "",
      installation_date: "",
      status: "ACTIVE",
      warranty_expiry: "",
      is_active: true,

    });


  // ============================================================
  // FETCH CUSTOMERS AND PLANTS
  // ============================================================

  useEffect(() => {

    if (!accessToken) {
      return;
    }


    const loadData =
      async () => {

        try {

          const [
            customersResponse,
            plantsResponse,
          ] = await Promise.all([

            fetch(
              `${API_URL}/customers/`,
              {
                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                },
              }
            ),

            fetch(
              `${API_URL}/plants/`,
              {
                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                },
              }
            ),

          ]);


          if (
            !customersResponse.ok
          ) {

            const text =
              await customersResponse.text();

            throw new Error(
              `Failed to fetch customers: ${customersResponse.status} ${text}`
            );

          }


          if (
            !plantsResponse.ok
          ) {

            const text =
              await plantsResponse.text();

            throw new Error(
              `Failed to fetch plants: ${plantsResponse.status} ${text}`
            );

          }


          const customersData =
            await customersResponse.json();

          const plantsData =
            await plantsResponse.json();


          setCustomers(
            customersData
          );

          setPlants(
            plantsData
          );

        } catch (err) {

          console.error(err);

          setError(
            err.message
          );

        }

      };


    loadData();

  }, [
    accessToken,
  ]);


  // ============================================================
  // FETCH PLANTS FOR CUSTOMER
  // ============================================================

  const fetchPlantsForCustomer =
    async customerId => {

      if (
        !customerId ||
        !accessToken
      ) {

        setFormPlants([]);

        return;

      }


      try {

        const response =
          await fetch(
            `${API_URL}/plants/?customer_id=${customerId}`,
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
            `Failed to fetch customer plants: ${response.status} ${text}`
          );

        }


        const data =
          await response.json();


        setFormPlants(
          data.filter(
            plant =>
              plant.is_active
          )
        );

      } catch (err) {

        console.error(err);

        setFormPlants([]);

        setError(
          err.message
        );

      }

    };


  // ============================================================
  // FETCH MACHINE FOR EDIT
  // ============================================================

  useEffect(() => {

    if (
      !isEditMode ||
      !accessToken ||
      plants.length === 0
    ) {

      return;

    }


    const fetchMachine =
      async () => {

        try {

          setLoading(true);

          setError("");


          const response =
            await fetch(
              `${API_URL}/machines/${machineId}`,
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
              `Failed to fetch machine: ${response.status} ${text}`
            );

          }


          const machine =
            await response.json();


          const machinePlant =
            plants.find(
              plant =>
                plant.id ===
                machine.plant_id
            );


          const customerId =
            machinePlant?.customer_id ??
            "";


          setFormData({

            customer_id:
              customerId,

            plant_id:
              machine.plant_id ??
              "",

            machine_code:
              machine.machine_code ||
              "",

            name:
              machine.name ||
              "",

            model:
              machine.model ||
              "",

            serial_number:
              machine.serial_number ||
              "",

            manufacturer:
              machine.manufacturer ||
              "",

            installation_date:
              machine.installation_date ||
              "",

            status:
              machine.status ||
              "ACTIVE",

            warranty_expiry:
              machine.warranty_expiry ||
              "",

            is_active:
              machine.is_active,

          });


          if (customerId) {

            await fetchPlantsForCustomer(
              customerId
            );

          }

        } catch (err) {

          console.error(err);

          setError(
            err.message
          );

        } finally {

          setLoading(false);

        }

      };


    fetchMachine();

  }, [
    accessToken,
    machineId,
    isEditMode,
    plants,
  ]);


  // ============================================================
  // HANDLE INPUT CHANGE
  // ============================================================

  const handleChange =
    event => {

      const {
        name,
        value,
        type,
        checked,
      } = event.target;


      if (
        name === "customer_id"
      ) {

        setFormData(
          previous => ({
            ...previous,

            customer_id:
              value,

            plant_id:
              "",
          })
        );


        setFormPlants([]);


        if (value) {

          fetchPlantsForCustomer(
            value
          );

        }


        return;

      }


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
  // CREATE MACHINE
  // ============================================================

  const createMachine =
    async () => {

      const payload = {

        plant_id:
          Number(
            formData.plant_id
          ),

        machine_code:
          formData.machine_code.trim(),

        name:
          formData.name.trim(),

        model:
          formData.model.trim(),

        serial_number:
          formData.serial_number.trim(),

        manufacturer:
          formData.manufacturer.trim(),

        installation_date:
          formData.installation_date ||
          null,

        status:
          formData.status,

        warranty_expiry:
          formData.warranty_expiry ||
          null,

      };


      const response =
        await fetch(
          `${API_URL}/machines/`,
          {
            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,

            },

            body:
              JSON.stringify(
                payload
              ),

          }
        );


      if (!response.ok) {

        const text =
          await response.text();

        throw new Error(
          `Failed to create machine: ${response.status} ${text}`
        );

      }


      return response.json();

    };


  // ============================================================
  // UPDATE MACHINE
  // ============================================================

  const updateMachine =
    async () => {

      const payload = {

        plant_id:
          Number(
            formData.plant_id
          ),

        name:
          formData.name.trim(),

        model:
          formData.model.trim(),

        manufacturer:
          formData.manufacturer.trim(),

        installation_date:
          formData.installation_date ||
          null,

        status:
          formData.status,

        warranty_expiry:
          formData.warranty_expiry ||
          null,

        is_active:
          formData.is_active,

      };


      const response =
        await fetch(
          `${API_URL}/machines/${machineId}`,
          {
            method: "PATCH",

            headers: {

              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,

            },

            body:
              JSON.stringify(
                payload
              ),

          }
        );


      if (!response.ok) {

        const text =
          await response.text();

        throw new Error(
          `Failed to update machine: ${response.status} ${text}`
        );

      }


      return response.json();

    };


  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit =
    async event => {

      event.preventDefault();


      if (!accessToken) {

        setError(
          "You are not logged in."
        );

        return;

      }


      if (
        !formData.customer_id
      ) {

        setError(
          "Please select a customer."
        );

        return;

      }


      if (
        !formData.plant_id
      ) {

        setError(
          "Please select a plant."
        );

        return;

      }


      try {

        setSaving(true);

        setError("");


        if (isEditMode) {

          await updateMachine();

        } else {

          await createMachine();

        }


        navigate(
          "/machines",
          {
            replace: true,
          }
        );

      } catch (err) {

        console.error(
          "Machine save failed:",
          err
        );

        setError(
          err.message
        );

      } finally {

        setSaving(false);

      }

    };


  // ============================================================
  // CANCEL
  // ============================================================

  const handleCancel =
    () => {

      navigate(
        "/machines"
      );

    };


  // ============================================================
  // AUTH
  // ============================================================

  if (!isAuthenticated) {

    return (

      <div className="machine-form-page"><div className="empty-state">

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

  if (
    loading &&
    isEditMode
  ) {

    return (

      <div className="machine-form-page"><div className="loading-state">
        Loading machine...
      </div></div>

    );

  }


  // ============================================================
  // UI
  // ============================================================

  return (

    <div className="machine-form-page">
      <style>{`
.machine-form-page{--mf-text:#172033;--mf-muted:#667085;--mf-border:#e5e7eb;--mf-primary:#2563eb;--mf-shadow:0 12px 32px rgba(15,23,42,.07);color:var(--mf-text)}
.machine-form-page *{box-sizing:border-box}
.machine-form-page .page-header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:24px}
.machine-form-page .admin-page-kicker{display:inline-block;margin-bottom:7px;color:#64748b;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.machine-form-page .page-header h2{margin:0;font-size:28px;line-height:1.2;letter-spacing:-.02em}.machine-form-page .page-header p{margin:8px 0 0;color:var(--mf-muted);font-size:14px}
.machine-form-page .form-card{overflow:hidden;border:1px solid var(--mf-border);border-radius:16px;background:#fff;box-shadow:var(--mf-shadow)}
.machine-form-page .form-header{padding:22px 24px;border-bottom:1px solid #eef0f3;background:linear-gradient(180deg,#fff 0%,#fbfcfe 100%)}
.machine-form-page .form-header h3{margin:0;font-size:17px}.machine-form-page .form-header p{margin:5px 0 0;color:var(--mf-muted);font-size:13px}
.machine-form-page form{padding:24px}.machine-form-page .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 22px}
.machine-form-page .form-section-title{grid-column:1/-1;padding-bottom:10px;border-bottom:1px solid #eef0f3;color:#344054;font-size:12px;font-weight:750;letter-spacing:.06em;text-transform:uppercase}
.machine-form-page .form-group{min-width:0}.machine-form-page label{display:block;margin-bottom:7px;color:#344054;font-size:13px;font-weight:650}
.machine-form-page input,.machine-form-page select{width:100%;min-height:44px;padding:10px 13px;border:1px solid #d0d5dd;border-radius:9px;outline:none;background:#fff;color:var(--mf-text);font:inherit;font-size:14px;transition:border-color .18s,box-shadow .18s,background .18s}
.machine-form-page input::placeholder{color:#98a2b3}.machine-form-page input:hover:not(:disabled),.machine-form-page select:hover:not(:disabled){border-color:#b8c0cc}
.machine-form-page input:focus,.machine-form-page select:focus{border-color:#84a9f8;box-shadow:0 0 0 3px rgba(37,99,235,.1)}
.machine-form-page input:disabled,.machine-form-page select:disabled{cursor:not-allowed;background:#f4f6f8;color:#667085}
.machine-form-page .form-group small{display:block;margin-top:7px;color:#7b8794;font-size:12px;line-height:1.4}
.machine-form-page .checkbox-label{display:flex;align-items:center;gap:9px;min-height:44px;margin:0;padding:10px 12px;border:1px solid #e5e7eb;border-radius:9px;background:#f8fafc;font-weight:600}
.machine-form-page .checkbox-label input{width:16px;min-height:16px;padding:0;accent-color:#2563eb}
.machine-form-page .form-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:28px;padding-top:20px;border-top:1px solid #eef0f3}
.machine-form-page .primary-button,.machine-form-page .secondary-button{min-height:42px;border-radius:9px;transition:transform .15s,box-shadow .15s,background .15s}
.machine-form-page .primary-button:hover:not(:disabled),.machine-form-page .secondary-button:hover:not(:disabled){transform:translateY(-1px)}
.machine-form-page .error-message{margin-bottom:18px}
@media(max-width:760px){.machine-form-page .page-header{align-items:stretch;flex-direction:column}.machine-form-page .page-header h2{font-size:24px}.machine-form-page .form-grid{grid-template-columns:1fr}.machine-form-page .form-section-title{grid-column:auto}.machine-form-page form{padding:18px}.machine-form-page .form-header{padding:18px}.machine-form-page .form-actions{flex-direction:column-reverse}.machine-form-page .primary-button,.machine-form-page .secondary-button{width:100%}}
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

            {isEditMode
              ? "Edit Machine"
              : "Add Machine"}

          </h2>

          <p>

            {isEditMode
              ? "Update machine information and plant assignment."
              : "Create a machine under a customer plant."}

          </p>

        </div>


        <button
          type="button"
          className="secondary-button"
          onClick={
            handleCancel
          }
          disabled={
            saving
          }
        >
          ← Back to Machines
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

      <section className="form-card">


        <div className="form-header">

          <div>

            <h3>

              {isEditMode
                ? "Machine Information"
                : "New Machine"}

            </h3>

            <p>
              Complete the machine details below.
            </p>

          </div>

        </div>


        <form
          onSubmit={
            handleSubmit
          }
        >

          <div className="form-grid">


            {/* ==================================================
                LOCATION
            =================================================== */}

            <div className="form-section-title">
              Machine Location
            </div>


            {/* Customer */}

            <div className="form-group">

              <label>
                Customer *
              </label>

              <select
                name="customer_id"
                value={
                  formData.customer_id
                }
                onChange={
                  handleChange
                }
                required
              >

                <option value="">
                  Select Customer
                </option>


                {customers
                  .filter(
                    customer =>
                      customer.is_active
                  )
                  .map(
                    customer => (

                      <option
                        key={
                          customer.id
                        }
                        value={
                          customer.id
                        }
                      >

                        {
                          customer.customer_code
                        }

                        {" - "}

                        {
                          customer.name
                        }

                      </option>

                    )
                  )}

              </select>


              <small>
                Select the customer
                that owns the plant.
              </small>

            </div>


            {/* Plant */}

            <div className="form-group">

              <label>
                Plant *
              </label>

              <select
                name="plant_id"
                value={
                  formData.plant_id
                }
                onChange={
                  handleChange
                }
                disabled={
                  !formData.customer_id
                }
                required
              >

                <option value="">

                  {!formData.customer_id

                    ? "Select Customer First"

                    : formPlants.length === 0

                      ? "No active plants found"

                      : "Select Plant"}

                </option>


                {formPlants.map(
                  plant => (

                    <option
                      key={
                        plant.id
                      }
                      value={
                        plant.id
                      }
                    >

                      {
                        plant.plant_code
                      }

                      {" - "}

                      {
                        plant.name
                      }

                    </option>

                  )
                )}

              </select>


              <small>
                Only active plants
                belonging to the
                selected customer
                are shown.
              </small>

            </div>


            {/* ==================================================
                MACHINE DETAILS
            =================================================== */}

            <div className="form-section-title">
              Machine Details
            </div>


            {/* Machine Code */}

            <div className="form-group">

              <label>
                Machine Code *
              </label>

              <input
                type="text"
                name="machine_code"
                value={
                  formData.machine_code
                }
                onChange={
                  handleChange
                }
                disabled={
                  isEditMode
                }
                placeholder="e.g. MCH003"
                required
              />


              {isEditMode && (

                <small>
                  Machine code cannot
                  be changed.
                </small>

              )}

            </div>


            {/* Machine Name */}

            <div className="form-group">

              <label>
                Machine Name *
              </label>

              <input
                type="text"
                name="name"
                value={
                  formData.name
                }
                onChange={
                  handleChange
                }
                placeholder="e.g. Packaging Machine 02"
                required
              />

            </div>


            {/* Model */}

            <div className="form-group">

              <label>
                Model *
              </label>

              <input
                type="text"
                name="model"
                value={
                  formData.model
                }
                onChange={
                  handleChange
                }
                placeholder="e.g. SACMI P-Series"
                required
              />

            </div>


            {/* Serial Number */}

            <div className="form-group">

              <label>
                Serial Number *
              </label>

              <input
                type="text"
                name="serial_number"
                value={
                  formData.serial_number
                }
                onChange={
                  handleChange
                }
                disabled={
                  isEditMode
                }
                placeholder="e.g. SN-2026-001"
                required
              />


              {isEditMode && (

                <small>
                  Serial number cannot
                  be changed.
                </small>

              )}

            </div>


            {/* Manufacturer */}

            <div className="form-group">

              <label>
                Manufacturer *
              </label>

              <input
                type="text"
                name="manufacturer"
                value={
                  formData.manufacturer
                }
                onChange={
                  handleChange
                }
                placeholder="e.g. SACMI"
                required
              />

            </div>


            {/* Status */}

            <div className="form-group">

              <label>
                Status *
              </label>

              <select
                name="status"
                value={
                  formData.status
                }
                onChange={
                  handleChange
                }
                required
              >

                <option value="ACTIVE">
                  Active
                </option>

                <option value="IN-SERVICE">
                  In Service
                </option>

                <option value="MAINTENANCE">
                  Maintenance
                </option>

                <option value="BREAKDOWN">
                  Breakdown
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>

              </select>

            </div>


            {/* ==================================================
                LIFECYCLE
            =================================================== */}

            <div className="form-section-title">
              Lifecycle & Warranty
            </div>


            {/* Installation */}

            <div className="form-group">

              <label>
                Installation Date
              </label>

              <input
                type="date"
                name="installation_date"
                value={
                  formData.installation_date
                }
                onChange={
                  handleChange
                }
              />

            </div>


            {/* Warranty */}

            <div className="form-group">

              <label>
                Warranty Expiry
              </label>

              <input
                type="date"
                name="warranty_expiry"
                value={
                  formData.warranty_expiry
                }
                onChange={
                  handleChange
                }
              />

            </div>


            {/* Active */}

            {isEditMode && (

              <div className="form-group">

                <label>
                  Machine Status
                </label>

                <label className="checkbox-label">

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

                  Active Machine

                </label>

              </div>

            )}

          </div>


          {/* ==================================================
              ACTIONS
          =================================================== */}

          <div className="form-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={
                handleCancel
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
                saving ||
                !formData.customer_id ||
                !formData.plant_id
              }
            >

              {saving

                ? "Saving..."

                : isEditMode

                  ? "Save Changes"

                  : "Create Machine"}

            </button>

          </div>

        </form>

      </section>

    </div>

  );

}

export default MachineForm;


