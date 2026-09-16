import {
  useEffect,
  useState,
} from "react";
import { API_URL } from "../config";
import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../auth/AuthContext";




function TicketCreate() {

  const navigate =
    useNavigate();

  const {
    accessToken,
    isAuthenticated,
    currentUser,
    hasPermission,
  } = useAuth();


  // ============================================================
  // STATE
  // ============================================================

  const [customers, setCustomers] =
    useState([]);

  const [plants, setPlants] =
    useState([]);

  const [machines, setMachines] =
    useState([]);

  const [engineers, setEngineers] =
    useState([]);

  const [departments, setDepartments] =
    useState([]);

  const [subDepartments, setSubDepartments] =
    useState([]);

  const [formPlants, setFormPlants] =
    useState([]);

  const [formMachines, setFormMachines] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  const [formData, setFormData] =
    useState({

      ticket_number: "",

      customer_id: "",

      plant_id: "",

      machine_id: "",

      department_id: "",

      sub_department_id: "",

      created_by_id: "",

      assigned_to_id: "",

      title: "",

      description: "",

      priority: "MEDIUM",

    });


  // ============================================================
  // KEEP CREATED BY IN SYNC WITH CURRENT USER
  // ============================================================

  useEffect(() => {

    if (
      currentUser?.id
    ) {

      setFormData(
        previous => ({

          ...previous,

          created_by_id:
            String(
              currentUser.id
            ),

        })
      );

    }

  }, [
    currentUser,
  ]);


  // ============================================================
  // GENERIC API REQUEST
  // ============================================================

  const fetchJson =
    async (
      url,
      options = {}
    ) => {

      if (!accessToken) {

        throw new Error(
          "Authentication token is missing."
        );

      }


      const response =
        await fetch(
          url,
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

            if (
              typeof data.detail ===
              "string"
            ) {

              message =
                data.detail;

            } else if (
              Array.isArray(
                data.detail
              )
            ) {

              message =
                data.detail
                  .map(
                    item => {

                      if (
                        typeof item ===
                        "string"
                      ) {

                        return item;

                      }

                      return (
                        item?.msg ||
                        JSON.stringify(
                          item
                        )
                      );

                    }
                  )
                  .join(", ");

            } else {

              message =
                JSON.stringify(
                  data.detail
                );

            }

          }

        } catch {

          // Ignore JSON parsing failure.

        }


        throw new Error(
          message
        );

      }


      if (
        response.status ===
        204
      ) {

        return null;

      }


      return response.json();

    };


  // ============================================================
  // FETCH CUSTOMERS
  // ============================================================

  const fetchCustomers =
    async () => {

      const data =
        await fetchJson(
          `${API_URL}/customers/`
        );


      setCustomers(
        data || []
      );

    };


  // ============================================================
  // FETCH PLANTS
  // ============================================================

  const fetchPlants =
    async () => {

      const data =
        await fetchJson(
          `${API_URL}/plants/`
        );


      setPlants(
        data || []
      );

    };


  // ============================================================
  // FETCH MACHINES
  // ============================================================

  const fetchMachines =
    async () => {

      const data =
        await fetchJson(
          `${API_URL}/machines/`
        );


      setMachines(
        data || []
      );

    };


  // ============================================================
  // FETCH DEPARTMENTS
  // ============================================================

  const fetchDepartments =
    async () => {

      const data =
        await fetchJson(
          `${API_URL}/departments/`
        );


      setDepartments(
        (data || []).filter(
          department =>
            department.is_active !== false
        )
      );

    };


  // ============================================================
  // FETCH SUB-DEPARTMENTS
  // ============================================================

  const fetchSubDepartments =
    async (
      departmentId
    ) => {

      if (!departmentId) {

        setSubDepartments([]);

        return;

      }


      const data =
        await fetchJson(
          `${API_URL}/sub-departments/?department_id=${departmentId}`
        );


      setSubDepartments(
        data || []
      );

    };


  // ============================================================
  // FETCH ASSIGNABLE ENGINEERS
  // ============================================================

  const fetchAssignableEngineers =
    async () => {

      if (
        !hasPermission(
          "assign_engineer"
        )
      ) {

        setEngineers([]);

        return;

      }


      try {

        const data =
          await fetchJson(
            `${API_URL}/tickets/assignable-engineers`
          );


        setEngineers(
          data || []
        );

      } catch (error) {

        console.error(
          "Failed to load engineers:",
          error
        );


        /*
         * Engineer loading should not prevent
         * ticket creation from working.
         */

        setEngineers([]);

      }

    };


  // ============================================================
  // INITIAL LOAD
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


          await Promise.all([

            fetchCustomers(),

            fetchPlants(),

            fetchMachines(),

            fetchDepartments(),

          ]);


          await fetchAssignableEngineers();

        } catch (error) {

          console.error(
            "Failed to load ticket creation page:",
            error
          );


          setError(
            error.message
          );

        } finally {

          setLoading(false);

        }

      };


    load();

  }, [
    accessToken,
    isAuthenticated,
  ]);


  // ============================================================
  // CUSTOMER → PLANTS
  // ============================================================

  const fetchPlantsForCustomer =
    async (
      customerId
    ) => {

      if (!customerId) {

        setFormPlants([]);

        setFormMachines([]);

        return;

      }


      try {

        const data =
          await fetchJson(
            `${API_URL}/plants/?customer_id=${customerId}`
          );


        setFormPlants(
          (data || []).filter(
            plant =>
              plant.is_active
          )
        );


        setFormMachines([]);

      } catch (error) {

        console.error(
          "Failed to load plants:",
          error
        );


        setFormPlants([]);

        setFormMachines([]);

        setError(
          error.message
        );

      }

    };


  // ============================================================
  // PLANT → MACHINES
  // ============================================================

  const filterMachinesForPlant =
    (
      plantId
    ) => {

      if (!plantId) {

        setFormMachines([]);

        return;

      }


      const filtered =
        machines.filter(
          machine =>

            Number(
              machine.plant_id
            ) ===
            Number(
              plantId
            ) &&

            machine.is_active

        );


      setFormMachines(
        filtered
      );

    };


  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange =
    async (
      event
    ) => {

      const {
        name,
        value,
      } = event.target;


      // --------------------------------------------------------
      // CUSTOMER
      // --------------------------------------------------------

      if (
        name ===
        "customer_id"
      ) {

        setFormData(
          previous => ({

            ...previous,

            customer_id:
              value,

            plant_id:
              "",

            machine_id:
              "",

          })
        );


        await fetchPlantsForCustomer(
          value
        );


        return;

      }


      // --------------------------------------------------------
      // PLANT
      // --------------------------------------------------------

      if (
        name ===
        "plant_id"
      ) {

        setFormData(
          previous => ({

            ...previous,

            plant_id:
              value,

            machine_id:
              "",

          })
        );


        filterMachinesForPlant(
          value
        );


        return;

      }


      // --------------------------------------------------------
      // DEPARTMENT
      // --------------------------------------------------------

      if (
        name ===
        "department_id"
      ) {

        setFormData(
          previous => ({

            ...previous,

            department_id:
              value,

            sub_department_id:
              "",

          })
        );


        setSubDepartments([]);

        await fetchSubDepartments(
          value
        );


        return;

      }


      // --------------------------------------------------------
      // NORMAL FIELD
      // --------------------------------------------------------

      setFormData(
        previous => ({

          ...previous,

          [name]:
            value,

        })
      );

    };


  // ============================================================
  // CREATE TICKET
  // ============================================================

  const handleCreate =
    async (
      event
    ) => {

      event.preventDefault();


      setError("");


      // --------------------------------------------------------
      // PERMISSION
      // --------------------------------------------------------

      if (
        !hasPermission(
          "create_ticket"
        )
      ) {

        setError(
          "You do not have permission to create tickets."
        );

        return;

      }


      // --------------------------------------------------------
      // REQUIRED LOCATION
      // --------------------------------------------------------

      if (
        !formData.customer_id ||
        !formData.plant_id ||
        !formData.machine_id
      ) {

        setError(
          "Customer, plant and machine are required."
        );

        return;

      }


      // --------------------------------------------------------
      // DEPARTMENT
      // --------------------------------------------------------

      if (
        !formData.department_id ||
        !formData.sub_department_id
      ) {

        setError(
          "Department and sub-department are required."
        );

        return;

      }


      // --------------------------------------------------------
      // CREATED BY
      //
      // Always use the current logged-in user's ID.
      // --------------------------------------------------------

      const createdById =
        currentUser?.id;


      if (!createdById) {

        setError(
          "Unable to determine the current user. Please refresh the page and try again."
        );

        return;

      }


      // --------------------------------------------------------
      // TITLE
      // --------------------------------------------------------

      if (
        !formData.title.trim()
      ) {

        setError(
          "Title is required."
        );

        return;

      }


      // --------------------------------------------------------
      // DESCRIPTION
      // --------------------------------------------------------

      if (
        !formData.description.trim()
      ) {

        setError(
          "Description is required."
        );

        return;

      }


      // --------------------------------------------------------
      // TICKET NUMBER
      // --------------------------------------------------------

      if (
        !formData.ticket_number.trim()
      ) {

        setError(
          "Ticket number is required."
        );

        return;

      }


      // --------------------------------------------------------
      // PAYLOAD
      // --------------------------------------------------------

      const payload = {

        ticket_number:
          formData.ticket_number.trim(),

        customer_id:
          Number(
            formData.customer_id
          ),

        plant_id:
          Number(
            formData.plant_id
          ),

        machine_id:
          Number(
            formData.machine_id
          ),

        department_id:
          Number(
            formData.department_id
          ),

        sub_department_id:
          Number(
            formData.sub_department_id
          ),

        created_by_id:
          Number(
            createdById
          ),

        assigned_to_id:
          formData.assigned_to_id
            ? Number(
                formData.assigned_to_id
              )
            : null,

        title:
          formData.title.trim(),

        description:
          formData.description.trim(),

        priority:
          formData.priority,

        status:
          "OPEN",

      };


      try {

        setSaving(true);


        const created =
          await fetchJson(
            `${API_URL}/tickets/`,
            {

              method:
                "POST",

              headers: {

                "Content-Type":
                  "application/json",

              },

              body:
                JSON.stringify(
                  payload
                ),

            }
          );


        // ------------------------------------------------------
        // SUCCESS
        // ------------------------------------------------------

        if (
          created?.id
        ) {

          navigate(
            `/tickets/${created.id}`,
            {
              replace: true,
            }
          );

        } else {

          navigate(
            "/tickets",
            {
              replace: true,
            }
          );

        }

      } catch (error) {

        console.error(
          "Failed to create ticket:",
          error
        );


        setError(
          error.message
        );

      } finally {

        setSaving(false);

      }

    };


  // ============================================================
  // BACK TO TICKETS
  // ============================================================

  const handleBack =
    () => {

      if (saving) {
        return;
      }


      navigate(
        "/tickets"
      );

    };


  // ============================================================
  // AUTH
  // ============================================================

  if (!isAuthenticated) {

    return (

      <div className="page-container">

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
  // PERMISSION
  // ============================================================

  if (
    !hasPermission(
      "create_ticket"
    )
  ) {

    return (

      <div className="page-container">

        <div className="empty-state">

          <strong>
            Access denied
          </strong>

          <p>
            You do not have permission
            to create tickets.
          </p>


          <button
            type="button"
            className="secondary-button"
            onClick={
              handleBack
            }
          >
            ← Back to Tickets
          </button>

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

          Loading ticket creation form...

        </div>

      </div>

    );

  }


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <div className="page-container ticket-form-page">


      <style>{`
        .ticket-form-page {
          max-width: 1180px;
          margin: 0 auto;
          padding-bottom: 48px;
        }

        .ticket-form-page .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 20px;
          padding: 24px 26px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 0 8px 24px rgba(15, 23, 42, .06);
        }

        .ticket-form-page .ticket-details-heading {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ticket-form-page .ticket-summary-icon {
          width: 48px;
          height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #172033;
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: .06em;
          box-shadow: 0 8px 18px rgba(15, 23, 42, .16);
        }

        .ticket-form-page .ticket-summary-label {
          display: block;
          margin-bottom: 4px;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .09em;
          text-transform: uppercase;
        }

        .ticket-form-page .page-header h2 {
          margin: 0;
          color: #0f172a;
          font-size: 25px;
          line-height: 1.15;
        }

        .ticket-form-page .page-header > div:first-child > p {
          margin: 9px 0 0 62px;
          max-width: 720px;
          color: #475569;
          font-size: 14px;
          line-height: 1.55;
        }

        .ticket-form-page .section-card {
          margin-bottom: 20px;
          padding: 22px;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 6px 20px rgba(15, 23, 42, .045);
        }

        .ticket-form-page .section-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eef2f7;
        }

        .ticket-form-page .section-card-header h3 {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
        }

        .ticket-form-page .section-card-header p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.55;
        }

        .ticket-form-page .form-grid,
        .ticket-form-page .ticket-info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .ticket-form-page .form-group {
          min-width: 0;
        }

        .ticket-form-page .full-width {
          grid-column: 1 / -1;
        }

        .ticket-form-page .form-group label {
          display: block;
          margin-bottom: 7px;
          color: #334155;
          font-size: 12px;
          font-weight: 800;
        }

        .ticket-form-page .form-group small {
          display: block;
          margin-top: 6px;
          color: #64748b;
          font-size: 11px;
          line-height: 1.45;
        }

        .ticket-form-page input,
        .ticket-form-page select,
        .ticket-form-page textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #dbe3ec;
          border-radius: 10px;
          background: #fff;
          color: #1e293b;
          font: inherit;
          transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
        }

        .ticket-form-page input,
        .ticket-form-page select {
          min-height: 42px;
          padding: 9px 12px;
        }

        .ticket-form-page textarea {
          min-height: 150px;
          padding: 12px 13px;
          line-height: 1.6;
          resize: vertical;
        }

        .ticket-form-page input:focus,
        .ticket-form-page select:focus,
        .ticket-form-page textarea:focus {
          outline: none;
          border-color: #94a3b8;
          box-shadow: 0 0 0 3px rgba(148, 163, 184, .18);
        }

        .ticket-form-page input:disabled,
        .ticket-form-page select:disabled,
        .ticket-form-page textarea:disabled {
          background: #f8fafc;
          color: #64748b;
          cursor: not-allowed;
        }

        .ticket-form-page .info-box {
          min-width: 0;
          padding: 13px 14px;
          border: 1px solid #edf2f7;
          border-radius: 12px;
          background: #f8fafc;
        }

        .ticket-form-page .info-box > span {
          display: block;
          margin-bottom: 5px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .07em;
          text-transform: uppercase;
        }

        .ticket-form-page .info-box strong {
          display: block;
          color: #1e293b;
          font-size: 13px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .ticket-form-page .ticket-overview-card {
          display: grid;
          grid-template-columns: minmax(220px, .75fr) minmax(0, 1.5fr);
          gap: 20px;
          margin-bottom: 20px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 6px 20px rgba(15, 23, 42, .045);
        }

        .ticket-form-page .ticket-overview-status {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 9px;
          padding-right: 20px;
          border-right: 1px solid #e2e8f0;
        }

        .ticket-form-page .ticket-overview-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ticket-form-page .ticket-status,
        .ticket-form-page .ticket-priority {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 6px 11px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .04em;
        }

        .ticket-form-page .ticket-overview-meta {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          align-items: center;
        }

        .ticket-form-page .ticket-overview-meta > div {
          padding: 11px 13px;
          border: 1px solid #edf2f7;
          border-radius: 12px;
          background: #f8fafc;
        }

        .ticket-form-page .ticket-overview-meta span {
          display: block;
          margin-bottom: 5px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .07em;
          text-transform: uppercase;
        }

        .ticket-form-page .ticket-overview-meta strong {
          display: block;
          color: #1e293b;
          font-size: 13px;
          line-height: 1.45;
        }

        .ticket-form-page .resolution-panel {
          padding: 16px;
          border: 1px solid #e8eef5;
          border-radius: 13px;
          background: #f8fafc;
        }

        .ticket-form-page .workflow-note {
          margin-top: 12px;
          padding: 13px 15px;
          border: 1px solid #dbeafe;
          border-radius: 11px;
          background: #eff6ff;
        }

        .ticket-form-page .workflow-note strong {
          color: #1e40af;
          font-size: 12px;
        }

        .ticket-form-page .workflow-note p {
          margin: 4px 0 0;
          color: #475569;
          font-size: 12px;
          line-height: 1.5;
        }

        .ticket-form-page .ticket-spare-part-form {
          margin-bottom: 18px;
          padding: 17px;
          border: 1px solid #e2e8f0;
          border-radius: 13px;
          background: #f8fafc;
        }

        .ticket-form-page .form-actions,
        .ticket-form-page .edit-page-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 14px;
        }

        .ticket-form-page .primary-button,
        .ticket-form-page .secondary-button {
          min-height: 40px;
          border-radius: 10px;
          padding: 9px 15px;
          font-weight: 750;
          transition: transform .15s ease, box-shadow .15s ease;
        }

        .ticket-form-page .primary-button:hover:not(:disabled),
        .ticket-form-page .secondary-button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .ticket-form-page .error-message {
          margin-bottom: 18px;
          border-radius: 12px;
        }

        .ticket-form-page .empty-state,
        .ticket-form-page .loading-state {
          border-radius: 12px;
          background: #f8fafc;
        }

        .ticket-form-page .table-container {
          border: 1px solid #e5eaf0;
          border-radius: 12px;
          overflow-x: auto;
          background: #fff;
        }

        .ticket-form-page .data-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .ticket-form-page .data-table th {
          background: #f8fafc;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .07em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .ticket-form-page .data-table th,
        .ticket-form-page .data-table td {
          padding: 13px 14px;
          border-bottom: 1px solid #edf2f7;
          vertical-align: top;
          text-align: left;
        }

        .ticket-form-page .data-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .ticket-form-page .data-table tbody tr:hover {
          background: #fbfdff;
        }

        .ticket-form-page .table-secondary-text {
          margin-top: 4px;
          color: #64748b;
          font-size: 11px;
        }

        @media (max-width: 900px) {
          .ticket-form-page .ticket-overview-card {
            grid-template-columns: 1fr;
          }

          .ticket-form-page .ticket-overview-status {
            padding-right: 0;
            padding-bottom: 15px;
            border-right: 0;
            border-bottom: 1px solid #e2e8f0;
          }

          .ticket-form-page .ticket-overview-meta {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .ticket-form-page .page-header {
            flex-direction: column;
            align-items: stretch;
          }

          .ticket-form-page .page-header > div:first-child > p {
            margin-left: 0;
          }

          .ticket-form-page .form-grid,
          .ticket-form-page .ticket-info-grid,
          .ticket-form-page .ticket-overview-meta {
            grid-template-columns: 1fr;
          }

          .ticket-form-page .section-card {
            padding: 16px;
          }

          .ticket-form-page .form-actions,
          .ticket-form-page .edit-page-actions {
            justify-content: stretch;
          }

          .ticket-form-page .form-actions > *,
          .ticket-form-page .edit-page-actions > * {
            flex: 1;
          }
        }
      `}</style>

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="page-header">

        <div>

          <div className="ticket-details-heading">

            <span className="ticket-summary-icon">
              ST
            </span>

            <div>

              <span className="ticket-summary-label">
                Service Tickets
              </span>

              <h2>
                Create Ticket
              </h2>

            </div>

          </div>

          <p>
            Create a new service ticket
            and assign it to an engineer.
          </p>

        </div>


        <button
          type="button"
          className="secondary-button"
          onClick={
            handleBack
          }
          disabled={
            saving
          }
        >
          ← Back to Tickets
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
          TICKET LOCATION
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              Ticket Location
            </h3>

            <p>
              Select the customer,
              plant and machine.
            </p>

          </div>

        </div>


        <div className="form-grid">


          {/* TICKET NUMBER */}

          <div className="form-group">

            <label>
              Ticket Number *
            </label>

            <input
              name="ticket_number"
              value={
                formData.ticket_number
              }
              onChange={
                handleChange
              }
              placeholder="e.g. TKT-2026-000003"
              required
            />

          </div>


          {/* CUSTOMER */}

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

          </div>


          {/* PLANT */}

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
                    ? "No Active Plants"
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

          </div>


          {/* MACHINE */}

          <div className="form-group">

            <label>
              Machine *
            </label>

            <select
              name="machine_id"
              value={
                formData.machine_id
              }
              onChange={
                handleChange
              }
              disabled={
                !formData.plant_id
              }
              required
            >

              <option value="">

                {!formData.plant_id
                  ? "Select Plant First"
                  : formMachines.length === 0
                    ? "No Active Machines"
                    : "Select Machine"}

              </option>


              {formMachines.map(
                machine => (

                  <option
                    key={
                      machine.id
                    }
                    value={
                      machine.id
                    }
                  >

                    {
                      machine.machine_code
                    }

                    {" - "}

                    {
                      machine.name
                    }

                  </option>

                )
              )}

            </select>

          </div>

        </div>

      </section>


      {/* ======================================================
          DEPARTMENT OWNERSHIP
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              Department Ownership
            </h3>

            <p>
              Select the department responsible
              for this service ticket.
            </p>

          </div>

        </div>


        <div className="form-grid">


          {/* DEPARTMENT */}

          <div className="form-group">

            <label>
              Department *
            </label>

            <select
              name="department_id"
              value={
                formData.department_id
              }
              onChange={
                handleChange
              }
              required
            >

              <option value="">
                Select Department
              </option>


              {departments.map(
                department => (

                  <option
                    key={
                      department.id
                    }
                    value={
                      department.id
                    }
                  >

                    {
                      department.name
                    }

                  </option>

                )
              )}

            </select>

          </div>


          {/* SUB-DEPARTMENT */}

          <div className="form-group">

            <label>
              Sub-Department *
            </label>

            <select
              name="sub_department_id"
              value={
                formData.sub_department_id
              }
              onChange={
                handleChange
              }
              disabled={
                !formData.department_id
              }
              required
            >

              <option value="">

                {!formData.department_id
                  ? "Select Department First"
                  : subDepartments.length === 0
                    ? "No Active Sub-Departments"
                    : "Select Sub-Department"}

              </option>


              {subDepartments.map(
                subDepartment => (

                  <option
                    key={
                      subDepartment.id
                    }
                    value={
                      subDepartment.id
                    }
                  >

                    {
                      subDepartment.name
                    }

                  </option>

                )
              )}

            </select>

          </div>

        </div>

      </section>


      {/* ======================================================
          TICKET INFORMATION
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              Ticket Information
            </h3>

            <p>
              Enter the service issue
              and ticket details.
            </p>

          </div>

        </div>


        <div className="form-grid">


          {/* CREATED BY */}

          <div className="form-group">

            <label>
              Created By *
            </label>

            <input
              value={
                currentUser
                  ? `${currentUser.employee_code} - ${currentUser.first_name} ${currentUser.last_name}`
                  : "Loading current user..."
              }
              disabled
            />

          </div>


          {/* ASSIGNED ENGINEER */}

          <div className="form-group">

            <label>
              Assigned Engineer
            </label>

            <select
              name="assigned_to_id"
              value={
                formData.assigned_to_id
              }
              onChange={
                handleChange
              }
              disabled={
                !hasPermission(
                  "assign_engineer"
                )
              }
            >

              <option value="">
                Unassigned
              </option>


              {engineers.map(
                engineer => (

                  <option
                    key={
                      engineer.id
                    }
                    value={
                      engineer.id
                    }
                  >

                    {
                      engineer.employee_code
                    }

                    {" - "}

                    {
                      engineer.first_name
                    }

                    {" "}

                    {
                      engineer.last_name
                    }

                  </option>

                )
              )}

            </select>


            {!hasPermission(
              "assign_engineer"
            ) && (

              <small>
                You do not have permission
                to assign engineers.
              </small>

            )}

          </div>


          {/* TITLE */}

          <div className="form-group full-width">

            <label>
              Title *
            </label>

            <input
              name="title"
              value={
                formData.title
              }
              onChange={
                handleChange
              }
              placeholder="e.g. Machine stopped unexpectedly"
              required
            />

          </div>


          {/* PRIORITY */}

          <div className="form-group">

            <label>
              Priority
            </label>

            <select
              name="priority"
              value={
                formData.priority
              }
              onChange={
                handleChange
              }
            >

              <option value="LOW">
                LOW
              </option>

              <option value="MEDIUM">
                MEDIUM
              </option>

              <option value="HIGH">
                HIGH
              </option>

              <option value="CRITICAL">
                CRITICAL
              </option>

            </select>

          </div>


          {/* DESCRIPTION */}

          <div className="form-group full-width">

            <label>
              Description *
            </label>

            <textarea
              name="description"
              value={
                formData.description
              }
              onChange={
                handleChange
              }
              rows="7"
              placeholder="Describe the issue, symptoms and relevant details..."
              required
            />

          </div>

        </div>

      </section>


      {/* ======================================================
          ACTIONS
      ======================================================= */}

      <div className="form-actions">

        <button
          type="button"
          className="secondary-button"
          onClick={
            handleBack
          }
          disabled={
            saving
          }
        >
          Cancel
        </button>


        <button
          type="button"
          className="primary-button"
          onClick={
            handleCreate
          }
          disabled={
            saving
          }
        >

          {saving
            ? "Creating..."
            : "Create Ticket"}

        </button>

      </div>


    </div>

  );

}


export default TicketCreate;



