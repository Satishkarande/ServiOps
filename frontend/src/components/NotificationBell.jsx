import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";


function NotificationBell() {

  const navigate =
    useNavigate();


  const [
    notifications,
    setNotifications,
  ] = useState([]);


  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);


  const [
    open,
    setOpen,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    markingAllRead,
    setMarkingAllRead,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const dropdownRef =
    useRef(null);


  // ============================================================
  // LOAD NOTIFICATIONS
  // ============================================================

  const loadNotifications =
    async (
      showLoading = true
    ) => {

      try {

        if (showLoading) {
          setLoading(true);
        }


        setError("");


        const [
          notificationData,
          unreadData,
        ] = await Promise.all([

          getNotifications(),

          getUnreadNotificationCount(),

        ]);


        setNotifications(

          Array.isArray(
            notificationData
          )
            ? notificationData
            : []

        );


        setUnreadCount(

          Number(
            unreadData?.count || 0
          )

        );


      } catch (error) {

        console.error(
          "Failed to load notifications:",
          error
        );


        setError(

          error?.message ||
          "Unable to load notifications."

        );

      } finally {

        if (showLoading) {
          setLoading(false);
        }

      }

    };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    loadNotifications();

  }, []);


  // ============================================================
  // AUTO REFRESH
  // ============================================================

  useEffect(() => {

    const interval =
      setInterval(
        () => {

          loadNotifications(
            false
          );

        },
        30000
      );


    return () => {

      clearInterval(
        interval
      );

    };

  }, []);


  // ============================================================
  // CLOSE WHEN CLICKING OUTSIDE
  // ============================================================

  useEffect(() => {

    const handleClickOutside =
      event => {

        if (

          dropdownRef.current &&

          !dropdownRef.current.contains(
            event.target
          )

        ) {

          setOpen(false);

        }

      };


    document.addEventListener(
      "mousedown",
      handleClickOutside
    );


    return () => {

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

    };

  }, []);


  // ============================================================
  // ESCAPE KEY
  // ============================================================

  useEffect(() => {

    const handleEscape =
      event => {

        if (
          event.key ===
          "Escape"
        ) {

          setOpen(false);

        }

      };


    document.addEventListener(
      "keydown",
      handleEscape
    );


    return () => {

      document.removeEventListener(
        "keydown",
        handleEscape
      );

    };

  }, []);


  // ============================================================
  // GET TICKET NUMBER
  // ============================================================

  const getTicketNumber =
    notification => {

      if (
        notification?.ticket_number
      ) {

        return String(
          notification.ticket_number
        ).toUpperCase();

      }


      const message =
        notification?.message ||
        "";


      const match =
        message.match(
          /TKT-[A-Z0-9-]+/i
        );


      if (match) {

        return match[0]
          .toUpperCase();

      }


      return "";

    };


  // ============================================================
  // NOTIFICATION CONFIGURATION
  // ============================================================

  const getNotificationConfig =
    notification => {

      const type =
        String(
          notification?.type ||
          ""
        ).toUpperCase();


      switch (type) {

        case "TICKET_ASSIGNED":

          return {
            icon: "↗",
            label: "Ticket Assigned",
            description:
              "A service ticket has been assigned to you.",
            className:
              "notification-type-assigned",
          };


        case "TICKET_REASSIGNED":

          return {
            icon: "↔",
            label: "Ticket Reassigned",
            description:
              "This ticket has been reassigned.",
            className:
              "notification-type-reassigned",
          };


        case "CLOSE_REQUEST":

        case "CLOSE_REQUESTED":

          return {
            icon: "!",
            label: "Closure Review Required",
            description:
              "A service engineer has requested ticket closure.",
            className:
              "notification-type-close-request",
          };


        case "CLOSE_DENIED":

        case "CLOSURE_DENIED":

        case "TICKET_CLOSE_DENIED":

          return {
            icon: "×",
            label: "Closure Request Denied",
            description:
              "The manager has denied the closure request.",
            className:
              "notification-type-denied",
          };


        case "TICKET_RESOLVED":

          return {
            icon: "✓",
            label: "Ticket Resolved",
            description:
              "The service ticket has been resolved.",
            className:
              "notification-type-resolved",
          };


        case "TICKET_CLOSED":

          return {
            icon: "✓",
            label: "Ticket Closed",
            description:
              "The service ticket has been closed.",
            className:
              "notification-type-closed",
          };


        case "TICKET_REOPENED":

        case "TICKET_REOPEN":

          return {
            icon: "↻",
            label: "Ticket Reopened",
            description:
              "The service ticket has been reopened.",
            className:
              "notification-type-reopened",
          };


        case "TICKET_CANCELLED":

        case "TICKET_CANCELED":

          return {
            icon: "×",
            label: "Ticket Cancelled",
            description:
              "The service ticket has been cancelled.",
            className:
              "notification-type-cancelled",
          };


        case "TICKET_COMMENT":

          return {
            icon: "C",
            label: "New Ticket Comment",
            description:
              "Someone added a comment to a service ticket.",
            className:
              "notification-type-comment",
          };


        case "TICKET_MENTION":

          return {
            icon: "@",
            label: "You Were Mentioned",
            description:
              "You were mentioned in a ticket comment.",
            className:
              "notification-type-mention",
          };


        default:

          return {
            icon: "•",
            label:
              notification?.title ||
              "Notification",
            description:
              notification?.message ||
              "",
            className:
              "notification-type-default",
          };

      }

    };


  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatNotificationTime =
    createdAt => {

      if (!createdAt) {
        return "";
      }


      let timestamp =
        String(createdAt).trim();

      // Backend timestamps are stored in UTC without a timezone suffix.
      // Explicitly mark timezone-less ISO timestamps as UTC.
      if (
        !timestamp.endsWith("Z") &&
        !/[+-]\\d{2}:?\\d{2}$/.test(timestamp)
      ) {
        timestamp += "Z";
      }

      const date =
        new Date(
          timestamp
        );


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {

        return "";

      }


      const now =
        new Date();


      const difference =
        now.getTime() -
        date.getTime();


      const seconds =
        Math.floor(
          difference / 1000
        );


      if (seconds < 60) {
        return "Just now";
      }


      const minutes =
        Math.floor(
          seconds / 60
        );


      if (minutes < 60) {
        return `${minutes}m ago`;
      }


      const hours =
        Math.floor(
          minutes / 60
        );


      if (hours < 24) {
        return `${hours}h ago`;
      }


      const days =
        Math.floor(
          hours / 24
        );


      if (days < 7) {
        return `${days}d ago`;
      }


      return date.toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",

          year:
            date.getFullYear() !==
            now.getFullYear()
              ? "numeric"
              : undefined,
        }
      );

    };


  // ============================================================
  // MARK ONE AS READ
  // ============================================================

  const markOneAsRead =
    async notification => {

      if (
        notification.is_read
      ) {
        return;
      }


      try {

        await markNotificationAsRead(
          notification.id
        );


        setNotifications(
          previous =>
            previous.map(
              item =>

                item.id ===
                notification.id

                  ? {
                      ...item,
                      is_read: true,
                    }

                  : item
            )
        );


        setUnreadCount(
          count =>
            Math.max(
              0,
              count - 1
            )
        );


      } catch (error) {

        console.error(
          "Failed to mark notification as read:",
          error
        );

      }

    };


  // ============================================================
  // CLICK NOTIFICATION
  // ============================================================

  const handleNotificationClick =
    async notification => {

      await markOneAsRead(
        notification
      );


      setOpen(false);


      if (
        notification.ticket_id
      ) {

        navigate(
          `/tickets/${notification.ticket_id}`
        );

      }

    };


  // ============================================================
  // MARK ALL READ
  // ============================================================

  const handleMarkAllRead =
    async () => {

      if (
        unreadCount === 0
      ) {
        return;
      }


      try {

        setMarkingAllRead(
          true
        );


        await markAllNotificationsAsRead();


        setNotifications(
          previous =>
            previous.map(
              notification => ({
                ...notification,
                is_read: true,
              })
            )
        );


        setUnreadCount(0);


      } catch (error) {

        console.error(
          "Failed to mark all notifications as read:",
          error
        );


        setError(
          error?.message ||
          "Unable to mark notifications as read."
        );

      } finally {

        setMarkingAllRead(
          false
        );

      }

    };


  // ============================================================
  // TOGGLE
  // ============================================================

  const toggleNotifications =
    () => {

      setOpen(
        previous =>
          !previous
      );

    };


  // ============================================================
  // RENDER
  // ============================================================

  return (


    <div
      ref={dropdownRef}
      className="notification-center"
    >

      <style>{`
        .notification-center {
          position: relative;
        }

        .notification-bell-button {
          position: relative;
          width: 38px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          border-radius: 9px;
          background: transparent;
          color: #cbd5e1;
          cursor: pointer;
          transition: background .18s ease, border-color .18s ease, color .18s ease;
        }

        .notification-bell-button:hover,
        .notification-bell-active {
          background: rgba(255,255,255,.08) !important;
          border-color: rgba(255,255,255,.12) !important;
          color: #ffffff !important;
        }

        .notification-bell-icon {
          width: 19px;
          height: 19px;
          display: inline-flex;
        }

        .notification-bell-icon svg {
          width: 100%;
          height: 100%;
        }

        .notification-unread-badge {
          position: absolute;
          top: -2px;
          right: -3px;
          min-width: 17px;
          height: 17px;
          padding: 0 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          border: 2px solid #1e293b;
          border-radius: 999px;
          background: #ef4444 !important;
          color: #ffffff !important;
          font-size: 8px;
          font-weight: 800;
          line-height: 1;
        }

        .notification-dropdown {
          position: absolute !important;
          top: calc(100% + 10px) !important;
          right: 0 !important;
          width: 390px !important;
          max-width: min(390px, calc(100vw - 24px)) !important;
          max-height: min(650px, calc(100vh - 78px)) !important;
          overflow: hidden !important;
          box-sizing: border-box;
          border: 1px solid #dbe4ef !important;
          border-radius: 14px !important;
          background: #ffffff !important;
          box-shadow: 0 18px 45px rgba(15,23,42,.18), 0 3px 10px rgba(15,23,42,.07) !important;
          color: #0f172a;
          z-index: 10000 !important;
        }

        .notification-header {
          display: flex !important;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 15px 16px !important;
          border-bottom: 1px solid #e8edf3 !important;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%) !important;
        }

        .notification-header-title {
          display: flex !important;
          align-items: center;
          gap: 10px;
        }

        .notification-header-icon {
          width: 36px !important;
          height: 36px !important;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          border: 1px solid #dbe7f5 !important;
          border-radius: 10px !important;
          background: #eff6ff !important;
          color: #2563eb !important;
          font-size: 10px !important;
          font-weight: 900 !important;
          letter-spacing: .04em;
        }

        .notification-header h3 {
          margin: 0 !important;
          color: #0f172a !important;
          font-size: 15px !important;
          font-weight: 800 !important;
        }

        .notification-header p {
          margin: 3px 0 0 !important;
          color: #94a3b8 !important;
          font-size: 10px !important;
        }

        .notification-refresh-button {
          width: 31px !important;
          height: 31px !important;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          border: 1px solid #dbe4ef !important;
          border-radius: 8px !important;
          background: #ffffff !important;
          color: #64748b !important;
          cursor: pointer;
          transition: background .18s ease, color .18s ease, transform .18s ease;
        }

        .notification-refresh-button:hover:not(:disabled) {
          background: #f1f5f9 !important;
          color: #2563eb !important;
          transform: rotate(-12deg);
        }

        .notification-action-bar {
          display: flex !important;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 14px !important;
          border-bottom: 1px solid #e8edf3 !important;
          background: #f8fafc !important;
        }

        .notification-action-bar span {
          color: #64748b !important;
          font-size: 10px !important;
          font-weight: 700 !important;
        }

        .notification-action-bar button {
          padding: 5px 8px !important;
          border: 0 !important;
          border-radius: 6px !important;
          background: transparent !important;
          color: #2563eb !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          cursor: pointer;
        }

        .notification-action-bar button:hover:not(:disabled) {
          background: #eaf2ff !important;
        }

        .notification-list {
          max-height: 500px !important;
          overflow-y: auto !important;
          overscroll-behavior: contain;
        }

        .notification-list::-webkit-scrollbar {
          width: 7px;
        }

        .notification-list::-webkit-scrollbar-track {
          background: #f8fafc;
        }

        .notification-list::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: #cbd5e1;
        }

        .notification-list::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .notification-item {
          width: 100% !important;
          display: grid !important;
          grid-template-columns: 40px minmax(0, 1fr) !important;
          gap: 12px !important;
          box-sizing: border-box;
          padding: 14px 15px !important;
          border: 0 !important;
          border-bottom: 1px solid #edf2f7 !important;
          border-radius: 0 !important;
          background: #ffffff !important;
          color: #0f172a !important;
          text-align: left !important;
          cursor: pointer;
          transition: background .16s ease;
        }

        .notification-item:hover {
          background: #f8fbff !important;
        }

        .notification-item-unread {
          background: #f7faff !important;
        }

        .notification-item-unread:hover {
          background: #f0f6ff !important;
        }

        .notification-item-icon {
          width: 38px !important;
          height: 38px !important;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          border-radius: 10px !important;
          font-size: 13px !important;
          font-weight: 900 !important;
        }

        .notification-type-assigned {
          border: 1px solid #cfe0ff !important;
          background: #edf4ff !important;
          color: #2563eb !important;
        }

        .notification-type-reassigned,
        .notification-type-reopened {
          border: 1px solid #dbe4ef !important;
          background: #f1f5f9 !important;
          color: #475569 !important;
        }

        .notification-type-close-request {
          border: 1px solid #fed7aa !important;
          background: #fff7ed !important;
          color: #ea580c !important;
        }

        .notification-type-denied,
        .notification-type-cancelled {
          border: 1px solid #fecdd3 !important;
          background: #fff1f2 !important;
          color: #dc2626 !important;
        }

        .notification-type-resolved,
        .notification-type-closed {
          border: 1px solid #bbf7d0 !important;
          background: #f0fdf4 !important;
          color: #15803d !important;
        }

        .notification-type-mention {
          border: 1px solid #ddd6fe !important;
          background: #f5f3ff !important;
          color: #6d28d9 !important;
        }

        .notification-type-default {
          border: 1px solid #dbe4ef !important;
          background: #f8fafc !important;
          color: #475569 !important;
        }

        .notification-item-content {
          min-width: 0;
        }

        .notification-item-top {
          display: flex !important;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .notification-item-top strong {
          overflow: hidden;
          color: #1e293b !important;
          font-size: 12px !important;
          font-weight: 800 !important;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .notification-new-dot {
          width: 7px !important;
          height: 7px !important;
          flex: 0 0 7px;
          border-radius: 50%;
          background: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,.10);
        }

        .notification-item-message {
          margin: 5px 0 8px !important;
          color: #64748b !important;
          font-size: 10px !important;
          line-height: 1.45 !important;
        }

        .notification-item-meta {
          display: flex !important;
          align-items: center;
          gap: 7px;
          min-height: 18px;
        }

        .notification-ticket-number {
          display: inline-flex !important;
          align-items: center;
          padding: 3px 6px !important;
          border-radius: 5px !important;
          background: #f1f5f9 !important;
          color: #475569 !important;
          font-size: 9px !important;
          font-weight: 800 !important;
        }

        .notification-time {
          margin-left: auto;
          color: #94a3b8 !important;
          font-size: 9px !important;
          white-space: nowrap;
        }

        .notification-view-ticket {
          display: inline-flex !important;
          align-items: center;
          gap: 5px;
          margin-top: 5px;
          color: #2563eb !important;
          font-size: 10px !important;
          font-weight: 800 !important;
        }

        .notification-view-ticket span {
          transition: transform .16s ease;
        }

        .notification-item:hover .notification-view-ticket span {
          transform: translateX(2px);
        }

        .notification-empty,
        .notification-loading {
          padding: 38px 22px !important;
          text-align: center;
        }

        .notification-empty-icon {
          width: 42px !important;
          height: 42px !important;
          margin: 0 auto 10px;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          border-radius: 12px !important;
          background: #ecfdf5 !important;
          color: #16a34a !important;
          font-weight: 900;
        }

        .notification-empty strong {
          display: block;
          color: #334155 !important;
          font-size: 13px !important;
        }

        .notification-empty p {
          margin: 5px 0 0 !important;
          color: #94a3b8 !important;
          font-size: 10px !important;
        }

        .notification-error {
          display: flex !important;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin: 10px 12px !important;
          padding: 9px 10px !important;
          border: 1px solid #fecaca !important;
          border-radius: 8px !important;
          background: #fff7f7 !important;
          color: #b91c1c !important;
          font-size: 10px !important;
        }

        .notification-error button {
          padding: 5px 8px !important;
          border: 0 !important;
          border-radius: 5px !important;
          background: #fee2e2 !important;
          color: #b91c1c !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          cursor: pointer;
        }

        @media (max-width: 520px) {
          .notification-dropdown {
            position: fixed !important;
            top: 58px !important;
            right: 12px !important;
            width: calc(100vw - 24px) !important;
            max-width: none !important;
          }
        }
      `}</style>



      {/* ======================================================
          BELL
      ======================================================= */}

      <button
        type="button"
        className={
          `notification-bell-button ${
            open
              ? "notification-bell-active"
              : ""
          }`
        }
        onClick={
          toggleNotifications
        }
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={open}
      >

        <span
          className="notification-bell-icon"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >

            <path
              d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
            />

            <path
              d="M13.73 21a2 2 0 0 1-3.46 0"
            />

          </svg>
        </span>


        {unreadCount > 0 && (

          <span
            className="notification-unread-badge"
          >

            {unreadCount > 99
              ? "99+"
              : unreadCount}

          </span>

        )}

      </button>


      {/* ======================================================
          DROPDOWN
      ======================================================= */}

      {open && (

        <div
          className="notification-dropdown"
          role="dialog"
          aria-label="Notifications"
        >


          {/* ==================================================
              HEADER
          =================================================== */}

          <div
            className="notification-header"
          >

            <div>

              <div className="notification-header-title">

                <span className="notification-header-icon">
                  NT
                </span>

                <div>

                  <h3>
                    Notifications
                  </h3>

                  <p>

                    {unreadCount > 0

                      ? `${unreadCount} unread notification${
                          unreadCount === 1
                            ? ""
                            : "s"
                        }`

                      : "You're all caught up"}

                  </p>

                </div>

              </div>

            </div>


            <button
              type="button"
              className="notification-refresh-button"
              onClick={() =>
                loadNotifications()
              }
              disabled={loading}
              title="Refresh notifications"
              aria-label="Refresh notifications"
            >

              <span
                className={
                  loading
                    ? "notification-refresh-spinning"
                    : ""
                }
              >
                ↻
              </span>

            </button>

          </div>


          {/* ==================================================
              ACTION BAR
          =================================================== */}

          {unreadCount > 0 && (

            <div
              className="notification-action-bar"
            >

              <span>
                New activity
              </span>


              <button
                type="button"
                onClick={
                  handleMarkAllRead
                }
                disabled={
                  markingAllRead
                }
              >

                {markingAllRead
                  ? "Marking..."
                  : "Mark all as read"}

              </button>

            </div>

          )}


          {/* ==================================================
              ERROR
          =================================================== */}

          {error && (

            <div
              className="notification-error"
            >

              <span>
                {error}
              </span>


              <button
                type="button"
                onClick={() => {

                  setError("");

                  loadNotifications();

                }}
              >
                Retry
              </button>

            </div>

          )}


          {/* ==================================================
              LOADING
          =================================================== */}

          {loading && (

            <div
              className="notification-loading"
            >

              <div
                className="notification-loading-spinner"
              />


              <span>
                Loading notifications...
              </span>

            </div>

          )}


          {/* ==================================================
              EMPTY
          =================================================== */}

          {!loading &&
            notifications.length ===
              0 && (

            <div
              className="notification-empty"
            >

              <div
                className="notification-empty-icon"
              >
                ✓
              </div>


              <strong>
                You're all caught up
              </strong>


              <p>
                There are no new notifications right now.
              </p>

            </div>

          )}


          {/* ==================================================
              LIST
          =================================================== */}

          {!loading &&
            notifications.length > 0 && (

            <div
              className="notification-list"
            >

              {notifications.map(
                notification => {

                  const config =
                    getNotificationConfig(
                      notification
                    );


                  const unread =
                    !notification.is_read;


                  const ticketNumber =
                    getTicketNumber(
                      notification
                    );


                  return (

                    <button
                      key={
                        notification.id
                      }
                      type="button"
                      className={
                        `notification-item ${
                          unread
                            ? "notification-item-unread"
                            : "notification-item-read"
                        }`
                      }
                      onClick={() =>
                        handleNotificationClick(
                          notification
                        )
                      }
                    >


                      {/* =================================================
                          ICON
                      ================================================== */}

                      <div
                        className={
                          `notification-item-icon ${config.className}`
                        }
                      >

                        {
                          config.icon
                        }

                      </div>


                      {/* =================================================
                          CONTENT
                      ================================================== */}

                      <div
                        className="notification-item-content"
                      >

                        <div
                          className="notification-item-top"
                        >

                          <strong>

                            {
                              notification.title ||
                              config.label
                            }

                          </strong>


                          {unread && (

                            <span
                              className="notification-new-dot"
                              title="Unread"
                            />

                          )}

                        </div>


                        <p
                          className="notification-item-message"
                        >

                          {
                            notification.message ||
                            config.description
                          }

                        </p>


                        <div
                          className="notification-item-meta"
                        >

                          {ticketNumber && (

                            <span
                              className="notification-ticket-number"
                            >
                              {
                                ticketNumber
                              }
                            </span>

                          )}


                          <span
                            className="notification-time"
                          >
                            {
                              formatNotificationTime(
                                notification.created_at
                              )
                            }
                          </span>

                        </div>


                        {notification.ticket_id && (

                          <span
                            className="notification-view-ticket"
                          >
                            View ticket
                            <span>
                              →
                            </span>
                          </span>

                        )}

                      </div>

                    </button>

                  );

                }
              )}

            </div>

          )}

        </div>

      )}

    </div>

  );

}


export default NotificationBell;


