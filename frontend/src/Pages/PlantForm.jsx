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


function PlantForm() {

  const {
    accessToken,
    isAuthenticated,
  } = useAuth();

  const navigate =
    useNavigate();

  const {
    plantId,
  } = useParams();


  const isEditMode =
    Boolean(plantId);


  const [customers, setCustomers] =
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
      plant_code: "",
      name: "",
      address: "",
      city: "",
      state: "",
      country: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      is_active: true,

    });


  // ============================================================
  // FETCH CUSTOMERS
  // ============================================================

  useEffect(() => {

    if (!accessToken) {
      return;
    }


    const loadCustomers =
      async () => {

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

            const text =
              await response.text();

            throw new Error(
              `Failed to fetch customers: ${response.status} ${text}`
            );

          }


          const data =
            await response.json();


          setCustomers(data);

        } catch (err) {

          console.error(err);

          setError(
            err.message
          );

        }

      };


    loadCustomers();

  }, [
    accessToken,
  ]);


  // ============================================================
  // FETCH PLANT FOR EDIT
  // ============================================================

  useEffect(() => {

    if (
      !isEditMode ||
      !accessToken
    ) {

      setLoading(false);

      return;

    }


    const fetchPlant =
      async () => {

        try {

          setLoading(true);

          setError("");


          const response =
            await fetch(
              `${API_URL}/plants/${plantId}`,
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
              `Failed to fetch plant: ${response.status} ${text}`
            );

          }


          const plant =
            await response.json();


          setFormData({

            customer_id:
              plant.customer_id ?? "",

            plant_code:
              plant.plant_code ||
              "",

            name:
              plant.name ||
              "",

            address:
              plant.address ||
              "",

            city:
              plant.city ||
              "",

            state:
              plant.state ||
              "",

            country:
              plant.country ||
              "",

            contact_name:
              plant.contact_name ||
              "",

            contact_email:
              plant.contact_email ||
              "",

            contact_phone:
              plant.contact_phone ||
              "",

            is_active:
              plant.is_active,

          });


        } catch (err) {

          console.error(err);

          setError(
            err.message
          );

        } finally {

          setLoading(false);

        }

      };


    fetchPlant();

  }, [
    accessToken,
    plantId,
    isEditMode,
  ]);


  // ============================================================
  // HANDLE INPUT
  // ============================================================

  const handleChange =
    event => {

      const {
        name,
        value,
        type,
        checked,
      } = event.target;


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
  // CREATE PLANT
  // ============================================================

  const createPlant =
    async () => {

      const payload = {

        customer_id:
          Number(
            formData.customer_id
          ),

        plant_code:
          formData.plant_code.trim(),

        name:
          formData.name.trim(),

        address:
          formData.address.trim(),

        city:
          formData.city.trim(),

        state:
          formData.state.trim(),

        country:
          formData.country.trim(),

        contact_name:
          formData.contact_name.trim(),

        contact_email:
          formData.contact_email.trim(),

        contact_phone:
          formData.contact_phone.trim(),

      };


      const response =
        await fetch(
          `${API_URL}/plants/`,
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
          `Failed to create plant: ${response.status} ${text}`
        );

      }


      return response.json();

    };


  // ============================================================
  // UPDATE PLANT
  // ============================================================

  const updatePlant =
    async () => {

      const payload = {

        name:
          formData.name.trim(),

        address:
          formData.address.trim(),

        city:
          formData.city.trim(),

        state:
          formData.state.trim(),

        country:
          formData.country.trim(),

        contact_name:
          formData.contact_name.trim(),

        contact_email:
          formData.contact_email.trim(),

        contact_phone:
          formData.contact_phone.trim(),

        is_active:
          formData.is_active,

      };


      const response =
        await fetch(
          `${API_URL}/plants/${plantId}`,
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
          `Failed to update plant: ${response.status} ${text}`
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
        !isEditMode &&
        !formData.customer_id
      ) {

        setError(
          "Please select a customer."
        );

        return;

      }


      try {

        setSaving(true);

        setError("");


        if (isEditMode) {

          await updatePlant();

        } else {

          await createPlant();

        }


        navigate(
          "/plants",
          {
            replace: true,
          }
        );


      } catch (err) {

        console.error(
          "Plant save failed:",
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
        "/plants"
      );

    };


  // ============================================================
  // AUTH
  // ============================================================

  if (!isAuthenticated) {

    return (

      <div className="plant-form-page">

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

      <div className="plant-form-page"><div className="loading-state">
        Loading plant...</div></div>

    );

  }


  // ============================================================
  // UI
  // ============================================================

  return (

    <div className="plant-form-page">
      <style>{`
.plant-form-page{--pf-text:#172033;--pf-muted:#667085;--pf-border:#e5e7eb;--pf-soft:#f8fafc;--pf-primary:#2563eb;--pf-shadow:0 12px 32px rgba(15,23,42,.07);color:var(--pf-text)}
.plant-form-page *{box-sizing:border-box}
.plant-form-page .page-header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:24px}
.plant-form-page .admin-page-kicker{display:inline-block;margin-bottom:7px;color:#64748b;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.plant-form-page .page-header h2{margin:0;font-size:28px;line-height:1.2;letter-spacing:-.02em}
.plant-form-page .page-header p{margin:8px 0 0;color:var(--pf-muted);font-size:14px}
.plant-form-page .form-card{overflow:hidden;border:1px solid var(--pf-border);border-radius:16px;background:#fff;box-shadow:var(--pf-shadow)}
.plant-form-page .form-header{padding:22px 24px;border-bottom:1px solid #eef0f3;background:linear-gradient(180deg,#fff 0%,#fbfcfe 100%)}
.plant-form-page .form-header h3{margin:0;font-size:17px}.plant-form-page .form-header p{margin:5px 0 0;color:var(--pf-muted);font-size:13px}
.plant-form-page form{padding:24px}.plant-form-page .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 22px}
.plant-form-page .form-section-title{grid-column:1/-1;padding-bottom:10px;border-bottom:1px solid #eef0f3;color:#344054;font-size:12px;font-weight:750;letter-spacing:.06em;text-transform:uppercase}
.plant-form-page .form-group{min-width:0}.plant-form-page .form-group.full-width{grid-column:1/-1}
.plant-form-page label{display:block;margin-bottom:7px;color:#344054;font-size:13px;font-weight:650}
.plant-form-page input,.plant-form-page select{width:100%;min-height:44px;padding:10px 13px;border:1px solid #d0d5dd;border-radius:9px;outline:none;background:#fff;color:var(--pf-text);font:inherit;font-size:14px;transition:border-color .18s,box-shadow .18s,background .18s}
.plant-form-page input::placeholder{color:#98a2b3}.plant-form-page input:hover:not(:disabled),.plant-form-page select:hover:not(:disabled){border-color:#b8c0cc}
.plant-form-page input:focus,.plant-form-page select:focus{border-color:#84a9f8;box-shadow:0 0 0 3px rgba(37,99,235,.1)}
.plant-form-page input:disabled,.plant-form-page select:disabled{cursor:not-allowed;background:#f4f6f8;color:#667085}
.plant-form-page .form-group small{display:block;margin-top:7px;color:#7b8794;font-size:12px;line-height:1.4}
.plant-form-page .checkbox-label{display:flex;align-items:center;gap:9px;min-height:44px;margin:0;padding:10px 12px;border:1px solid #e5e7eb;border-radius:9px;background:#f8fafc;font-weight:600}
.plant-form-page .checkbox-label input{width:16px;min-height:16px;padding:0;accent-color:#2563eb}
.plant-form-page .form-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:28px;padding-top:20px;border-top:1px solid #eef0f3}
.plant-form-page .primary-button,.plant-form-page .secondary-button{min-height:42px;border-radius:9px;transition:transform .15s,box-shadow .15s,background .15s}
.plant-form-page .primary-button:hover:not(:disabled),.plant-form-page .secondary-button:hover:not(:disabled){transform:translateY(-1px)}
.plant-form-page .error-message{margin-bottom:18px}
@media(max-width:760px){.plant-form-page .page-header{align-items:stretch;flex-direction:column}.plant-form-page .page-header h2{font-size:24px}.plant-form-page .form-grid{grid-template-columns:1fr}.plant-form-page .form-group.full-width,.plant-form-page .form-section-title{grid-column:auto}.plant-form-page form{padding:18px}.plant-form-page .form-header{padding:18px}.plant-form-page .form-actions{flex-direction:column-reverse}.plant-form-page .primary-button,.plant-form-page .secondary-button{width:100%}}
`}</style>



      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="page-header">

        <div>

          <span className="admin-page-kicker">
            Plants
          </span>

          <h2>
            {isEditMode
              ? "Edit Plant"
              : "Add Plant"}
          </h2>

          <p>
            {isEditMode
              ? "Update plant information and contact details."
              : "Create a new plant under a customer."}
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
          ← Back to Plants
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
                ? "Plant Information"
                : "New Plant"}
            </h3>

            <p>
              Complete the plant details below.
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
                PLANT DETAILS
            =================================================== */}

            <div className="form-section-title">
              Plant Details
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
                disabled={
                  isEditMode
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


              {!isEditMode && (

                <small>
                  Select the customer
                  who owns this plant.
                </small>

              )}

            </div>


            {/* Plant Code */}

            <div className="form-group">

              <label>
                Plant Code *
              </label>

              <input
                type="text"
                name="plant_code"
                value={
                  formData.plant_code
                }
                onChange={
                  handleChange
                }
                disabled={
                  isEditMode
                }
                placeholder="e.g. PLT002"
                required
              />


              {isEditMode && (

                <small>
                  Plant code cannot
                  be changed.
                </small>

              )}

            </div>


            {/* Plant Name */}

            <div className="form-group">

              <label>
                Plant Name *
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
                placeholder="e.g. Pune Plant"
                required
              />

            </div>


            {/* City */}

            <div className="form-group">

              <label>
                City *
              </label>

              <input
                type="text"
                name="city"
                value={
                  formData.city
                }
                onChange={
                  handleChange
                }
                placeholder="e.g. Pune"
                required
              />

            </div>


            {/* State */}

            <div className="form-group">

              <label>
                State *
              </label>

              <input
                type="text"
                name="state"
                value={
                  formData.state
                }
                onChange={
                  handleChange
                }
                placeholder="e.g. Maharashtra"
                required
              />

            </div>


            {/* Country */}

            <div className="form-group">

              <label>
                Country *
              </label>

              <input
                type="text"
                name="country"
                value={
                  formData.country
                }
                onChange={
                  handleChange
                }
                placeholder="e.g. India"
                required
              />

            </div>


            {/* Address */}

            <div className="form-group full-width">

              <label>
                Address *
              </label>

              <input
                type="text"
                name="address"
                value={
                  formData.address
                }
                onChange={
                  handleChange
                }
                placeholder="Enter the complete plant address"
                required
              />

            </div>


            {/* ==================================================
                CONTACT INFORMATION
            =================================================== */}

            <div className="form-section-title">
              Contact Information
            </div>


            {/* Contact Name */}

            <div className="form-group">

              <label>
                Contact Name *
              </label>

              <input
                type="text"
                name="contact_name"
                value={
                  formData.contact_name
                }
                onChange={
                  handleChange
                }
                placeholder="e.g. Rahul Patil"
                required
              />

            </div>


            {/* Contact Phone */}

            <div className="form-group">

              <label>
                Contact Phone *
              </label>

              <input
                type="text"
                name="contact_phone"
                value={
                  formData.contact_phone
                }
                onChange={
                  handleChange
                }
                placeholder="+91 9876543210"
                required
              />

            </div>


            {/* Contact Email */}

            <div className="form-group">

              <label>
                Contact Email *
              </label>

              <input
                type="email"
                name="contact_email"
                value={
                  formData.contact_email
                }
                onChange={
                  handleChange
                }
                placeholder="contact@example.com"
                required
              />

            </div>


            {/* Status */}

            {isEditMode && (

              <div className="form-group">

                <label>
                  Plant Status
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

                  Active Plant

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
                (
                  !isEditMode &&
                  !formData.customer_id
                )
              }
            >

              {saving
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Plant"}

            </button>

          </div>

        </form>

      </section>

    </div>

  );

}

export default PlantForm;


