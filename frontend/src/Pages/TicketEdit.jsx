import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_URL } from "../config";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useAuth,
} from "../auth/AuthContext";




const MATERIAL_CONSUMPTION_STATUSES = [
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSE_REQUESTED",
];


function TicketEdit() {

  const { ticketId } =
    useParams();

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

  const [ticket, setTicket] =
    useState(null);

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

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  const [formData, setFormData] =
    useState({

      department_id: "",

      sub_department_id: "",

      title: "",

      description: "",

      priority: "MEDIUM",

      status: "OPEN",

      assigned_to_id: "",

      resolution: "",

    });


  // ============================================================
  // SPARE PARTS STATE
  // ============================================================

  const [sparePartsUsed, setSparePartsUsed] =
    useState([]);

  const [sparePartsLoading, setSparePartsLoading] =
    useState(true);

  const [catalogParts, setCatalogParts] =
    useState([]);

  const [sparePartFormOpen, setSparePartFormOpen] =
    useState(false);

  const [sparePartSaving, setSparePartSaving] =
    useState(false);

  const [sparePartError, setSparePartError] =
    useState("");

  const [sparePartForm, setSparePartForm] =
    useState({

      spare_part_id: "",

      location: "",

      quantity: "",

      notes: "",

    });


  // ============================================================
  // ROLE
  // ============================================================

  const roleName =
    currentUser?.role?.name ||
    currentUser?.role?.role_name ||
    currentUser?.role_name ||
    currentUser?.role ||
    "";

  const isServiceManager =
    String(roleName)
      .toLowerCase()
      .trim() ===
    "service manager";


  // ============================================================
  // API
  // ============================================================

  const fetchJson =
    async (
      url,
      options = {}
    ) => {

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

          if (data?.detail) {

            message =
              data.detail;

          }

        } catch {
          // Ignore parsing errors.
        }


        throw new Error(
          message
        );

      }


      return response.status === 204
        ? null
        : await response.json();

    };


  // ============================================================
  // LOAD TICKET
  // ============================================================

  const fetchTicket =
    async () => {

      const data =
        await fetchJson(
          `${API_URL}/tickets/${ticketId}`
        );


      setTicket(data);


      setFormData({

        department_id:
          data.department_id
            ? String(
                data.department_id
              )
            : "",

        sub_department_id:
          data.sub_department_id
            ? String(
                data.sub_department_id
              )
            : "",

        title:
          data.title ||
          "",

        description:
          data.description ||
          "",

        priority:
          data.priority ||
          "MEDIUM",

        status:
          data.status ||
          "OPEN",

        assigned_to_id:
          data.assigned_to_id
            ? String(
                data.assigned_to_id
              )
            : "",

        resolution:
          data.resolution ||
          "",

      });

    };


  // ============================================================
  // LOAD REFERENCE DATA
  // ============================================================

  const fetchReferenceData =
    async () => {

      const requests = [

        fetchJson(
          `${API_URL}/departments/`
        ),

        fetchJson(
          `${API_URL}/customers/`
        ),

        fetchJson(
          `${API_URL}/plants/`
        ),

        fetchJson(
          `${API_URL}/machines/`
        ),

      ];


      if (
        hasPermission(
          "assign_engineer"
        )
      ) {

        requests.push(
          fetchJson(
            `${API_URL}/tickets/assignable-engineers`
          )
        );

      }


      const results =
        await Promise.all(
          requests
        );


      setDepartments(
        results[0] || []
      );

      setCustomers(
        results[1] || []
      );

      setPlants(
        results[2] || []
      );

      setMachines(
        results[3] || []
      );

      setEngineers(
        results[4] || []
      );

    };


  // ============================================================
  // LOAD SUB-DEPARTMENTS
  // ============================================================

  const fetchSubDepartments =
    async departmentId => {

      if (!departmentId) {

        setSubDepartments([]);

        return;

      }


      try {

        const data =
          await fetchJson(
            `${API_URL}/sub-departments/?department_id=${departmentId}`
          );


        setSubDepartments(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (requestError) {

        console.error(
          requestError
        );

        setSubDepartments([]);

        setError(
          requestError.message
        );

      }

    };


  // ============================================================
  // LOAD SUB-DEPARTMENTS FOR CURRENT TICKET
  // ============================================================

  useEffect(() => {

    if (
      !accessToken ||
      !formData.department_id
    ) {

      setSubDepartments([]);

      return;

    }


    fetchSubDepartments(
      formData.department_id
    );

  }, [
    accessToken,
    formData.department_id,
  ]);


  // ============================================================
  // LOAD SPARE PARTS USED
  // ============================================================

  const fetchSparePartsUsed =
    async () => {

      setSparePartsLoading(true);

      try {

        const data =
          await fetchJson(
            `${API_URL}/tickets/${ticketId}/spare-parts`
          );

        setSparePartsUsed(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (requestError) {

        console.error(
          requestError
        );

        setSparePartError(
          requestError.message
        );

      } finally {

        setSparePartsLoading(false);

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
            fetchTicket(),
            fetchReferenceData(),
            fetchSparePartsUsed(),
          ]);

        } catch (error) {

          console.error(error);

          setError(
            error.message
          );

        } finally {

          setLoading(false);

        }

      };


    load();

  }, [
    ticketId,
    accessToken,
    isAuthenticated,
  ]);


  // ============================================================
  // RELATED RECORDS
  // ============================================================

  const customer =
    useMemo(
      () =>
        customers.find(
          item =>
            Number(
              item.id
            ) ===
            Number(
              ticket?.customer_id
            )
        ),
      [
        customers,
        ticket,
      ]
    );


  const plant =
    useMemo(
      () =>
        plants.find(
          item =>
            Number(
              item.id
            ) ===
            Number(
              ticket?.plant_id
            )
        ),
      [
        plants,
        ticket,
      ]
    );


  const machine =
    useMemo(
      () =>
        machines.find(
          item =>
            Number(
              item.id
            ) ===
            Number(
              ticket?.machine_id
            )
        ),
      [
        machines,
        ticket,
      ]
    );


  // ============================================================
  // CHANGE
  // ============================================================

  const handleChange =
    event => {

      const {
        name,
        value,
      } = event.target;


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

        return;

      }


      setFormData(
        previous => ({

          ...previous,

          [name]:
            value,

        })
      );

    };


  // ============================================================
  // SPARE PART FORM CHANGE
  // ============================================================

  const handleSparePartChange =
    event => {

      const {
        name,
        value,
      } = event.target;


      setSparePartForm(
        previous => ({

          ...previous,

          [name]:
            value,

        })
      );

    };


  // ============================================================
  // OPEN SPARE PART FORM
  // ============================================================

  const openSparePartForm =
    async () => {

      setSparePartError("");

      try {

        const data =
          await fetchJson(
            `${API_URL}/spare-parts/`
          );

        setCatalogParts(
          Array.isArray(data)
            ? data
            : []
        );

        setSparePartFormOpen(
          true
        );

      } catch (requestError) {

        setSparePartError(
          requestError.message
        );

      }

    };


  // ============================================================
  // CANCEL SPARE PART FORM
  // ============================================================

  const cancelSparePartForm =
    () => {

      setSparePartFormOpen(false);

      setSparePartError("");

      setSparePartForm({

        spare_part_id: "",

        location: "",

        quantity: "",

        notes: "",

      });

    };


  // ============================================================
  // CONSUME SPARE PART
  // ============================================================

  const submitSparePart =
    async event => {

      event.preventDefault();


      const quantity =
        Number(
          sparePartForm.quantity
        );


      if (
        !sparePartForm.spare_part_id ||
        !sparePartForm.location.trim() ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {

        setSparePartError(
          "Select a spare part, enter a location, and use a positive whole quantity."
        );

        return;

      }


      if (
        !hasPermission(
          "consume_ticket_spare"
        )
      ) {

        setSparePartError(
          "You do not have permission to consume spare parts on tickets."
        );

        return;

      }


      if (
        !MATERIAL_CONSUMPTION_STATUSES.includes(
          ticket.status
        )
      ) {

        setSparePartError(
          "This ticket status does not allow spare-part consumption."
        );

        return;

      }


      try {

        setSparePartSaving(true);
        setSparePartError("");


        await fetchJson(
          `${API_URL}/tickets/${ticket.id}/spare-parts`,
          {
            method:
              "POST",

            body:
              JSON.stringify({

                spare_part_id:
                  Number(
                    sparePartForm.spare_part_id
                  ),

                location:
                  sparePartForm.location.trim(),

                quantity,

                notes:
                  sparePartForm.notes.trim() ||
                  null,

              }),

          }
        );


        setSparePartForm({

          spare_part_id: "",

          location: "",

          quantity: "",

          notes: "",

        });


        setSparePartFormOpen(
          false
        );


        await fetchSparePartsUsed();

      } catch (requestError) {

        console.error(
          requestError
        );

        setSparePartError(
          requestError.message
        );

      } finally {

        setSparePartSaving(false);

      }

    };


  // ============================================================
  // SAVE TICKET
  // ============================================================

  const handleSubmit =
    async event => {

      event.preventDefault();


      if (!ticket) {
        return;
      }


      if (
        !hasPermission(
          "update_ticket"
        )
      ) {

        setError(
          "You do not have permission to edit tickets."
        );

        return;

      }


      if (
        !formData.title.trim()
      ) {

        setError(
          "Title is required."
        );

        return;

      }


      if (
        !formData.description.trim()
      ) {

        setError(
          "Description is required."
        );

        return;

      }


      if (
        formData.status ===
        "CLOSE_REQUESTED"
      ) {

        setError(
          "A ticket awaiting manager review cannot be edited into another closure request."
        );

        return;

      }


      const ownershipChanged =
        Number(
          formData.department_id
        ) !==
          Number(
            ticket.department_id
          ) ||
        Number(
          formData.sub_department_id
        ) !==
          Number(
            ticket.sub_department_id
          );


      if (
        ownershipChanged &&
        (
          !formData.department_id ||
          !formData.sub_department_id
        )
      ) {

        setError(
          "Department and Sub Department are required."
        );

        return;

      }


      const payload = {

        title:
          formData.title.trim(),

        description:
          formData.description.trim(),

        priority:
          formData.priority,

        status:
          formData.status,

      };


      if (
        ownershipChanged
      ) {

        if (
          !hasPermission(
            "update_ticket"
          )
        ) {

          setError(
            "You do not have permission to change ticket ownership."
          );

          return;

        }


        payload.department_id =
          Number(
            formData.department_id
          );

        payload.sub_department_id =
          Number(
            formData.sub_department_id
          );

      }


      if (
        hasPermission(
          "assign_engineer"
        )
      ) {

        payload.assigned_to_id =
          formData.assigned_to_id
            ? Number(
                formData.assigned_to_id
              )
            : null;

      }


      const canEditResolution =
        hasPermission(
          "resolve_ticket"
        ) &&
        (
          isServiceManager ||
          ![
            "CLOSED",
            "CLOSE_REQUESTED",
          ].includes(
            ticket.status
          )
        );


      if (
        canEditResolution
      ) {

        const resolutionValue =
          formData.resolution.trim();


        payload.resolution =
          resolutionValue ||
          null;

      }


      try {

        setSaving(true);
        setError("");


        await fetchJson(
          `${API_URL}/tickets/${ticket.id}`,
          {
            method:
              "PATCH",

            body:
              JSON.stringify(
                payload
              ),
          }
        );


        navigate(
          `/tickets/${ticket.id}`,
          {
            replace: true,
          }
        );

      } catch (error) {

        console.error(error);

        setError(
          error.message
        );

      } finally {

        setSaving(false);

      }

    };


  // ============================================================
  // PERMISSIONS
  // ============================================================

  const resolutionEditable =
    hasPermission(
      "resolve_ticket"
    ) &&
    (
      isServiceManager ||
      ![
        "CLOSED",
        "CLOSE_REQUESTED",
      ].includes(
        ticket?.status
      )
    );


  const assignmentEditable =
    hasPermission(
      "assign_engineer"
    );


  const canConsumeSparePart =
    hasPermission(
      "consume_ticket_spare"
    ) &&
    MATERIAL_CONSUMPTION_STATUSES.includes(
      ticket?.status
    );


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
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <div className="page-container">

        <div className="loading-state">
          Loading ticket...
        </div>

      </div>

    );

  }


  // ============================================================
  // NOT FOUND
  // ============================================================

  if (!ticket) {

    return (

      <div className="page-container">

        {error && (

          <div className="error-message">
            {error}
          </div>

        )}


        <Link
          to="/tickets"
          className="secondary-button"
        >
          ← Back to Tickets
        </Link>

      </div>

    );

  }


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
                Editing Service Ticket
              </span>

              <h2>
                {ticket.ticket_number}
              </h2>

            </div>

          </div>

          <p>
            Update ticket information and workflow details.
          </p>

        </div>


        <div className="action-buttons">

          <Link
            to={`/tickets/${ticket.id}`}
            className="secondary-button"
          >
            ← Back to Ticket
          </Link>

        </div>

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
          CURRENT STATUS
      ======================================================= */}

      <section className="ticket-overview-card">

        <div className="ticket-overview-status">

          <span className="ticket-summary-label">
            Current Status
          </span>

          <div className="ticket-overview-badges">

            <span
              className={
                `ticket-status status-${String(
                  ticket.status
                )
                  .toLowerCase()
                  .replaceAll(
                    "_",
                    "-"
                  )}`
              }
            >
              {ticket.status}
            </span>


            <span
              className={
                `ticket-priority priority-${String(
                  ticket.priority
                ).toLowerCase()}`
              }
            >
              {ticket.priority}
            </span>

          </div>

        </div>


        <div className="ticket-overview-meta">

          <div>

            <span>
              Customer
            </span>

            <strong>
              {customer
                ? customer.name
                : `Customer #${ticket.customer_id}`}
            </strong>

          </div>


          <div>

            <span>
              Plant
            </span>

            <strong>
              {plant
                ? plant.name
                : `Plant #${ticket.plant_id}`}
            </strong>

          </div>


          <div>

            <span>
              Machine
            </span>

            <strong>
              {machine
                ? machine.name
                : `Machine #${ticket.machine_id}`}
            </strong>

          </div>

        </div>

      </section>


      {/* ======================================================
          TICKET FORM
      ======================================================= */}

      <form
        onSubmit={
          handleSubmit
        }
      >

        {/* ====================================================
            TICKET INFORMATION
        ===================================================== */}

        <section className="section-card">

          <div className="section-card-header">

            <div>

              <h3>
                Ticket Information
              </h3>

              <p>
                Core ticket details and service location.
              </p>

            </div>

          </div>


          <div className="ticket-info-grid">


            <div className="info-box">

              <span>
                Ticket Number
              </span>

              <strong>
                {ticket.ticket_number}
              </strong>

            </div>


            <div className="info-box">

              <span>
                Customer
              </span>

              <strong>
                {customer
                  ? `${customer.customer_code} - ${customer.name}`
                  : `Customer #${ticket.customer_id}`}
              </strong>

            </div>


            <div className="info-box">

              <span>
                Plant
              </span>

              <strong>
                {plant
                  ? `${plant.plant_code} - ${plant.name}`
                  : `Plant #${ticket.plant_id}`}
              </strong>

            </div>


            <div className="info-box">

              <span>
                Machine
              </span>

              <strong>
                {machine
                  ? `${machine.machine_code} - ${machine.name}`
                  : `Machine #${ticket.machine_id}`}
              </strong>

            </div>


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
                disabled={
                  !hasPermission(
                    "update_ticket"
                  )
                }
                required={
                  Boolean(
                    ticket.department_id ||
                    formData.department_id
                  )
                }
              >

                <option value="">
                  Select Department
                </option>


                {departments
                  .filter(
                    department =>
                      department.is_active !== false
                  )
                  .map(
                    department => (

                      <option
                        key={
                          department.id
                        }
                        value={
                          department.id
                        }
                      >
                        {department.name}
                      </option>

                    )
                  )}

              </select>


              {!hasPermission(
                "update_ticket"
              ) && (

                <small>
                  You do not have permission to change ticket ownership.
                </small>

              )}

            </div>


            <div className="form-group">

              <label>
                Sub Department *
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
                  !formData.department_id ||
                  !hasPermission(
                    "update_ticket"
                  )
                }
                required={
                  Boolean(
                    formData.department_id
                  )
                }
              >

                <option value="">
                  {
                    formData.department_id
                      ? "Select Sub Department"
                      : "Select Department First"
                  }
                </option>


                {subDepartments
                  .filter(
                    subDepartment =>
                      subDepartment.is_active !== false
                  )
                  .map(
                    subDepartment => (

                      <option
                        key={
                          subDepartment.id
                        }
                        value={
                          subDepartment.id
                        }
                      >
                        {subDepartment.name}
                      </option>

                    )
                  )}

              </select>

            </div>


            <div className="info-box">

              <span>
                Created By
              </span>

              <strong>
                {ticket.created_by
                  ? `${ticket.created_by.employee_code} - ${ticket.created_by.first_name} ${ticket.created_by.last_name}`
                  : `User #${ticket.created_by_id}`}
              </strong>

            </div>


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
                  !assignmentEditable
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


              {!assignmentEditable && (

                <small>
                  You do not have permission to change
                  the assigned engineer.
                </small>

              )}

            </div>


          </div>

        </section>


        {/* ====================================================
            EDITABLE DETAILS
        ===================================================== */}

        <section className="section-card">

          <div className="section-card-header">

            <div>

              <h3>
                Service Details
              </h3>

              <p>
                Update the ticket description, priority and status.
              </p>

            </div>

          </div>


          <div className="form-grid">


            <div className="form-group full-width">

              <label>
                Title *
              </label>

              <input
                type="text"
                name="title"
                value={
                  formData.title
                }
                onChange={
                  handleChange
                }
                required
              />

            </div>


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


            <div className="form-group">

              <label>
                Status
              </label>

              <select
                name="status"
                value={
                  formData.status
                }
                onChange={
                  handleChange
                }
              >

                <option value="OPEN">
                  OPEN
                </option>

                <option value="IN_PROGRESS">
                  IN PROGRESS
                </option>

                <option value="RESOLVED">
                  RESOLVED
                </option>

                <option value="CANCELLED">
                  CANCELLED
                </option>


                {ticket.status ===
                  "CLOSE_REQUESTED" && (

                  <option value="CLOSE_REQUESTED">
                    CLOSE REQUESTED
                  </option>

                )}


                {ticket.status ===
                  "CLOSED" && (

                  <option value="CLOSED">
                    CLOSED
                  </option>

                )}

              </select>

            </div>


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
                rows="8"
                required
              />

            </div>

          </div>

        </section>


        {/* ====================================================
            RESOLUTION
        ===================================================== */}

        <section className="section-card">

          <div className="section-card-header">

            <div>

              <h3>
                Resolution
              </h3>

              <p>
                Technical resolution and final service outcome.
              </p>

            </div>

          </div>


          <div className="resolution-panel">

            <textarea
              name="resolution"
              value={
                formData.resolution
              }
              onChange={
                handleChange
              }
              rows="8"
              disabled={
                !resolutionEditable
              }
              placeholder={
                resolutionEditable
                  ? "Enter the technical resolution..."
                  : "Resolution is locked during manager review."
              }
            />


            {!resolutionEditable && (

              <div className="workflow-note">

                <strong>
                  Resolution editing is locked
                </strong>

                <p>
                  {ticket.status ===
                    "CLOSE_REQUESTED"
                    ? "This ticket is currently awaiting manager review."
                    : "You do not have permission to edit the resolution."}
                </p>

              </div>

            )}

          </div>

        </section>


        {/* ====================================================
            ACTIONS
        ===================================================== */}

        <div className="edit-page-actions">

          <Link
            to={`/tickets/${ticket.id}`}
            className="secondary-button"
          >
            Cancel
          </Link>


          <button
            type="submit"
            className="primary-button"
            disabled={
              saving
            }
          >
            {saving
              ? "Saving Changes..."
              : "Save Changes"}
          </button>

        </div>

      </form>


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
              Material consumption recorded against this ticket.
              Existing consumption records cannot be edited or deleted.
            </p>

          </div>


          {canConsumeSparePart && (

            <button
              type="button"
              className="primary-button"
              onClick={
                openSparePartForm
              }
            >
              + Add Spare Part
            </button>

          )}

        </div>


        {sparePartError && (

          <div className="error-message">

            {sparePartError}

          </div>

        )}


        {!canConsumeSparePart &&
          MATERIAL_CONSUMPTION_STATUSES.includes(
            ticket.status
          ) &&
          !hasPermission(
            "consume_ticket_spare"
          ) && (

          <div className="workflow-note">

            <strong>
              Spare-part consumption unavailable
            </strong>

            <p>
              You do not have permission to consume spare parts
              on tickets.
            </p>

          </div>

        )}


        {!MATERIAL_CONSUMPTION_STATUSES.includes(
          ticket.status
        ) && (

          <div className="workflow-note">

            <strong>
              Spare-part consumption is unavailable
            </strong>

            <p>
              Spare parts can be consumed only while a ticket is
              ASSIGNED, IN PROGRESS, RESOLVED, or awaiting closure review.
            </p>

          </div>

        )}


        {sparePartFormOpen && (

          <form
            onSubmit={
              submitSparePart
            }
            className="ticket-spare-part-form"
          >

            <div className="form-grid">


              <div className="form-group">

                <label>
                  Spare Part *
                </label>

                <select
                  name="spare_part_id"
                  value={
                    sparePartForm.spare_part_id
                  }
                  onChange={
                    handleSparePartChange
                  }
                  required
                >

                  <option value="">
                    Select spare part
                  </option>


                  {catalogParts
                    .filter(
                      part =>
                        part.is_active !== false
                    )
                    .map(
                      part => (

                        <option
                          key={
                            part.id
                          }
                          value={
                            part.id
                          }
                        >

                          {part.part_code}
                          {" - "}
                          {part.name}

                        </option>

                      )
                    )}

                </select>

              </div>


              <div className="form-group">

                <label>
                  Source Location *
                </label>

                <input
                  type="text"
                  name="location"
                  value={
                    sparePartForm.location
                  }
                  onChange={
                    handleSparePartChange
                  }
                  placeholder="e.g. WAREHOUSE"
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Quantity *
                </label>

                <input
                  type="number"
                  name="quantity"
                  value={
                    sparePartForm.quantity
                  }
                  onChange={
                    handleSparePartChange
                  }
                  min="1"
                  step="1"
                  placeholder="1"
                  required
                />

              </div>


              <div className="form-group full-width">

                <label>
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={
                    sparePartForm.notes
                  }
                  onChange={
                    handleSparePartChange
                  }
                  rows="3"
                  placeholder="Optional consumption note..."
                />

              </div>


            </div>


            <div className="form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={
                  cancelSparePartForm
                }
                disabled={
                  sparePartSaving
                }
              >
                Cancel
              </button>


              <button
                type="submit"
                className="primary-button"
                disabled={
                  sparePartSaving
                }
              >
                {sparePartSaving
                  ? "Consuming..."
                  : "Consume Spare Part"}
              </button>

            </div>

          </form>

        )}


        {sparePartsLoading ? (

          <div className="loading-state">
            Loading spare parts...
          </div>

        ) : sparePartsUsed.length === 0 ? (

          <div className="empty-state">

            <strong>
              No spare parts used
            </strong>

            <p>
              Spare-part consumption recorded against this ticket
              will appear here.
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

                  <th>
                    Movement
                  </th>

                </tr>

              </thead>


              <tbody>

                {sparePartsUsed.map(
                  usage => (

                    <tr
                      key={
                        usage.id
                      }
                    >

                      <td>

                        <strong>
                          {usage.spare_part?.part_code ||
                            `Part #${usage.spare_part_id}`}
                        </strong>

                        <div className="table-secondary-text">
                          {usage.spare_part?.name ||
                            "Catalog item unavailable"}
                        </div>

                      </td>


                      <td>
                        {usage.quantity}
                        {" "}
                        {usage.spare_part?.unit || ""}
                      </td>


                      <td>
                        {usage.location}
                      </td>


                      <td>

                        {usage.created_by
                          ? `${usage.created_by.first_name || ""} ${usage.created_by.last_name || ""}`.trim()
                          : `User #${usage.created_by_id}`}

                      </td>


                      <td>

                        {usage.created_at
                          ? new Date(
                              usage.created_at
                            ).toLocaleString(
                              "en-IN"
                            )
                          : "—"}

                      </td>


                      <td>
                        {usage.notes || "—"}
                      </td>


                      <td>

                        {usage.stock_movement
                          ? `ISSUE #${usage.stock_movement.id}`
                          : "—"}

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
          MANAGER NOTE
      ======================================================= */}

      {isServiceManager &&
        ticket.status ===
          "CLOSED" && (

        <div className="workflow-note">

          <strong>
            Closed ticket under manager review
          </strong>

          <p>
            You can update the resolution or reopen the ticket
            from the ticket details page. Existing audit history
            is preserved.
          </p>

        </div>

      )}

    </div>

  );

}


export default TicketEdit;


