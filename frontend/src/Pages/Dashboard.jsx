import {
  useEffect,
  useState,
} from "react";

import { API_URL } from "../config";

import {
  useAuth,
} from "../auth/AuthContext";

import {
  Link,
} from "react-router-dom";




// ============================================================
// FORMAT STATUS
// ============================================================

function formatStatus(status) {

  if (!status) {
    return "";
  }

  return String(status)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      letter => letter.toUpperCase()
    );

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(value) {

  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );

}


// ============================================================
// SHORT DATE
// ============================================================

function formatShortDate(value) {

  if (!value) {
    return "";
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
    }
  );

}


// ============================================================
// STATUS CLASS
// ============================================================

function getStatusClass(status) {

  switch (status) {

    case "OPEN":
      return "dashboard-status-open";

    case "ASSIGNED":
      return "dashboard-status-assigned";

    case "IN_PROGRESS":
      return "dashboard-status-progress";

    case "RESOLVED":
      return "dashboard-status-resolved";

    case "CLOSE_REQUESTED":
      return "dashboard-status-review";

    case "CLOSED":
      return "dashboard-status-closed";

    case "CANCELLED":
      return "dashboard-status-cancelled";

    default:
      return "";

  }

}


// ============================================================
// PRIORITY CLASS
// ============================================================

function getPriorityClass(priority) {

  switch (priority) {

    case "HIGH":
      return "dashboard-priority-high";

    case "MEDIUM":
      return "dashboard-priority-medium";

    case "LOW":
      return "dashboard-priority-low";

    case "CRITICAL":
      return "dashboard-priority-critical";

    default:
      return "";

  }

}


// ============================================================
// DASHBOARD
// ============================================================

function Dashboard() {

  const {
    accessToken,
    isAuthenticated,
    currentUser,
  } = useAuth();


  const [
    dashboard,
    setDashboard,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  useEffect(() => {

    if (
      !isAuthenticated ||
      !accessToken
    ) {

      setLoading(false);

      return;

    }


    const loadDashboard =
      async () => {

        try {

          setLoading(true);

          setError("");


          const response =
            await fetch(
              `${API_URL}/dashboard/summary`,
              {
                method: "GET",

                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                },
              }
            );


          if (!response.ok) {

            let message =
              `Dashboard API failed: ${response.status}`;


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


          const data =
            await response.json();


          setDashboard(
            data
          );

        } catch (err) {

          console.error(
            "Dashboard error:",
            err
          );


          setError(
            err?.message ||
            "Unable to load dashboard."
          );

        } finally {

          setLoading(false);

        }

      };


    loadDashboard();

  }, [
    accessToken,
    isAuthenticated,
  ]);


  // ==========================================================
  // AUTH
  // ==========================================================

  if (!isAuthenticated) {

    return (

      <div
        className="dashboard-empty"
      >
        Please login first.
      </div>

    );

  }


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (

      <div
        className="dashboard-loading"
      >

        <div
          className="dashboard-spinner"
        />

        <p>
          Loading dashboard...
        </p>

      </div>

    );

  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {

    return (

      <div
        className="dashboard-error"
      >

        <strong>
          Unable to load dashboard
        </strong>


        <p>
          {error}
        </p>


        <button
          type="button"
          className="primary-button"
          onClick={() =>
            window.location.reload()
          }
        >
          Retry
        </button>

      </div>

    );

  }


  // ==========================================================
  // SAFETY
  // ==========================================================

  if (!dashboard) {

    return (

      <div
        className="dashboard-empty"
      >
        No dashboard data available.
      </div>

    );

  }


  // ==========================================================
  // DATA
  // ==========================================================

  const customers =
    dashboard.customers?.active ??
    0;


  const plants =
    dashboard.plants?.active ??
    0;


  const machines =
    dashboard.machines?.active ??
    0;


  const tickets =
    dashboard.tickets ??
    {};


  const priority =
    dashboard.priority ??
    {};


  const myTickets =
    dashboard.my_tickets ??
    {};


  const statusDistribution =
    Array.isArray(
      dashboard.status_distribution
    )
      ? dashboard.status_distribution
      : [];


  const priorityDistribution =
    Array.isArray(
      dashboard.priority_distribution
    )
      ? dashboard.priority_distribution
      : [];


  const engineerWorkload =
    Array.isArray(
      dashboard.engineer_workload
    )
      ? dashboard.engineer_workload
      : [];


  const recentTickets =
    Array.isArray(
      dashboard.recent_tickets
    )
      ? dashboard.recent_tickets
      : [];


  const ticketTrend =
    Array.isArray(
      dashboard.ticket_trend
    )
      ? dashboard.ticket_trend
      : [];


  const ticketAging =
    dashboard.ticket_aging ??
    {};


  // ==========================================================
  // OVERDUE
  // ==========================================================

  const overdueTickets =
    Number(
      tickets.overdue ??
      ticketAging.over_3_days ??
      0
    );


  const myOverdueTickets =
    Number(
      myTickets.overdue ??
      0
    );


  // ==========================================================
  // ROLE
  // ==========================================================

  const userRole =
    currentUser?.role ||
    currentUser?.role_name ||
    "";


  const isEngineer =
    userRole ===
    "Service Engineer";


  // ==========================================================
  // TOTALS
  // ==========================================================

  const statusTotal =
    statusDistribution.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item?.count ||
          0
        ),
      0
    );


  const priorityTotal =
    priorityDistribution.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item?.count ||
          0
        ),
      0
    );


  // ==========================================================
  // STATUS BAR WIDTH
  // ==========================================================

  const getStatusWidth =
    count => {

      if (!statusTotal) {
        return 0;
      }


      return Math.max(
        4,
        (
          Number(
            count ||
            0
          ) /
          statusTotal
        ) *
        100
      );

    };


  // ==========================================================
  // ENGINEER MAX
  // ==========================================================

  const engineerCounts =
    engineerWorkload.map(
      engineer =>
        Number(
          engineer?.count ||
          0
        )
    );


  const maxEngineerTickets =
    Math.max(
      1,
      ...engineerCounts
    );


  // ==========================================================
  // PRIORITY PIE
  // ==========================================================

  const lowPriority =
    Number(
      priority.low ||
      0
    );


  const mediumPriority =
    Number(
      priority.medium ||
      0
    );


  const highPriority =
    Number(
      priority.high ||
      0
    );


  const criticalPriority =
    Number(
      priority.critical ||
      0
    );


  let priorityPieBackground =
    "conic-gradient(#e5e7eb 0deg 360deg)";


  if (
    priorityTotal >
    0
  ) {

    const lowDegrees =
      (
        lowPriority /
        priorityTotal
      ) *
      360;


    const mediumDegrees =
      (
        mediumPriority /
        priorityTotal
      ) *
      360;


    const highDegrees =
      (
        highPriority /
        priorityTotal
      ) *
      360;


    const first =
      lowDegrees;


    const second =
      first +
      mediumDegrees;


    const third =
      second +
      highDegrees;


    priorityPieBackground =
      `conic-gradient(
        #22c55e 0deg ${first}deg,
        #f59e0b ${first}deg ${second}deg,
        #ef4444 ${second}deg ${third}deg,
        #7c3aed ${third}deg 360deg
      )`;

  }


  // ==========================================================
  // TREND MAX
  // ==========================================================

  const trendMax =
    Math.max(
      1,
      ...ticketTrend.flatMap(
        item => [
          Number(
            item.created ||
            0
          ),

          Number(
            item.closed ||
            0
          ),
        ]
      )
    );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      className="dashboard-page"
    >


      <style>{`
        .dashboard-page {
          max-width: 1120px;
          margin: 0 auto;
          padding: 10px 0 44px;
          color: #0f172a;
        }

        .dashboard-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 22px;
        }

        .dashboard-header h1 {
          margin: 0;
          color: #0b1730;
          font-size: 30px;
          line-height: 1.15;
          letter-spacing: -0.7px;
        }

        .dashboard-header p {
          margin: 7px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .dashboard-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .dashboard-summary-card {
          position: relative;
          min-height: 116px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px;
          border: 1px solid #dce5f0;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.045);
          color: #0f172a;
          text-decoration: none;
          overflow: hidden;
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }

        .dashboard-summary-card:hover {
          transform: translateY(-2px);
          border-color: #b9cbe2;
          box-shadow: 0 9px 24px rgba(15, 23, 42, 0.09);
        }

        .dashboard-summary-card::after {
          content: "";
          position: absolute;
          right: -28px;
          top: -38px;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.045);
        }

        .dashboard-summary-card.dashboard-summary-primary {
          border-color: #c9dafa;
          background: linear-gradient(135deg, #ffffff 0%, #f7faff 100%);
        }

        .dashboard-card-icon {
          width: 46px;
          height: 46px;
          flex: 0 0 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #dbe7f5;
          border-radius: 12px;
          background: #f2f7ff;
          font-size: 20px;
          z-index: 1;
        }

        .dashboard-summary-card span {
          display: block;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .035em;
        }

        .dashboard-summary-card strong {
          display: block;
          margin-top: 4px;
          color: #0b1730;
          font-size: 25px;
          line-height: 1;
        }

        .dashboard-card-action {
          margin-top: 9px;
          color: #2563eb !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: none !important;
          letter-spacing: 0 !important;
        }

        .dashboard-section {
          margin-bottom: 18px;
          border: 1px solid #dce5f0;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
          overflow: hidden;
        }

        .dashboard-section-header {
          min-height: 68px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 20px;
          border-bottom: 1px solid #e7edf5;
          background: linear-gradient(180deg, #fff 0%, #fbfdff 100%);
        }

        .dashboard-section-header h2 {
          margin: 0;
          color: #0f172a;
          font-size: 15px;
          letter-spacing: -.1px;
        }

        .dashboard-section-header p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 11px;
        }

        .dashboard-section-number,
        .dashboard-total-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 34px;
          min-height: 30px;
          padding: 0 10px;
          box-sizing: border-box;
          border: 1px solid #d9e7fa;
          border-radius: 999px;
          background: #f3f7ff;
          color: #2563eb;
          font-size: 11px;
          font-weight: 800;
        }

        .dashboard-mini-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          padding: 16px 20px 20px;
        }

        .dashboard-mini-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 70px;
          padding: 13px 15px;
          border: 1px solid #e1e8f1;
          border-radius: 10px;
          background: #fbfdff;
          color: #334155;
          text-decoration: none;
          transition: transform .16s ease, border-color .16s ease, background .16s ease;
        }

        .dashboard-mini-card:hover {
          transform: translateY(-1px);
          border-color: #b9cbe2;
          background: #f7faff;
        }

        .dashboard-mini-card span {
          font-size: 11px;
          font-weight: 700;
        }

        .dashboard-mini-card strong {
          font-size: 21px;
          color: #0f172a;
        }

        .dashboard-mini-warning {
          background: #fffaf0;
          border-color: #f7dfae;
        }

        .dashboard-mini-danger {
          background: #fff7f7;
          border-color: #f4cccc;
        }

        .dashboard-attention-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 11px;
          padding: 16px 20px 20px;
        }

        .dashboard-attention-card {
          display: grid;
          grid-template-columns: 36px 1fr auto;
          align-items: center;
          gap: 11px;
          min-height: 90px;
          padding: 13px;
          border: 1px solid #e1e8f1;
          border-radius: 11px;
          background: #fff;
          color: #0f172a;
          text-decoration: none;
          transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
        }

        .dashboard-attention-card:hover {
          transform: translateY(-1px);
          border-color: #c5d4e7;
          box-shadow: 0 5px 14px rgba(15, 23, 42, .06);
        }

        .dashboard-attention-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          font-weight: 900;
        }

        .dashboard-attention-review {
          border: 1px solid #fed7aa;
          background: #fff7ed;
          color: #ea580c;
        }

        .dashboard-attention-high {
          border: 1px solid #fecaca;
          background: #fff5f5;
          color: #dc2626;
        }

        .dashboard-attention-overdue-icon {
          border: 1px solid #fecaca;
          background: #fff5f5;
          color: #b91c1c;
        }

        .dashboard-attention-content span {
          display: block;
          color: #334155;
          font-size: 11px;
          font-weight: 800;
        }

        .dashboard-attention-content strong {
          display: block;
          margin-top: 3px;
          font-size: 20px;
        }

        .dashboard-attention-content p {
          margin: 4px 0 0;
          color: #94a3b8;
          font-size: 10px;
          line-height: 1.35;
        }

        .dashboard-attention-arrow,
        .dashboard-filter-arrow {
          color: #94a3b8;
          font-size: 15px;
          font-weight: 700;
          transition: color .16s ease, transform .16s ease;
        }

        .dashboard-clickable-card:hover .dashboard-filter-arrow,
        .dashboard-clickable-row:hover .dashboard-filter-arrow,
        .dashboard-attention-card:hover .dashboard-attention-arrow {
          color: #2563eb;
          transform: translateX(2px);
        }

        .dashboard-chart-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(0, .95fr);
          gap: 18px;
          align-items: stretch;
        }

        .dashboard-trend {
          padding: 17px 20px 18px;
        }

        .dashboard-trend-legend {
          display: flex;
          gap: 18px;
          margin-bottom: 13px;
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
        }

        .dashboard-trend-legend span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .dashboard-trend-legend i {
          width: 8px;
          height: 8px;
          display: inline-block;
          border-radius: 3px;
        }

        .dashboard-trend-created {
          background: #2563eb !important;
        }

        .dashboard-trend-closed {
          background: #94a3b8 !important;
        }

        .dashboard-trend-chart {
          height: 170px;
          display: flex;
          align-items: flex-end;
          gap: 3px;
          padding: 10px 3px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .dashboard-trend-day {
          flex: 1 1 0;
          height: 100%;
          display: flex;
          align-items: flex-end;
          min-width: 0;
        }

        .dashboard-trend-bars {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 2px;
        }

        .dashboard-trend-bar {
          width: 45%;
          min-height: 3px;
          border-radius: 3px 3px 0 0;
        }

        .dashboard-trend-dates {
          display: flex;
          justify-content: space-between;
          margin-top: 7px;
          color: #94a3b8;
          font-size: 9px;
        }

        .dashboard-aging {
          display: grid;
          gap: 9px;
          padding: 16px 20px 20px;
        }

        .dashboard-aging-card {
          display: grid;
          grid-template-columns: 48px 1fr auto;
          align-items: center;
          gap: 12px;
          min-height: 62px;
          padding: 9px 12px;
          border: 1px solid #e1e8f1;
          border-radius: 10px;
          background: #fbfdff;
          color: #0f172a;
          text-decoration: none;
          transition: transform .16s ease, border-color .16s ease, background .16s ease;
        }

        .dashboard-aging-card:hover {
          transform: translateX(2px);
          border-color: #bfd0e5;
          background: #f8fbff;
        }

        .dashboard-aging-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 45px;
          height: 40px;
          border-radius: 9px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 18px;
          font-weight: 800;
        }

        .dashboard-aging-warning .dashboard-aging-number {
          background: #fff7ed;
          color: #ea580c;
        }

        .dashboard-aging-card strong {
          display: block;
          font-size: 12px;
        }

        .dashboard-aging-card span {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 10px;
        }

        .dashboard-bars {
          padding: 13px 20px 19px;
        }

        .dashboard-bar-row {
          display: grid;
          grid-template-columns: 150px 1fr 18px;
          align-items: center;
          gap: 12px;
          padding: 9px 0;
          color: #334155;
          text-decoration: none;
          border-bottom: 1px solid #f0f3f7;
        }

        .dashboard-bar-row:last-child {
          border-bottom: 0;
        }

        .dashboard-bar-row:hover .dashboard-bar-label span {
          color: #2563eb;
        }

        .dashboard-bar-label {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 11px;
        }

        .dashboard-bar-label strong {
          color: #0f172a;
        }

        .dashboard-bar-track,
        .dashboard-engineer-track {
          height: 8px;
          overflow: hidden;
          border-radius: 999px;
          background: #edf2f7;
        }

        .dashboard-bar-fill {
          height: 100%;
          border-radius: inherit;
        }

        .dashboard-status-open { background: #2563eb !important; }
        .dashboard-status-assigned { background: #64748b !important; }
        .dashboard-status-progress { background: #f59e0b !important; }
        .dashboard-status-resolved { background: #16a34a !important; }
        .dashboard-status-review { background: #ea580c !important; }
        .dashboard-status-closed { background: #475569 !important; }
        .dashboard-status-cancelled { background: #dc2626 !important; }

        .dashboard-priority-content {
          display: grid;
          grid-template-columns: 150px 1fr;
          align-items: center;
          gap: 18px;
          padding: 17px 20px 20px;
        }

        .dashboard-pie {
          width: 142px !important;
          height: 142px !important;
          min-width: 142px;
          margin: 0 auto;
          border-radius: 50% !important;
          display: grid;
          place-items: center;
          box-sizing: border-box;
          box-shadow: inset 0 0 0 1px rgba(15, 23, 42, .04), 0 8px 20px rgba(15, 23, 42, .07);
          position: relative;
        }

        .dashboard-pie-inner {
          width: 78px;
          height: 78px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid #edf1f6;
          border-radius: 50%;
          background: #fff !important;
          box-shadow: 0 2px 8px rgba(15, 23, 42, .06);
          box-sizing: border-box;
        }

        .dashboard-pie-inner strong {
          color: #0f172a;
          font-size: 22px;
          line-height: 1;
          font-weight: 900;
        }

        .dashboard-pie-inner span {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 9px;
          font-weight: 700;
          line-height: 1;
        }

        .dashboard-legend {
          display: grid;
          gap: 4px;
        }

        .dashboard-legend-item {
          display: grid;
          grid-template-columns: 9px 1fr 16px;
          align-items: center;
          gap: 9px;
          padding: 8px 7px;
          border-radius: 7px;
          color: #334155;
          text-decoration: none;
        }

        .dashboard-legend-item:hover {
          background: #f8fafc;
        }

        .dashboard-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .dashboard-legend-item div {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 11px;
        }

        .dashboard-legend-item div strong {
          color: #0f172a;
        }

        .dashboard-engineer-list {
          padding: 5px 20px 18px;
        }

        .dashboard-engineer-row {
          display: grid;
          grid-template-columns: minmax(220px, .75fr) 1fr;
          align-items: center;
          gap: 22px;
          padding: 12px 8px;
          border-bottom: 1px solid #eef2f6;
          color: #0f172a;
          text-decoration: none;
          border-radius: 8px;
        }

        .dashboard-engineer-row:last-child {
          border-bottom: 0;
        }

        .dashboard-engineer-row:hover {
          background: #f8fbff;
        }

        .dashboard-engineer-info {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .dashboard-engineer-avatar {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          color: #2563eb;
          font-size: 12px;
          font-weight: 800;
        }

        .dashboard-engineer-info strong {
          display: block;
          font-size: 12px;
        }

        .dashboard-engineer-info span {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 10px;
        }

        .dashboard-engineer-progress {
          display: grid;
          grid-template-columns: 1fr 28px 16px;
          align-items: center;
          gap: 10px;
        }

        .dashboard-engineer-progress > strong {
          text-align: right;
          font-size: 12px;
        }

        .dashboard-engineer-fill {
          height: 100%;
          border-radius: inherit;
          background: #2563eb;
        }

        .dashboard-recent-list {
          padding: 5px 20px 12px;
        }

        .dashboard-recent-row {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) 90px 125px 150px;
          align-items: center;
          gap: 14px;
          padding: 13px 8px;
          border-bottom: 1px solid #eef2f6;
          border-radius: 8px;
          color: #0f172a;
          text-decoration: none;
          transition: background .16s ease;
        }

        .dashboard-recent-row:last-child {
          border-bottom: 0;
        }

        .dashboard-recent-row:hover {
          background: #f8fbff;
        }

        .dashboard-recent-ticket strong {
          display: block;
          color: #2563eb;
          font-size: 11px;
        }

        .dashboard-recent-ticket span {
          display: block;
          margin-top: 3px;
          overflow: hidden;
          color: #475569;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ========================================================
           PRIORITY BADGES
           ======================================================== */

        .dashboard-priority-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-width: 76px;
          padding: 6px 11px;
          box-sizing: border-box;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .02em;
          white-space: nowrap;
        }

        .dashboard-priority-badge::before {
          content: "";
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          border-radius: 50%;
        }

        .dashboard-priority-low {
          background: #f0fdf4 !important;
          color: #15803d !important;
        }

        .dashboard-priority-low::before {
          background: #22c55e;
        }

        .dashboard-priority-medium {
          background: #fff8df !important;
          color: #b45309 !important;
        }

        .dashboard-priority-medium::before {
          background: #f59e0b;
        }

        .dashboard-priority-high {
          background: #fff0f2 !important;
          color: #dc2626 !important;
        }

        .dashboard-priority-high::before {
          background: #ef4444;
        }

        .dashboard-priority-critical {
          background: #f3efff !important;
          color: #6d28d9 !important;
        }

        .dashboard-priority-critical::before {
          background: #7c3aed;
        }

        /* ========================================================
           STATUS BADGES
           ======================================================== */

        .dashboard-status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-width: 92px;
          padding: 6px 11px;
          box-sizing: border-box;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .01em;
          white-space: nowrap;
        }

        .dashboard-status-badge::before {
          content: "";
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          border-radius: 50%;
        }

        .dashboard-status-open {
          background: #eaf2ff !important;
          color: #1d4ed8 !important;
        }

        .dashboard-status-open::before {
          background: #2563eb;
        }

        .dashboard-status-assigned {
          background: #f1f5f9 !important;
          color: #475569 !important;
        }

        .dashboard-status-assigned::before {
          background: #64748b;
        }

        .dashboard-status-progress {
          background: #fff0d8 !important;
          color: #c26708 !important;
        }

        .dashboard-status-progress::before {
          background: #f59e0b;
        }

        .dashboard-status-resolved {
          background: #e9f9ef !important;
          color: #15803d !important;
        }

        .dashboard-status-resolved::before {
          background: #22c55e;
        }

        .dashboard-status-review {
          background: #fff0e3 !important;
          color: #c2410c !important;
        }

        .dashboard-status-review::before {
          background: #f97316;
        }

        .dashboard-status-closed {
          background: #e8f8ee !important;
          color: #047857 !important;
        }

        .dashboard-status-closed::before {
          background: #10b981;
        }

        .dashboard-status-cancelled {
          background: #fff0f0 !important;
          color: #b91c1c !important;
        }

        .dashboard-status-cancelled::before {
          background: #ef4444;
        }

        .dashboard-recent-date {
          color: #94a3b8;
          font-size: 10px;
          text-align: right;
        }

        .dashboard-view-all {
          color: #2563eb;
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
        }

        .dashboard-view-all:hover {
          text-decoration: underline;
        }

        .dashboard-no-data {
          margin: 14px 20px 20px;
          padding: 25px 16px;
          border: 1px dashed #d6dee9;
          border-radius: 10px;
          background: #f8fafc;
          color: #94a3b8;
          text-align: center;
          font-size: 12px;
        }

        @media (max-width: 1050px) {
          .dashboard-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .dashboard-chart-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .dashboard-page {
            padding-bottom: 30px;
          }

          .dashboard-summary-grid,
          .dashboard-mini-grid,
          .dashboard-attention-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-bar-row {
            grid-template-columns: 120px 1fr 16px;
          }

          .dashboard-priority-content {
            grid-template-columns: 1fr;
          }

          .dashboard-engineer-row {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .dashboard-recent-row {
            grid-template-columns: 1fr 90px;
          }

          .dashboard-recent-date {
            text-align: left;
          }
        }
      `}</style>


      {/* ======================================================
          HEADER
      ======================================================= */}

      <div
        className="dashboard-header"
      >

        <div>

          <h1>
            Dashboard
          </h1>

          <p>
            ServiOps service operations overview
          </p>

        </div>

      </div>


      {/* ======================================================
          SUMMARY CARDS
      ======================================================= */}

      <div
        className="dashboard-summary-grid"
      >

        <Link
          to="/customers"
          className="dashboard-summary-card dashboard-summary-clickable"
          title="Open Customers"
        >

          <div
            className="dashboard-card-icon"
          >
            👥
          </div>


          <div>

            <span>
              Active Customers
            </span>

            <strong>
              {customers}
            </strong>

            <small
              className="dashboard-card-action"
            >
              View customers →
            </small>

          </div>

        </Link>


        <Link
          to="/plants"
          className="dashboard-summary-card dashboard-summary-clickable"
          title="Open Plants"
        >

          <div
            className="dashboard-card-icon"
          >
            🏭
          </div>


          <div>

            <span>
              Active Plants
            </span>

            <strong>
              {plants}
            </strong>

            <small
              className="dashboard-card-action"
            >
              View plants →
            </small>

          </div>

        </Link>


        <Link
          to="/machines"
          className="dashboard-summary-card dashboard-summary-clickable"
          title="Open Machines"
        >

          <div
            className="dashboard-card-icon"
          >
            ⚙
          </div>


          <div>

            <span>
              Active Machines
            </span>

            <strong>
              {machines}
            </strong>

            <small
              className="dashboard-card-action"
            >
              View machines →
            </small>

          </div>

        </Link>


        <Link
          to="/tickets"
          className="dashboard-summary-card dashboard-summary-primary dashboard-summary-clickable"
          title="Open Service Tickets"
        >

          <div
            className="dashboard-card-icon"
          >
            🎫
          </div>


          <div>

            <span>
              Total Service Tickets
            </span>

            <strong>
              {tickets.total ?? 0}
            </strong>

            <small
              className="dashboard-card-action"
            >
              View service tickets →
            </small>

          </div>

        </Link>

      </div>


      {/* ======================================================
          MY WORKLOAD
      ======================================================= */}

      {isEngineer && (

        <div
          className="dashboard-section dashboard-my-work"
        >

          <div
            className="dashboard-section-header"
          >

            <div>

              <h2>
                My Workload
              </h2>

              <p>
                Tickets currently assigned to you
              </p>

            </div>


            <div
              className="dashboard-section-number"
            >
              {myTickets.total ?? 0}
            </div>

          </div>


          <div
            className="dashboard-mini-grid"
          >

            <Link
              to="/tickets?status=OPEN&assigned_to=me"
              className="dashboard-mini-card dashboard-clickable-card"
            >

              <span>
                Open
              </span>

              <strong>
                {myTickets.open ?? 0}
              </strong>

            </Link>


            <Link
              to="/tickets?status=IN_PROGRESS&assigned_to=me"
              className="dashboard-mini-card dashboard-clickable-card"
            >

              <span>
                In Progress
              </span>

              <strong>
                {myTickets.in_progress ?? 0}
              </strong>

            </Link>


            <Link
              to="/tickets?status=CLOSE_REQUESTED&assigned_to=me"
              className="dashboard-mini-card dashboard-mini-warning dashboard-clickable-card"
            >

              <span>
                Closure Review
              </span>

              <strong>
                {myTickets.close_requested ?? 0}
              </strong>

            </Link>


            <Link
              to="/tickets?aging=over_3_days&assigned_to=me"
              className="dashboard-mini-card dashboard-mini-danger dashboard-clickable-card"
            >

              <span>
                Overdue
              </span>

              <strong>
                {myOverdueTickets}
              </strong>

            </Link>

          </div>

        </div>

      )}


      {/* ======================================================
          NEEDS ATTENTION
      ======================================================= */}

      <div
        className="dashboard-section dashboard-needs-attention"
      >

        <div
          className="dashboard-section-header"
        >

          <div>

            <h2>
              Needs Attention
            </h2>

            <p>
              Items that may require immediate action
            </p>

          </div>

        </div>


        <div
          className="dashboard-attention-grid"
        >

          <Link
            to="/tickets?status=CLOSE_REQUESTED"
            className="dashboard-attention-card dashboard-clickable-card"
          >

            <div
              className="dashboard-attention-icon dashboard-attention-review"
            >
              !
            </div>


            <div
              className="dashboard-attention-content"
            >

              <span>
                Pending Closure Review
              </span>

              <strong>
                {tickets.close_requested ?? 0}
              </strong>

              <p>
                Tickets waiting for manager review
              </p>

            </div>


            <span
              className="dashboard-attention-arrow"
            >
              →
            </span>

          </Link>


          <Link
            to="/tickets?priority=HIGH&active=true"
            className="dashboard-attention-card dashboard-clickable-card"
          >

            <div
              className="dashboard-attention-icon dashboard-attention-high"
            >
              !
            </div>


            <div
              className="dashboard-attention-content"
            >

              <span>
                High Priority Active
              </span>

              <strong>
                {tickets.high_priority_active ?? 0}
              </strong>

              <p>
                High priority tickets requiring attention
              </p>

            </div>


            <span
              className="dashboard-attention-arrow"
            >
              →
            </span>

          </Link>


          <Link
            to="/tickets?aging=over_3_days"
            className="dashboard-attention-card dashboard-clickable-card"
          >

            <div
              className="dashboard-attention-icon dashboard-attention-overdue-icon"
            >
              !
            </div>


            <div
              className="dashboard-attention-content"
            >

              <span>
                Overdue Tickets
              </span>

              <strong>
                {overdueTickets}
              </strong>

              <p>
                Active tickets open for more than 3 days
              </p>

            </div>


            <span
              className="dashboard-attention-arrow"
            >
              →
            </span>

          </Link>

        </div>

      </div>


      {/* ======================================================
          TREND + AGING
      ======================================================= */}

      <div
        className="dashboard-chart-grid"
      >

        <div
          className="dashboard-section"
        >

          <div
            className="dashboard-section-header"
          >

            <div>

              <h2>
                Ticket Activity
              </h2>

              <p>
                Tickets created and closed over the last 30 days
              </p>

            </div>


            <span
              className="dashboard-total-badge"
            >
              30 days
            </span>

          </div>


          <div
            className="dashboard-trend"
          >

            <div
              className="dashboard-trend-legend"
            >

              <span>

                <i
                  className="dashboard-trend-created"
                />

                Created

              </span>


              <span>

                <i
                  className="dashboard-trend-closed"
                />

                Closed

              </span>

            </div>


            <div
              className="dashboard-trend-chart"
            >

              {ticketTrend.map(
                item => {

                  const created =
                    Number(
                      item.created ||
                      0
                    );


                  const closed =
                    Number(
                      item.closed ||
                      0
                    );


                  const createdHeight =
                    created === 0
                      ? 3
                      : Math.max(
                          6,
                          (
                            created /
                            trendMax
                          ) *
                          100
                        );


                  const closedHeight =
                    closed === 0
                      ? 3
                      : Math.max(
                          6,
                          (
                            closed /
                            trendMax
                          ) *
                          100
                        );


                  return (

                    <div
                      className="dashboard-trend-day"
                      key={
                        item.date
                      }
                      title={
                        `${formatShortDate(
                          item.date
                        )} — Created: ${created}, Closed: ${closed}`
                      }
                    >

                      <div
                        className="dashboard-trend-bars"
                      >

                        <div
                          className="dashboard-trend-bar dashboard-trend-created"
                          style={{
                            height:
                              `${createdHeight}%`,
                          }}
                        />


                        <div
                          className="dashboard-trend-bar dashboard-trend-closed"
                          style={{
                            height:
                              `${closedHeight}%`,
                          }}
                        />

                      </div>

                    </div>

                  );

                }
              )}

            </div>


            <div
              className="dashboard-trend-dates"
            >

              <span>
                {ticketTrend.length
                  ? formatShortDate(
                      ticketTrend[0].date
                    )
                  : ""}
              </span>


              <span>
                {ticketTrend.length
                  ? formatShortDate(
                      ticketTrend[
                        ticketTrend.length - 1
                      ].date
                    )
                  : ""}
              </span>

            </div>

          </div>

        </div>


        {/* ====================================================
            TICKET AGING
        ===================================================== */}

        <div
          className="dashboard-section"
        >

          <div
            className="dashboard-section-header"
          >

            <div>

              <h2>
                Ticket Aging
              </h2>

              <p>
                Click an age group to view matching tickets
              </p>

            </div>

          </div>


          <div
            className="dashboard-aging"
          >

            <Link
              to="/tickets?aging=under_1_day"
              className="dashboard-aging-card dashboard-clickable-card"
              title="View tickets under 1 day old"
            >

              <div
                className="dashboard-aging-number"
              >
                {ticketAging.under_1_day ?? 0}
              </div>


              <div>

                <strong>
                  Under 1 day
                </strong>

                <span>
                  Recently created
                </span>

              </div>


              <span
                className="dashboard-filter-arrow"
              >
                →
              </span>

            </Link>


            <Link
              to="/tickets?aging=one_to_three_days"
              className="dashboard-aging-card dashboard-clickable-card"
              title="View tickets 1 to 3 days old"
            >

              <div
                className="dashboard-aging-number"
              >
                {ticketAging.one_to_three_days ?? 0}
              </div>


              <div>

                <strong>
                  1–3 days
                </strong>

                <span>
                  Needs monitoring
                </span>

              </div>


              <span
                className="dashboard-filter-arrow"
              >
                →
              </span>

            </Link>


            <Link
              to="/tickets?aging=over_3_days"
              className="dashboard-aging-card dashboard-aging-warning dashboard-clickable-card"
              title="View overdue tickets"
            >

              <div
                className="dashboard-aging-number"
              >
                {ticketAging.over_3_days ?? 0}
              </div>


              <div>

                <strong>
                  Over 3 days
                </strong>

                <span>
                  Needs attention
                </span>

              </div>


              <span
                className="dashboard-filter-arrow"
              >
                →
              </span>

            </Link>

          </div>

        </div>

      </div>


      {/* ======================================================
          STATUS + PRIORITY
      ======================================================= */}

      <div
        className="dashboard-chart-grid"
      >

        {/* STATUS */}

        <div
          className="dashboard-section"
        >

          <div
            className="dashboard-section-header"
          >

            <div>

              <h2>
                Ticket Status
              </h2>

              <p>
                Click a status to view matching tickets
              </p>

            </div>


            <span
              className="dashboard-total-badge"
            >
              {tickets.total ?? 0} total
            </span>

          </div>


          <div
            className="dashboard-bars"
          >

            {statusDistribution.length === 0 ? (

              <div
                className="dashboard-no-data"
              >
                No ticket data available.
              </div>

            ) : (

              statusDistribution.map(
                item => (

                  <a
                    key={
                      item.status
                    }
                    to={
                      `/tickets?status=${encodeURIComponent(
                        item.status
                      )}`
                    }
                    className="dashboard-bar-row dashboard-ticket-filter-link"
                    title={
                      `View ${formatStatus(
                        item.status
                      )} tickets`
                    }
                  >

                    <div
                      className="dashboard-bar-label"
                    >

                      <span>
                        {formatStatus(
                          item.status
                        )}
                      </span>

                      <strong>
                        {item.count}
                      </strong>

                    </div>


                    <div
                      className="dashboard-bar-track"
                    >

                      <div
                        className={
                          `dashboard-bar-fill ${getStatusClass(
                            item.status
                          )}`
                        }
                        style={{
                          width:
                            `${getStatusWidth(
                              item.count
                            )}%`,
                        }}
                      />

                    </div>


                    <span
                      className="dashboard-filter-arrow"
                    >
                      →
                    </span>

                  </a>

                )

              )

            )}

          </div>

        </div>


        {/* PRIORITY */}

        <div
          className="dashboard-section"
        >

          <div
            className="dashboard-section-header"
          >

            <div>

              <h2>
                Ticket Priority
              </h2>

              <p>
                Click a priority to view matching tickets
              </p>

            </div>

          </div>


          <div
            className="dashboard-priority-content"
          >

            <div
              className="dashboard-pie"
              style={{
                background:
                  priorityPieBackground,
              }}
            >

              <div
                className="dashboard-pie-inner"
              >

                <strong>
                  {priorityTotal}
                </strong>

                <span>
                  Tickets
                </span>

              </div>

            </div>


            <div
              className="dashboard-legend"
            >

              <Link
                to="/tickets?priority=LOW"
                className="dashboard-legend-item dashboard-priority-link"
              >

                <span
                  className="dashboard-dot dashboard-dot-low"
                />

                <div>

                  <span>
                    Low
                  </span>

                  <strong>
                    {priority.low ?? 0}
                  </strong>

                </div>


                <span
                  className="dashboard-filter-arrow"
                >
                  →
                </span>

              </Link>


              <Link
                to="/tickets?priority=MEDIUM"
                className="dashboard-legend-item dashboard-priority-link"
              >

                <span
                  className="dashboard-dot dashboard-dot-medium"
                />

                <div>

                  <span>
                    Medium
                  </span>

                  <strong>
                    {priority.medium ?? 0}
                  </strong>

                </div>


                <span
                  className="dashboard-filter-arrow"
                >
                  →
                </span>

              </Link>


              <Link
                to="/tickets?priority=HIGH"
                className="dashboard-legend-item dashboard-priority-link"
              >

                <span
                  className="dashboard-dot dashboard-dot-high"
                />

                <div>

                  <span>
                    High
                  </span>

                  <strong>
                    {priority.high ?? 0}
                  </strong>

                </div>


                <span
                  className="dashboard-filter-arrow"
                >
                  →
                </span>

              </Link>


              {criticalPriority > 0 && (

                <Link
                  to="/tickets?priority=CRITICAL"
                  className="dashboard-legend-item dashboard-priority-link"
                >

                  <span
                    className="dashboard-dot dashboard-dot-critical"
                  />

                  <div>

                    <span>
                      Critical
                    </span>

                    <strong>
                      {criticalPriority}
                    </strong>

                  </div>


                  <span
                    className="dashboard-filter-arrow"
                  >
                    →
                  </span>

                </Link>

              )}

            </div>

          </div>

        </div>

      </div>


      {/* ======================================================
          ENGINEER WORKLOAD
      ======================================================= */}

      {!isEngineer && (

        <div
          className="dashboard-section"
        >

          <div
            className="dashboard-section-header"
          >

            <div>

              <h2>
                Engineer Workload
              </h2>

              <p>
                Click an engineer to view their active tickets
              </p>

            </div>

          </div>


          {engineerWorkload.length === 0 ? (

            <div
              className="dashboard-no-data"
            >
              No active service engineers found.
            </div>

          ) : (

            <div
              className="dashboard-engineer-list"
            >

              {engineerWorkload.map(
                engineer => {

                  const count =
                    Number(
                      engineer?.count ||
                      0
                    );


                  const width =
                    count === 0
                      ? 0
                      : Math.max(
                          6,
                          (
                            count /
                            maxEngineerTickets
                          ) *
                          100
                        );


                  return (

                    <Link
                      to={
                        `/tickets?assigned_to=${encodeURIComponent(
                          engineer.id
                        )}`
                      }
                      className="dashboard-engineer-row dashboard-clickable-row"
                      key={
                        engineer.id
                      }
                      title={
                        `View tickets assigned to ${engineer.name}`
                      }
                    >

                      <div
                        className="dashboard-engineer-info"
                      >

                        <div
                          className="dashboard-engineer-avatar"
                        >

                          {
                            engineer.name
                              ?.charAt(0)
                              ?.toUpperCase() ||
                            "?"
                          }

                        </div>


                        <div>

                          <strong>
                            {engineer.name}
                          </strong>

                          <span>
                            {engineer.employee_code}
                          </span>

                        </div>

                      </div>


                      <div
                        className="dashboard-engineer-progress"
                      >

                        <div
                          className="dashboard-engineer-track"
                        >

                          <div
                            className="dashboard-engineer-fill"
                            style={{
                              width:
                                `${width}%`,
                            }}
                          />

                        </div>


                        <strong>
                          {count}
                        </strong>


                        <span
                          className="dashboard-filter-arrow"
                        >
                          →
                        </span>

                      </div>

                    </Link>

                  );

                }
              )}

            </div>

          )}

        </div>

      )}


      {/* ======================================================
          RECENT TICKETS
      ======================================================= */}

      <div
        className="dashboard-section"
      >

        <div
          className="dashboard-section-header"
        >

          <div>

            <h2>
              Recent Tickets
            </h2>

            <p>
              Latest service tickets created in ServiOps
            </p>

          </div>


          <Link
            to="/tickets"
            className="dashboard-view-all"
          >
            View all tickets →
          </Link>

        </div>


        {recentTickets.length === 0 ? (

          <div
            className="dashboard-no-data"
          >
            No tickets found.
          </div>

        ) : (

          <div
            className="dashboard-recent-list"
          >

            {recentTickets.map(
              ticket => (

                <Link
                  to={
                    `/tickets/${ticket.id}`
                  }
                  className="dashboard-recent-row dashboard-clickable-row"
                  key={
                    ticket.id
                  }
                >

                  <div
                    className="dashboard-recent-ticket"
                  >

                    <strong>
                      {ticket.ticket_number}
                    </strong>

                    <span>
                      {ticket.title}
                    </span>

                  </div>


                  <span
                    className={
                      `dashboard-priority-badge ${getPriorityClass(
                        ticket.priority
                      )}`
                    }
                  >
                    {ticket.priority}
                  </span>


                  <span
                    className={
                      `dashboard-status-badge ${getStatusClass(
                        ticket.status
                      )}`
                    }
                  >
                    {formatStatus(
                      ticket.status
                    )}
                  </span>


                  <span
                    className="dashboard-recent-date"
                  >
                    {formatDate(
                      ticket.created_at
                    )}
                  </span>

                </Link>

              )
            )}

          </div>

        )}

      </div>


    </div>

  );

}


export default Dashboard;


