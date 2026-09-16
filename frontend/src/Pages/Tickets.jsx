import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_URL } from "../config";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  useAuth,
} from "../auth/AuthContext";




function Tickets() {

  const navigate =
    useNavigate();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const {
    accessToken,
    isAuthenticated,
    currentUser,
    hasPermission,
  } = useAuth();


  // ============================================================
  // STATE
  // ============================================================

  const [tickets, setTickets] =
    useState([]);

  const [totalTickets, setTotalTickets] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(0);

  const [assignedToYou, setAssignedToYou] =
    useState([]);

  const [customers, setCustomers] =
    useState([]);

  const [plants, setPlants] =
    useState([]);

  const [machines, setMachines] =
    useState([]);

  const [engineers, setEngineers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [actionLoadingId, setActionLoadingId] =
    useState(null);

  // Cascading choices for filter bar
  const [filterPlants, setFilterPlants] =
    useState([]);

  const [filterMachines, setFilterMachines] =
    useState([]);

  // Cascading choices for create form
  const [formPlants, setFormPlants] =
    useState([]);

  const [formMachines, setFormMachines] =
    useState([]);

  const [formData, setFormData] =
    useState({
      ticket_number: "",
      customer_id: "",
      plant_id: "",
      machine_id: "",
      created_by_id: "",
      assigned_to_id: "",
      title: "",
      description: "",
      priority: "MEDIUM",
      status: "OPEN",
    });


  // ============================================================
  // URL SEARCH PARAMS
  // ============================================================

  const customerIdFilter =
    searchParams.get("customer_id") || "";

  const plantIdFilter =
    searchParams.get("plant_id") || "";

  const machineIdFilter =
    searchParams.get("machine_id") || "";

  const statusFilter =
    searchParams.get("status") || "";

  const priorityFilter =
    searchParams.get("priority") || "";

  const assignedToFilter =
    searchParams.get("assigned_to") || "";

  const activeFilter =
    searchParams.get("active") || "";

  const agingFilter =
    searchParams.get("aging") || "";

  const currentPage =
    Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  const currentLimit =
    Math.max(1, parseInt(searchParams.get("limit") || "25", 10));


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
          if (data?.detail) {
            message =
              data.detail;
          }
        } catch {
          // Ignore JSON parsing errors.
        }

        throw new Error(
          message
        );
      }

      if (
        response.status === 204
      ) {
        return null;
      }

      return response.json();
    };


  // ============================================================
  // FETCH TICKETS (SERVER-SIDE FILTERED & PAGINATED)
  // ============================================================

  const fetchTickets =
    async () => {

      const params =
        new URLSearchParams();

      if (customerIdFilter) {
        params.set("customer_id", customerIdFilter);
      }

      if (plantIdFilter) {
        params.set("plant_id", plantIdFilter);
      }

      if (machineIdFilter) {
        params.set("machine_id", machineIdFilter);
      }

      if (statusFilter) {
        params.set("status", statusFilter);
      }

      if (priorityFilter) {
        params.set("priority", priorityFilter);
      }

      if (assignedToFilter) {
        params.set("assigned_to", assignedToFilter);
      }

      if (activeFilter) {
        params.set("active", activeFilter);
      }

      if (agingFilter) {
        params.set("aging", agingFilter);
      }

      params.set("page", String(currentPage));
      params.set("limit", String(currentLimit));

      const data =
        await fetchJson(
          `${API_URL}/tickets/?${params.toString()}`
        );

      if (data && Array.isArray(data.items)) {
        setTickets(data.items);
        setTotalTickets(data.total);
        setTotalPages(data.pages);
      } else if (Array.isArray(data)) {
        setTickets(data);
        setTotalTickets(data.length);
        setTotalPages(1);
      } else {
        setTickets([]);
        setTotalTickets(0);
        setTotalPages(0);
      }

    };


  // ============================================================
  // FETCH ASSIGNED TICKETS FOR CURRENT USER
  // ============================================================

  const fetchAssignedToYou =
    async () => {

      if (!currentUser?.id) {
        setAssignedToYou([]);
        return;
      }

      try {
        const data =
          await fetchJson(
            `${API_URL}/tickets/?assigned_to=me&active=true&limit=10`
          );

        if (data && Array.isArray(data.items)) {
          setAssignedToYou(data.items);
        } else if (Array.isArray(data)) {
          setAssignedToYou(
            data.filter(
              ticket =>
                Number(ticket.assigned_to_id) === Number(currentUser.id)
            )
          );
        }
      } catch (err) {
        console.error("Failed to load assigned tickets:", err);
        setAssignedToYou([]);
      }

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
        setEngineers([]);
      }

    };


  // ============================================================
  // CASCADING PLANTS FOR FILTER TOOLBAR
  // ============================================================

  useEffect(() => {

    if (!customerIdFilter) {
      setFilterPlants([]);
      setFilterMachines([]);
      return;
    }

    const loadFilterPlants =
      async () => {

        try {
          const data =
            await fetchJson(
              `${API_URL}/plants/?customer_id=${customerIdFilter}`
            );

          setFilterPlants(
            (data || []).filter(
              plant => plant.is_active
            )
          );
        } catch (error) {
          console.error("Failed to load filter plants:", error);
          setFilterPlants([]);
        }

      };

    if (isAuthenticated && accessToken) {
      loadFilterPlants();
    }

  }, [
    customerIdFilter,
    accessToken,
    isAuthenticated,
  ]);


  // ============================================================
  // CASCADING MACHINES FOR FILTER TOOLBAR
  // ============================================================

  useEffect(() => {

    if (!plantIdFilter) {
      setFilterMachines([]);
      return;
    }

    const loadFilterMachines =
      async () => {

        try {
          const data =
            await fetchJson(
              `${API_URL}/machines/?plant_id=${plantIdFilter}`
            );

          setFilterMachines(
            (data || []).filter(
              machine => machine.is_active
            )
          );
        } catch (error) {
          console.error("Failed to load filter machines:", error);
          setFilterMachines([]);
        }

      };

    if (isAuthenticated && accessToken) {
      loadFilterMachines();
    }

  }, [
    plantIdFilter,
    accessToken,
    isAuthenticated,
  ]);


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
            fetchTickets(),
            fetchAssignedToYou(),
            fetchCustomers(),
            fetchPlants(),
            fetchMachines(),
            fetchAssignableEngineers(),
          ]);

        } catch (error) {
          console.error(
            "Failed to load ticket page:",
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
    customerIdFilter,
    plantIdFilter,
    machineIdFilter,
    statusFilter,
    priorityFilter,
    assignedToFilter,
    activeFilter,
    agingFilter,
    currentPage,
    currentLimit,
  ]);


  // ============================================================
  // FILTER UPDATE HELPER
  // ============================================================

  const updateFilter =
    (updates) => {

      const newParams =
        new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, val]) => {
        if (val === "" || val === null || val === undefined) {
          newParams.delete(key);
        } else {
          newParams.set(key, String(val));
        }
      });

      // Reset page to 1 on filter changes unless page itself is explicitly modified
      if (!("page" in updates)) {
        newParams.set("page", "1");
      }

      setSearchParams(newParams);

    };


  // ============================================================
  // FILTER CHANGE HANDLERS (WITH CASCADING RESETS)
  // ============================================================

  const handleCustomerFilterChange =
    (event) => {

      const value =
        event.target.value;

      updateFilter({
        customer_id: value || "",
        plant_id: "",
        machine_id: "",
      });

    };

  const handlePlantFilterChange =
    (event) => {

      const value =
        event.target.value;

      updateFilter({
        plant_id: value || "",
        machine_id: "",
      });

    };

  const handleMachineFilterChange =
    (event) => {

      updateFilter({
        machine_id: event.target.value || "",
      });

    };

  const handleStatusFilterChange =
    (event) => {

      updateFilter({
        status: event.target.value || "",
      });

    };

  const handlePriorityFilterChange =
    (event) => {

      updateFilter({
        priority: event.target.value || "",
      });

    };

  const handleAssignedToFilterChange =
    (event) => {

      updateFilter({
        assigned_to: event.target.value || "",
      });

    };

  const handleAgingFilterChange =
    (event) => {

      updateFilter({
        aging: event.target.value || "",
      });

    };

  const handleActiveFilterChange =
    (event) => {

      updateFilter({
        active: event.target.value || "",
      });

    };

  const handlePageSizeChange =
    (event) => {

      updateFilter({
        limit: event.target.value,
        page: "1",
      });

    };

  const handlePageChange =
    (newPage) => {

      if (newPage < 1 || (totalPages > 0 && newPage > totalPages)) {
        return;
      }

      updateFilter({
        page: String(newPage),
      });

    };

  const clearAllFilters =
    () => {

      setSearchParams({});

    };


  // ============================================================
  // FILTER LABELS FOR CHIPS
  // ============================================================

  const filterLabels =
    useMemo(
      () => {

        const labels = [];

        if (customerIdFilter) {
          const customer =
            customers.find(
              c => String(c.id) === String(customerIdFilter)
            );
          labels.push(
            `Customer: ${customer ? customer.name : `#${customerIdFilter}`}`
          );
        }

        if (plantIdFilter) {
          const plant =
            plants.find(
              p => String(p.id) === String(plantIdFilter)
            ) ||
            filterPlants.find(
              p => String(p.id) === String(plantIdFilter)
            );
          labels.push(
            `Plant: ${plant ? plant.name : `#${plantIdFilter}`}`
          );
        }

        if (machineIdFilter) {
          const machine =
            machines.find(
              m => String(m.id) === String(machineIdFilter)
            ) ||
            filterMachines.find(
              m => String(m.id) === String(machineIdFilter)
            );
          labels.push(
            `Machine: ${machine ? machine.name : `#${machineIdFilter}`}`
          );
        }

        if (statusFilter) {
          labels.push(
            `Status: ${String(statusFilter).replaceAll("_", " ")}`
          );
        }

        if (priorityFilter) {
          labels.push(
            `Priority: ${priorityFilter}`
          );
        }

        if (activeFilter === "true") {
          labels.push(
            "Active tickets"
          );
        }

        if (assignedToFilter === "me") {
          labels.push(
            "Assigned to me"
          );
        } else if (assignedToFilter === "unassigned") {
          labels.push(
            "Unassigned"
          );
        } else if (assignedToFilter) {
          const engineer =
            engineers.find(
              u => String(u.id) === String(assignedToFilter)
            );
          labels.push(
            `Assigned: ${engineer ? `${engineer.first_name} ${engineer.last_name}` : `Engineer #${assignedToFilter}`}`
          );
        }

        if (agingFilter === "under_1_day") {
          labels.push(
            "Age: Under 1 day"
          );
        } else if (agingFilter === "one_to_three_days") {
          labels.push(
            "Age: 1–3 days"
          );
        } else if (agingFilter === "over_3_days") {
          labels.push(
            "Age: Over 3 days"
          );
        }

        return labels;

      },
      [
        customerIdFilter,
        plantIdFilter,
        machineIdFilter,
        statusFilter,
        priorityFilter,
        activeFilter,
        assignedToFilter,
        agingFilter,
        customers,
        plants,
        machines,
        filterPlants,
        filterMachines,
        engineers,
      ]
    );

  const hasActiveFilters =
    filterLabels.length > 0;


  // ============================================================
  // FORM RESET
  // ============================================================

  const resetForm =
    () => {

      setFormData({

        ticket_number: "",

        customer_id: "",

        plant_id: "",

        machine_id: "",

        created_by_id:
          currentUser?.id
            ? String(
                currentUser.id
              )
            : "",

        assigned_to_id: "",

        title: "",

        description: "",

        priority: "MEDIUM",

        status: "OPEN",

      });


      setFormPlants([]);

      setFormMachines([]);

    };


  // ============================================================
  // OPEN CREATE FORM
  // ============================================================

  const handleOpenCreate =
    () => {

      resetForm();

      setError("");

      setShowCreateForm(
        true
      );

    };


  // ============================================================
  // CLOSE CREATE FORM
  // ============================================================

  const handleCloseCreate =
    () => {

      if (saving) {
        return;
      }


      setShowCreateForm(
        false
      );

      resetForm();

    };


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
    (plantId) => {

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
  // FORM INPUT CHANGE
  // ============================================================

  const handleChange =
    async (
      event
    ) => {

      const {
        name,
        value,
      } = event.target;


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


      if (
        !formData.created_by_id
      ) {

        setError(
          "Created By is required."
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

        created_by_id:
          Number(
            formData.created_by_id
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
          formData.status,

      };


      try {

        setSaving(true);

        setError("");


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


        setShowCreateForm(
          false
        );

        resetForm();


        await fetchTickets();


        if (
          created?.id
        ) {

          navigate(
            `/tickets/${created.id}`
          );

        }

      } catch (error) {

        console.error(
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
  // ARCHIVE TICKET
  // ============================================================

  const handleArchive =
    async (
      ticket
    ) => {

      if (
        !hasPermission(
          "deactivate_ticket"
        )
      ) {

        setError(
          "You do not have permission to archive tickets."
        );

        return;

      }


      const confirmed =
        window.confirm(
          `Are you sure you want to archive ${ticket.ticket_number}?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setActionLoadingId(
          ticket.id
        );

        setError("");


        await fetchJson(
          `${API_URL}/tickets/${ticket.id}`,
          {
            method:
              "DELETE",
          }
        );


        await fetchTickets();

      } catch (error) {

        console.error(
          error
        );


        setError(
          error.message
        );

      } finally {

        setActionLoadingId(
          null
        );

      }

    };


  // ============================================================
  // ENGINEER NAME
  // ============================================================

  const getEngineerName =
    (userId) => {

      if (!userId) {
        return "Unassigned";
      }


      const engineer =
        engineers.find(
          user =>
            Number(
              user.id
            ) ===
            Number(
              userId
            )
        );


      if (engineer) {

        return (
          `${engineer.first_name} ${engineer.last_name}`
        );

      }


      /*
       * Some ticket API responses already include
       * assigned_to as a nested user object.
       */

      const ticketUser =
        tickets
          .map(
            ticket =>
              ticket.assigned_to
          )
          .find(
            user =>
              Number(
                user?.id
              ) ===
              Number(
                userId
              )
          );


      if (ticketUser) {

        return (
          `${ticketUser.first_name} ${ticketUser.last_name}`
        );

      }


      if (
        Number(
          currentUser?.id
        ) ===
        Number(
          userId
        )
      ) {

        return (
          `${currentUser.first_name} ${currentUser.last_name}`
        );

      }


      return `Engineer #${userId}`;

    };


  // ============================================================
  // CUSTOMER NAME
  // ============================================================

  const getCustomerName =
    (customerId) => {

      const customer =
        customers.find(
          item =>
            Number(
              item.id
            ) ===
            Number(
              customerId
            )
        );


      return (
        customer?.name ||
        "-"
      );

    };


  // ============================================================
  // CUSTOMER CODE
  // ============================================================

  const getCustomerCode =
    (customerId) => {

      const customer =
        customers.find(
          item =>
            Number(
              item.id
            ) ===
            Number(
              customerId
            )
        );


      return (
        customer?.customer_code ||
        ""
      );

    };


  // ============================================================
  // PLANT NAME
  // ============================================================

  const getPlantName =
    (plantId) => {

      const plant =
        plants.find(
          item =>
            Number(
              item.id
            ) ===
            Number(
              plantId
            )
        );


      return (
        plant?.name ||
        "-"
      );

    };


  // ============================================================
  // PLANT CODE
  // ============================================================

  const getPlantCode =
    (plantId) => {

      const plant =
        plants.find(
          item =>
            Number(
              item.id
            ) ===
            Number(
              plantId
            )
        );


      return (
        plant?.plant_code ||
        ""
      );

    };


  // ============================================================
  // MACHINE NAME
  // ============================================================

  const getMachineName =
    (machineId) => {

      const machine =
        machines.find(
          item =>
            Number(
              item.id
            ) ===
            Number(
              machineId
            )
        );


      return (
        machine?.name ||
        "-"
      );

    };


  // ============================================================
  // MACHINE CODE
  // ============================================================

  const getMachineCode =
    (machineId) => {

      const machine =
        machines.find(
          item =>
            Number(
              item.id
            ) ===
            Number(
              machineId
            )
        );


      return (
        machine?.machine_code ||
        ""
      );

    };


  // ============================================================
  // STATUS CLASS
  // ============================================================

  const getStatusClass =
    (status) => {

      if (!status) {
        return "";
      }


      return (
        `ticket-status status-${String(
          status
        )
          .toLowerCase()
          .replaceAll(
            "_",
            "-"
          )}`
      );

    };


  // ============================================================
  // PRIORITY CLASS
  // ============================================================

  const getPriorityClass =
    (priority) => {

      if (!priority) {
        return "";
      }


      return (
        `ticket-priority priority-${String(
          priority
        ).toLowerCase()}`
      );

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

        Loading service tickets...

      </div>

    );

  }


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <div className="page-container">


      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

      <div className="page-header">

        <div>

          <h2>
            Service Tickets
          </h2>

          <p>
            Manage service incidents,
            assignments and resolutions.
          </p>

        </div>


        {hasPermission(
          "create_ticket"
        ) && (

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate("/tickets/new")
            }
          >
            + Create Ticket
          </button>

        )}

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
          TICKET FILTER TOOLBAR
      ======================================================= */}

      <section className="ticket-filter-card">

        <div className="ticket-filter-header">

          <h3 className="ticket-filter-title">
            Filter Tickets
          </h3>

          {hasActiveFilters && (

            <button
              type="button"
              className="secondary-button"
              onClick={
                clearAllFilters
              }
            >
              Clear All Filters
            </button>

          )}

        </div>


        <div className="ticket-filter-grid">

          {/* Customer */}

          <div className="ticket-filter-group">

            <label>
              Customer
            </label>

            <select
              value={
                customerIdFilter
              }
              onChange={
                handleCustomerFilterChange
              }
            >

              <option value="">
                All Customers
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


          {/* Plant (Cascading) */}

          <div className="ticket-filter-group">

            <label>
              Plant
            </label>

            <select
              value={
                plantIdFilter
              }
              onChange={
                handlePlantFilterChange
              }
              disabled={
                !customerIdFilter
              }
            >

              <option value="">

                {!customerIdFilter
                  ? "Select Customer First"
                  : "All Plants"}

              </option>


              {filterPlants.map(
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


          {/* Machine (Cascading) */}

          <div className="ticket-filter-group">

            <label>
              Machine
            </label>

            <select
              value={
                machineIdFilter
              }
              onChange={
                handleMachineFilterChange
              }
              disabled={
                !plantIdFilter
              }
            >

              <option value="">

                {!plantIdFilter
                  ? "Select Plant First"
                  : "All Machines"}

              </option>


              {filterMachines.map(
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


          {/* Status */}

          <div className="ticket-filter-group">

            <label>
              Status
            </label>

            <select
              value={
                statusFilter
              }
              onChange={
                handleStatusFilterChange
              }
            >

              <option value="">
                All Statuses
              </option>

              <option value="OPEN">
                Open
              </option>

              <option value="ASSIGNED">
                Assigned
              </option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="RESOLVED">
                Resolved
              </option>

              <option value="CLOSE_REQUESTED">
                Close Requested
              </option>

              <option value="CLOSED">
                Closed
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>

            </select>

          </div>


          {/* Priority */}

          <div className="ticket-filter-group">

            <label>
              Priority
            </label>

            <select
              value={
                priorityFilter
              }
              onChange={
                handlePriorityFilterChange
              }
            >

              <option value="">
                All Priorities
              </option>

              <option value="LOW">
                Low
              </option>

              <option value="MEDIUM">
                Medium
              </option>

              <option value="HIGH">
                High
              </option>

            </select>

          </div>


          {/* Assigned To */}

          <div className="ticket-filter-group">

            <label>
              Assigned To
            </label>

            <select
              value={
                assignedToFilter
              }
              onChange={
                handleAssignedToFilterChange
              }
            >

              <option value="">
                All Assignees
              </option>

              <option value="me">
                Assigned to Me
              </option>

              <option value="unassigned">
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

          </div>


          {/* Aging */}

          <div className="ticket-filter-group">

            <label>
              Ticket Aging
            </label>

            <select
              value={
                agingFilter
              }
              onChange={
                handleAgingFilterChange
              }
            >

              <option value="">
                All Ages
              </option>

              <option value="under_1_day">
                Under 1 day
              </option>

              <option value="one_to_three_days">
                1–3 days
              </option>

              <option value="over_3_days">
                Over 3 days
              </option>

            </select>

          </div>


          {/* Scope / Active */}

          <div className="ticket-filter-group">

            <label>
              Ticket Scope
            </label>

            <select
              value={
                activeFilter
              }
              onChange={
                handleActiveFilterChange
              }
            >

              <option value="">
                All (Active & Closed)
              </option>

              <option value="true">
                Active Tickets Only
              </option>

            </select>

          </div>

        </div>

      </section>


      {/* ======================================================
          ACTIVE FILTER CHIPS
      ======================================================= */}

      {hasActiveFilters && (

        <section className="filter-card">

          <div className="filter-card-content">

            <div>

              <span className="filter-card-label">
                Active Filters
              </span>


              <div className="filter-chip-list">

                {filterLabels.map(
                  label => (

                    <span
                      key={
                        label
                      }
                      className="filter-chip"
                    >
                      {label}
                    </span>

                  )
                )}

              </div>

            </div>


            <button
              type="button"
              className="secondary-button"
              onClick={
                clearAllFilters
              }
            >
              Clear Filters
            </button>

          </div>

        </section>

      )}


      {/* ======================================================
          CREATE FORM
      ======================================================= */}

      {showCreateForm && (

        <section className="form-card">

          <div className="form-header">

            <div>

              <h3>
                Create Service Ticket
              </h3>

              <p>
                Create a new service incident
                and assign it to the correct
                customer, plant and machine.
              </p>

            </div>


            <button
              type="button"
              className="close-button"
              onClick={
                handleCloseCreate
              }
              disabled={
                saving
              }
            >
              ×
            </button>

          </div>


          <form
            onSubmit={
              handleCreate
            }
          >

            <div className="form-grid">


              {/* ==================================================
                  LOCATION
              =================================================== */}

              <div className="form-section-title">
                Ticket Location
              </div>


              {/* Ticket Number */}

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


              {/* Machine */}

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


              {/* ==================================================
                  TICKET INFORMATION
              =================================================== */}

              <div className="form-section-title">
                Ticket Information
              </div>


              {/* Created By */}

              <div className="form-group">

                <label>
                  Created By *
                </label>

                <input
                  value={
                    currentUser
                      ? `${currentUser.employee_code} - ${currentUser.first_name} ${currentUser.last_name}`
                      : ""
                  }
                  disabled
                />

                <input
                  type="hidden"
                  name="created_by_id"
                  value={
                    formData.created_by_id
                  }
                />

              </div>


              {/* Assigned Engineer */}

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


              {/* Title */}

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


              {/* Priority */}

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


              {/* Status */}

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


                  {hasPermission(
                    "assign_engineer"
                  ) && (

                    <option value="ASSIGNED">
                      ASSIGNED
                    </option>

                  )}


                  {hasPermission(
                    "start_ticket"
                  ) && (

                    <option value="IN_PROGRESS">
                      IN PROGRESS
                    </option>

                  )}


                  {hasPermission(
                    "resolve_ticket"
                  ) && (

                    <option value="RESOLVED">
                      RESOLVED
                    </option>

                  )}

                </select>

              </div>


              {/* Description */}

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
                  rows="6"
                  placeholder="Describe the issue, symptoms and relevant details..."
                  required
                />

              </div>

            </div>


            <div className="form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={
                  handleCloseCreate
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
                  saving
                }
              >

                {saving
                  ? "Creating..."
                  : "Create Ticket"}

              </button>

            </div>

          </form>

        </section>

      )}


      {/* ======================================================
          ASSIGNED TO YOU
      ======================================================= */}

      {hasPermission("view_ticket") && !assignedToFilter && (

        <section className="section-card">

          <div className="section-card-header">

            <div>

              <h3>
                Assigned to You
              </h3>

              <p>
                Tickets currently assigned to you.
              </p>

            </div>


            <span className="section-count">
              {
                assignedToYou.length
              }
            </span>

          </div>


          {assignedToYou.length === 0 ? (

            <div className="empty-state">

              <strong>
                No active tickets assigned
              </strong>

              <p>
                No active tickets are currently assigned to you.
              </p>

            </div>

          ) : (

            <div className="table-container">

              <table className="data-table">

                <thead>

                  <tr>

                    <th>
                      Ticket
                    </th>

                    <th>
                      Customer
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
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {assignedToYou.map(
                    ticket => (

                      <tr
                        key={
                          `assigned-${ticket.id}`
                        }
                      >

                        <td>

                          <button type="button" className="entity-link entity-link-block" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                            <strong>{ticket.ticket_number}</strong>
                          </button>

                        </td>


                        <td>

                          <button type="button" className="entity-link entity-link-block" onClick={() => navigate(`/customers/${ticket.customer_id}`)}>
                            <strong>{getCustomerCode(ticket.customer_id)}</strong>
                          </button>

                          <span className="table-secondary-text">

                            {
                              getCustomerName(
                                ticket.customer_id
                              )
                            }

                          </span>

                        </td>


                        <td>

                          <button type="button" className="entity-link entity-link-block" onClick={() => navigate(`/plants/${ticket.plant_id}`)}>
                            <strong>{getPlantCode(ticket.plant_id)}</strong>
                          </button>

                          <span className="table-secondary-text">

                            {
                              getPlantName(
                                ticket.plant_id
                              )
                            }

                          </span>

                        </td>


                        <td>

                          <button type="button" className="entity-link entity-link-block" onClick={() => navigate(`/machines/${ticket.machine_id}`)}>
                            <strong>{getMachineCode(ticket.machine_id)}</strong>
                          </button>

                          <span className="table-secondary-text">

                            {
                              getMachineName(
                                ticket.machine_id
                              )
                            }

                          </span>

                        </td>


                        <td><button type="button" className="entity-link entity-link-block" onClick={() => navigate(`/tickets/${ticket.id}`)}>{ticket.title}</button></td>


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

                          <div className="action-buttons">

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


                            {hasPermission(
                              "update_ticket"
                            ) && (

                              <button
                                type="button"
                                className="edit-button"
                                onClick={() =>
                                  navigate(
                                    `/tickets/${ticket.id}/edit`
                                  )
                                }
                              >
                                Edit
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

      )}


      {/* ======================================================
          ALL SERVICE TICKETS
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              All Service Tickets
            </h3>

            <p>

              {hasActiveFilters

                ? `Showing ${totalTickets} ticket${totalTickets === 1 ? "" : "s"} matching the selected filters.`

                : `Complete service ticket list (${totalTickets} total).`}

            </p>

          </div>


          <span className="section-count">
            {
              totalTickets
            }
          </span>

        </div>


        {tickets.length === 0 ? (

          <div className="empty-state">

            <strong>
              No matching tickets found
            </strong>

            <p>

              {hasActiveFilters
                ? "Try clearing or adjusting the filters to see tickets."
                : "No service tickets are currently available."}

            </p>

          </div>

        ) : (

          <div className="table-container">

            <table className="data-table">

              <thead>

                <tr>

                  <th>
                    Ticket
                  </th>

                  <th>
                    Customer
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

                {tickets.map(
                  ticket => {

                    const isActionLoading =
                      actionLoadingId ===
                      ticket.id;


                    return (

                      <tr
                        key={
                          ticket.id
                        }
                      >

                        {/* TICKET */}

                        <td>

                          <button type="button" className="entity-link entity-link-block" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                            <strong>{ticket.ticket_number}</strong>
                          </button>

                        </td>


                        {/* CUSTOMER */}

                        <td>

                          <button type="button" className="entity-link entity-link-block" onClick={() => navigate(`/customers/${ticket.customer_id}`)}>
                            <strong>{getCustomerCode(ticket.customer_id)}</strong>
                          </button>

                          <span className="table-secondary-text">

                            {
                              getCustomerName(
                                ticket.customer_id
                              )
                            }

                          </span>

                        </td>


                        {/* PLANT */}

                        <td>

                          <button type="button" className="entity-link entity-link-block" onClick={() => navigate(`/plants/${ticket.plant_id}`)}>
                            <strong>{getPlantCode(ticket.plant_id)}</strong>
                          </button>

                          <span className="table-secondary-text">

                            {
                              getPlantName(
                                ticket.plant_id
                              )
                            }

                          </span>

                        </td>


                        {/* MACHINE */}

                        <td>

                          <button type="button" className="entity-link entity-link-block" onClick={() => navigate(`/machines/${ticket.machine_id}`)}>
                            <strong>{getMachineCode(ticket.machine_id)}</strong>
                          </button>

                          <span className="table-secondary-text">

                            {
                              getMachineName(
                                ticket.machine_id
                              )
                            }

                          </span>

                        </td>


                        {/* TITLE */}

                        <td><button type="button" className="entity-link entity-link-block" onClick={() => navigate(`/tickets/${ticket.id}`)}>{ticket.title}</button></td>


                        {/* PRIORITY */}

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


                        {/* STATUS */}

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


                        {/* ASSIGNED ENGINEER */}

                        <td>

                          <strong>
                            {
                              ticket.assigned_to
                                ? `${ticket.assigned_to.first_name} ${ticket.assigned_to.last_name}`
                                : getEngineerName(
                                    ticket.assigned_to_id
                                  )
                            }
                          </strong>

                        </td>


                        {/* CREATED */}

                        <td>

                          <span
                            className="table-date-text"
                          >

                            {
                              ticket.created_at
                                ? new Date(
                                    ticket.created_at
                                  ).toLocaleString()
                                : "-"
                            }

                          </span>

                        </td>


                        {/* ACTIONS */}

                        <td>

                          <div className="action-buttons">

                            {hasPermission(
                              "view_ticket"
                            ) && (

                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() =>
                                  navigate(
                                    `/tickets/${ticket.id}`
                                  )
                                }
                                disabled={
                                  isActionLoading
                                }
                              >
                                View
                              </button>

                            )}


                            {hasPermission(
                              "update_ticket"
                            ) && (

                              <button
                                type="button"
                                className="edit-button"
                                onClick={() =>
                                  navigate(
                                    `/tickets/${ticket.id}/edit`
                                  )
                                }
                                disabled={
                                  isActionLoading
                                }
                              >
                                Edit
                              </button>

                            )}


                            {hasPermission(
                              "deactivate_ticket"
                            ) && (

                              <button
                                type="button"
                                className="danger-button"
                                onClick={() =>
                                  handleArchive(
                                    ticket
                                  )
                                }
                                disabled={
                                  isActionLoading
                                }
                              >

                                {
                                  isActionLoading
                                    ? "Working..."
                                    : "Archive"
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


        {/* ======================================================
            PAGINATION TOOLBAR
        ======================================================= */}

        {totalTickets > 0 && (

          <div className="pagination-toolbar">

            <div className="pagination-summary">

              Showing{" "}

              <strong>
                {
                  (currentPage - 1) * currentLimit + 1
                }
              </strong>

              {"–"}

              <strong>
                {
                  Math.min(currentPage * currentLimit, totalTickets)
                }
              </strong>

              {" of "}

              <strong>
                {
                  totalTickets
                }
              </strong>

              {" tickets"}

            </div>


            <div className="pagination-actions">

              <div className="pagination-page-size">

                <label htmlFor="ticket-page-size">
                  Per page:
                </label>

                <select
                  id="ticket-page-size"
                  value={
                    currentLimit
                  }
                  onChange={
                    handlePageSizeChange
                  }
                >

                  <option value="10">
                    10
                  </option>

                  <option value="25">
                    25
                  </option>

                  <option value="50">
                    50
                  </option>

                  <option value="100">
                    100
                  </option>

                </select>

              </div>


              <div className="pagination-buttons">

                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() =>
                    handlePageChange(
                      currentPage - 1
                    )
                  }
                  disabled={
                    currentPage <= 1
                  }
                >
                  &larr; Prev
                </button>


                <span className="pagination-current">
                  Page {currentPage} of {Math.max(1, totalPages)}
                </span>


                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() =>
                    handlePageChange(
                      currentPage + 1
                    )
                  }
                  disabled={
                    currentPage >= totalPages
                  }
                >
                  Next &rarr;
                </button>

              </div>

            </div>

          </div>

        )}

      </section>


    </div>

  );

}


export default Tickets;


