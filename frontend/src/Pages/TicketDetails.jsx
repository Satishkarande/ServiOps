import {
  useEffect,
  useRef,
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




function TicketDetails() {

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
  // STATE
  // ============================================================

  const [ticket, setTicket] =
    useState(null);

  const [history, setHistory] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [resolution, setResolution] =
    useState("");

  const [savingResolution, setSavingResolution] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [historyFilter, setHistoryFilter] =
    useState("ALL");


  // ============================================================
  // COMMENTS STATE
  // ============================================================

  const [comments, setComments] =
    useState([]);

  const [commentsLoading, setCommentsLoading] =
    useState(true);

  const [commentText, setCommentText] =
    useState("");

  const [commentSaving, setCommentSaving] =
    useState(false);

  const [commentError, setCommentError] =
    useState("");

  const [editingCommentId, setEditingCommentId] =
    useState(null);

  const [editingCommentText, setEditingCommentText] =
    useState("");

  const [commentEditSaving, setCommentEditSaving] =
    useState(false);

  const [commentFiles, setCommentFiles] =
    useState([]);

  const [attachmentLoadingId, setAttachmentLoadingId] =
    useState(null);


  // ============================================================
  // MENTIONS STATE
  // ============================================================

  const [mentionableUsers, setMentionableUsers] =
    useState([]);

  const [mentionSuggestions, setMentionSuggestions] =
    useState([]);

  const [mentionActive, setMentionActive] =
    useState(false);

  const [mentionStartIndex, setMentionStartIndex] =
    useState(-1);

  const [mentionSelectedIndex, setMentionSelectedIndex] =
    useState(0);

  const commentInputRef =
    useRef(null);

  const [mentionDropdownPosition, setMentionDropdownPosition] =
    useState({
      top: 0,
      left: 0,
      width: 0,
    });

  // Separate mention state for the comment editor. The add-comment
  // autocomplete must not control an existing comment's editor.
  const editingCommentInputRef = useRef(null);

  const [editMentionSuggestions, setEditMentionSuggestions] =
    useState([]);
  const [editMentionActive, setEditMentionActive] =
    useState(false);
  const [editMentionStartIndex, setEditMentionStartIndex] =
    useState(-1);
  const [editMentionSelectedIndex, setEditMentionSelectedIndex] =
    useState(0);


  // ============================================================
  // MENTION DROPDOWN POSITION
  // ============================================================

  useEffect(() => {
    if (!mentionActive) return undefined;

    const updateMentionDropdownPosition = () => {
      const input = commentInputRef.current;
      if (!input) return;

      const rect = input.getBoundingClientRect();

      setMentionDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    };

    updateMentionDropdownPosition();

    window.addEventListener("resize", updateMentionDropdownPosition);
    window.addEventListener("scroll", updateMentionDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateMentionDropdownPosition);
      window.removeEventListener("scroll", updateMentionDropdownPosition, true);
    };
  }, [mentionActive, mentionSuggestions.length]);


  // ============================================================
  // SPARE PARTS STATE
  // ============================================================

  const [sparePartsUsed, setSparePartsUsed] =
    useState([]);

  const [sparePartsLoading, setSparePartsLoading] =
    useState(true);

  const [sparePartFormOpen, setSparePartFormOpen] =
    useState(false);

  const [catalogParts, setCatalogParts] =
    useState([]);

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
          // Ignore parsing error.
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

      setResolution(
        data.resolution ||
        ""
      );

    };


  // ============================================================
  // LOAD HISTORY
  // ============================================================

  const fetchHistory =
    async () => {

      const data =
        await fetchJson(
          `${API_URL}/tickets/${ticketId}/history`
        );


      setHistory(
        Array.isArray(data)
          ? data
          : []
      );

    };


  // ============================================================
  // LOAD COMMENTS
  // ============================================================

  const fetchComments =
    async () => {

      setCommentsLoading(true);

      try {

        const data =
          await fetchJson(
            `${API_URL}/tickets/${ticketId}/comments`
          );

        setComments(
          Array.isArray(data)
            ? data
            : []
        );

        setCommentError("");

      } catch (requestError) {

        setCommentError(
          requestError.message
        );

      } finally {

        setCommentsLoading(false);

      }

    };


  // ============================================================
  // LOAD MENTIONABLE USERS
  // ============================================================

  const fetchMentionableUsers =
    async () => {

      try {
        const data = await fetchJson(
          `${API_URL}/users/mentionable`
        );

        setMentionableUsers(
          Array.isArray(data) ? data : []
        );
      } catch (requestError) {
        console.error(
          "Unable to load mentionable users:",
          requestError
        );
        setMentionableUsers([]);
      }
    };


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

        setSparePartError(
          requestError.message
        );

      } finally {

        setSparePartsLoading(false);

      }

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
  // SUBMIT SPARE PART
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


      setSparePartSaving(true);
      setSparePartError("");


      try {

        await fetchJson(
          `${API_URL}/tickets/${ticketId}/spare-parts`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

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


        await Promise.all([
          fetchSparePartsUsed(),
          fetchHistory(),
        ]);

      } catch (requestError) {

        setSparePartError(
          requestError.message
        );

      } finally {

        setSparePartSaving(false);

      }

    };


  // ============================================================
  // MENTION AUTOCOMPLETE
  // ============================================================

  const updateMentionSuggestions =
    (value, cursorPosition) => {

      const textBeforeCursor =
        value.slice(0, cursorPosition);

      const match = textBeforeCursor.match(
        /@([A-Za-z0-9._-]*(?:\s+[A-Za-z0-9._-]*)*)$/
      );

      if (!match) {
        setMentionActive(false);
        setMentionSuggestions([]);
        setMentionStartIndex(-1);
        setMentionSelectedIndex(0);
        return;
      }

      const query = match[1].trim().toLowerCase();
      const startIndex = cursorPosition - match[0].length;

      const filtered = mentionableUsers
        .filter(user => {
          // Do not show the currently logged-in user.
          if (
            currentUser?.id != null &&
            Number(user.id) === Number(currentUser.id)
          ) {
            return false;
          }

          const fullName =
            `${user.first_name || ""} ${user.last_name || ""}`
              .trim()
              .toLowerCase();

          const employeeCode =
            String(user.employee_code || "").toLowerCase();

          const email =
            String(user.email || "").toLowerCase();

          return (
            !query ||
            fullName.includes(query) ||
            employeeCode.includes(query) ||
            email.includes(query)
          );
        });

      setMentionStartIndex(startIndex);
      setMentionSuggestions(filtered);
      setMentionActive(filtered.length > 0);
      setMentionSelectedIndex(0);
    };


  const handleCommentInputChange =
    event => {
      const value = event.target.value;
      const cursorPosition = event.target.selectionStart ?? value.length;
      setCommentText(value);
      updateMentionSuggestions(value, cursorPosition);
    };


  const insertMention =
    user => {
      const textarea = commentInputRef.current;
      if (!textarea || mentionStartIndex < 0) return;

      const cursorPosition = textarea.selectionStart ?? commentText.length;
      const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
      const before = commentText.slice(0, mentionStartIndex);
      const after = commentText.slice(cursorPosition);
      const nextValue = `${before}@${fullName} ${after}`;
      const nextCursorPosition = before.length + fullName.length + 2;

      setCommentText(nextValue);
      setMentionActive(false);
      setMentionSuggestions([]);
      setMentionStartIndex(-1);
      setMentionSelectedIndex(0);

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(nextCursorPosition, nextCursorPosition);
      });
    };


  const handleCommentInputKeyDown =
    event => {
      if (!mentionActive || mentionSuggestions.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setMentionSelectedIndex(index => (index + 1) % mentionSuggestions.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setMentionSelectedIndex(index => (index - 1 + mentionSuggestions.length) % mentionSuggestions.length);
        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        insertMention(mentionSuggestions[mentionSelectedIndex]);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setMentionActive(false);
        setMentionSuggestions([]);
        setMentionStartIndex(-1);
        setMentionSelectedIndex(0);
      }
    };


  // ============================================================
  // EDIT COMMENT MENTION AUTOCOMPLETE
  // ============================================================

  const updateEditMentionSuggestions =
    (value, cursorPosition) => {
      const textBeforeCursor =
        value.slice(0, cursorPosition);

      const match = textBeforeCursor.match(
        /@([A-Za-z0-9._-]*(?:\s+[A-Za-z0-9._-]*)*)$/
      );

      if (!match) {
        setEditMentionActive(false);
        setEditMentionSuggestions([]);
        setEditMentionStartIndex(-1);
        setEditMentionSelectedIndex(0);
        return;
      }

      const query = match[1].trim().toLowerCase();
      const startIndex = cursorPosition - match[0].length;

      const filtered = mentionableUsers.filter(user => {
        if (
          currentUser?.id != null &&
          Number(user.id) === Number(currentUser.id)
        ) {
          return false;
        }

        const fullName =
          `${user.first_name || ""} ${user.last_name || ""}`
            .trim()
            .toLowerCase();
        const employeeCode =
          String(user.employee_code || "").toLowerCase();
        const email =
          String(user.email || "").toLowerCase();

        return (
          !query ||
          fullName.includes(query) ||
          employeeCode.includes(query) ||
          email.includes(query)
        );
      });

      setEditMentionStartIndex(startIndex);
      setEditMentionSuggestions(filtered);
      setEditMentionActive(filtered.length > 0);
      setEditMentionSelectedIndex(0);
    };


  const handleEditingCommentInputChange =
    event => {
      const value = event.target.value;
      const cursorPosition =
        event.target.selectionStart ?? value.length;

      setEditingCommentText(value);
      updateEditMentionSuggestions(value, cursorPosition);
    };


  const insertEditMention =
    user => {
      const textarea = editingCommentInputRef.current;
      if (!textarea || editMentionStartIndex < 0) return;

      const cursorPosition =
        textarea.selectionStart ?? editingCommentText.length;
      const fullName =
        `${user.first_name || ""} ${user.last_name || ""}`.trim();
      const before = editingCommentText.slice(0, editMentionStartIndex);
      const after = editingCommentText.slice(cursorPosition);
      const nextValue = `${before}@${fullName} ${after}`;
      const nextCursorPosition =
        before.length + fullName.length + 2;

      setEditingCommentText(nextValue);
      setEditMentionActive(false);
      setEditMentionSuggestions([]);
      setEditMentionStartIndex(-1);
      setEditMentionSelectedIndex(0);

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(
          nextCursorPosition,
          nextCursorPosition
        );
      });
    };


  const handleEditingCommentInputKeyDown =
    event => {
      if (
        !editMentionActive ||
        editMentionSuggestions.length === 0
      ) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setEditMentionSelectedIndex(
          index =>
            (index + 1) % editMentionSuggestions.length
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setEditMentionSelectedIndex(
          index =>
            (index - 1 + editMentionSuggestions.length) %
            editMentionSuggestions.length
        );
        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        insertEditMention(
          editMentionSuggestions[editMentionSelectedIndex]
        );
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setEditMentionActive(false);
        setEditMentionSuggestions([]);
        setEditMentionStartIndex(-1);
        setEditMentionSelectedIndex(0);
      }
    };


  // ============================================================
  // ADD COMMENT
  // ============================================================

  const handleAddComment =
    async event => {

      event.preventDefault();

      const value =
        commentText.trim();

      if (!value) {

        setCommentError(
          "Comment cannot be empty."
        );

        return;

      }

      if (!hasPermission("comment_ticket")) {

        setCommentError(
          "You do not have permission to add comments."
        );

        return;

      }

      try {

        setCommentSaving(true);
        setCommentError("");

        const createdComment = await fetchJson(
          `${API_URL}/tickets/${ticket.id}/comments`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                comment: value,
              }),
          }
        );

        if (commentFiles.length > 0) {
          await uploadCommentAttachments(
            createdComment.id,
            commentFiles
          );
        }

        setCommentText("");
        setCommentFiles([]);
        if (commentInputRef.current) {
          commentInputRef.current.value = "";
        }
        setMentionActive(false);
        setMentionSuggestions([]);
        setMentionStartIndex(-1);
        setMentionSelectedIndex(0);

        await fetchComments();

      } catch (requestError) {

        setCommentError(
          requestError.message
        );

      } finally {

        setCommentSaving(false);

      }

    };


  // ============================================================
  // COMMENT ATTACHMENTS
  // ============================================================

  const handleCommentFilesChange = event => {
    setCommentFiles(
      Array.from(event.target.files || [])
    );
  };


  const uploadCommentAttachments =
    async (commentId, files) => {

      if (!files.length) return;

      const formData = new FormData();

      files.forEach(file => {
        formData.append("files", file);
      });

      await fetchJson(
        `${API_URL}/tickets/${ticket.id}/comments/${commentId}/attachments`,
        {
          method: "POST",
          body: formData,
        }
      );

    };


  const handleViewAttachment =
    async attachment => {

      try {
        setAttachmentLoadingId(attachment.id);

        const response = await fetch(
          `${API_URL}/tickets/${ticket.id}/comments/${attachment.comment_id}/attachments/${attachment.id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          let message = `Unable to open attachment (${response.status}).`;
          try {
            const data = await response.json();
            if (data?.detail) message = data.detail;
          } catch {
            // Ignore parsing errors.
          }
          throw new Error(message);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, "_blank", "noopener,noreferrer");

        window.setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 60000);

      } catch (requestError) {
        setCommentError(requestError.message);
      } finally {
        setAttachmentLoadingId(null);
      }
    };


  const handleDeleteAttachment =
    async attachment => {

      const confirmed = window.confirm(
        `Permanently delete "${attachment.file_name}"? This cannot be undone.`
      );

      if (!confirmed) return;

      try {
        setAttachmentLoadingId(attachment.id);
        setCommentError("");

        await fetchJson(
          `${API_URL}/tickets/${ticket.id}/comments/${attachment.comment_id}/attachments/${attachment.id}`,
          {
            method: "DELETE",
          }
        );

        await fetchComments();

      } catch (requestError) {
        setCommentError(requestError.message);
      } finally {
        setAttachmentLoadingId(null);
      }
    };


  const formatAttachmentSize = bytes => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };


  // ============================================================
  // EDIT COMMENT
  // ============================================================

  const handleEditComment =
    async commentId => {

      const value =
        editingCommentText.trim();

      if (!value) {

        setCommentError(
          "Comment cannot be empty."
        );

        return;

      }

      if (
        !hasPermission(
          "comment_ticket"
        )
      ) {

        setCommentError(
          "You do not have permission to edit comments."
        );

        return;

      }

      try {

        setCommentEditSaving(true);
        setCommentError("");

        await fetchJson(
          `${API_URL}/tickets/${ticket.id}/comments/${commentId}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                comment:
                  value,
              }),
          }
        );

        setEditingCommentId(null);
        setEditingCommentText("");
        setEditMentionActive(false);
        setEditMentionSuggestions([]);
        setEditMentionStartIndex(-1);
        setEditMentionSelectedIndex(0);

        await fetchComments();

      } catch (requestError) {

        console.error(
          requestError
        );

        setCommentError(
          requestError.message
        );

      } finally {

        setCommentEditSaving(false);

      }

    };


  const startEditingComment =
    comment => {

      setCommentError("");
      setEditingCommentId(
        comment.id
      );
      setEditingCommentText(
        comment.comment || ""
      );
      setEditMentionActive(false);
      setEditMentionSuggestions([]);
      setEditMentionStartIndex(-1);
      setEditMentionSelectedIndex(0);

    };


  const cancelEditingComment =
    () => {

      if (commentEditSaving) {
        return;
      }

      setEditingCommentId(null);
      setEditingCommentText("");
      setEditMentionActive(false);
      setEditMentionSuggestions([]);
      setEditMentionStartIndex(-1);
      setEditMentionSelectedIndex(0);

    };


  // ============================================================
  // RENDER COMMENT WITH HIGHLIGHTED MENTIONS
  // ============================================================

  const renderCommentWithMentions =
    text => {

      if (!text) {
        return null;
      }

      const users =
        Array.isArray(mentionableUsers)
          ? mentionableUsers
          : [];

      const names = users
        .map(user => `${user.first_name || ""} ${user.last_name || ""}`.trim())
        .filter(Boolean)
        .sort((a, b) => b.length - a.length);

      if (names.length === 0) {
        return text;
      }

      const escapeRegExp = value =>
        value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const mentionPattern =
        names
          .map(name => `@${escapeRegExp(name)}`)
          .join("|");

      if (!mentionPattern) {
        return text;
      }

      const parts = text.split(
        new RegExp(`(${mentionPattern})(?![A-Za-z0-9._-])`, "gi")
      );

      return parts.map((part, index) => {
        const isMention =
          /^@.+/.test(part) &&
          names.some(
            name =>
              part.toLowerCase() ===
              `@${name}`.toLowerCase()
          );

        if (!isMention) {
          return <span key={index}>{part}</span>;
        }

        return (
          <span
            key={index}
            style={{
              display: "inline",
              padding: "2px 6px",
              margin: "0 2px",
              borderRadius: "6px",
              background: "#d9ff3f",
              color: "#172000",
              fontWeight: 800,
              boxShadow: "0 0 8px rgba(217, 255, 63, 0.55)",
            }}
          >
            {part}
          </span>
        );
      });
    };


  // ============================================================
  // LOAD
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
            fetchHistory(),
            fetchSparePartsUsed(),
            fetchComments(),
            fetchMentionableUsers(),
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
  // SAVE RESOLUTION
  // ============================================================

  const handleSaveResolution =
    async () => {

      if (!ticket) {
        return;
      }


      const value =
        resolution.trim();


      if (!value) {

        setError(
          "Please enter a resolution."
        );

        return;

      }


      const isAssignedEngineer =
        Number(
          ticket.assigned_to_id
        ) ===
        Number(
          currentUser?.id
        );


      const canUpdateResolution =
        (
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
          )
        )
        ||
        (
          isAssignedEngineer &&
          hasPermission(
            "request_close_ticket"
          ) &&
          ![
            "CLOSED",
            "CLOSE_REQUESTED",
          ].includes(
            ticket.status
          )
        );


      if (!canUpdateResolution) {

        setError(
          "You are not allowed to update this resolution."
        );

        return;

      }


      try {

        setSavingResolution(true);
        setError("");


        await fetchJson(
          `${API_URL}/tickets/${ticket.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                resolution:
                  value,
              }),
          }
        );


        await Promise.all([
          fetchTicket(),
          fetchHistory(),
        ]);

      } catch (error) {

        console.error(error);

        setError(
          error.message
        );

      } finally {

        setSavingResolution(false);

      }

    };


  // ============================================================
  // REQUEST CLOSURE
  // ============================================================

  const handleRequestClosure =
    async () => {

      if (!ticket) {
        return;
      }


      if (
        ticket.status ===
        "CLOSE_REQUESTED"
      ) {

        setError(
          "A closure request is already pending manager review."
        );

        return;

      }


      if (
        ticket.status ===
        "CLOSED"
      ) {

        setError(
          "This ticket is already closed."
        );

        return;

      }


      if (
        !resolution.trim()
      ) {

        setError(
          "Please save a resolution before requesting closure."
        );

        return;

      }


      const isAssignedEngineer =
        Number(
          ticket.assigned_to_id
        ) ===
        Number(
          currentUser?.id
        );


      if (!isAssignedEngineer) {

        setError(
          "Only the assigned engineer can request closure."
        );

        return;

      }


      if (
        !hasPermission(
          "request_close_ticket"
        )
      ) {

        setError(
          "You do not have permission to request closure."
        );

        return;

      }


      if (
        !window.confirm(
          `Request closure for ${ticket.ticket_number}?`
        )
      ) {
        return;
      }


      try {

        setActionLoading(true);
        setError("");


        await fetchJson(
          `${API_URL}/tickets/${ticket.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status:
                  "CLOSE_REQUESTED",
              }),
          }
        );


        await Promise.all([
          fetchTicket(),
          fetchHistory(),
        ]);

      } catch (error) {

        console.error(error);

        setError(
          error.message
        );

      } finally {

        setActionLoading(false);

      }

    };


  // ============================================================
  // DENY CLOSURE
  // ============================================================

  const handleDenyClosure =
    async () => {

      if (!ticket) {
        return;
      }


      if (
        ticket.status !==
        "CLOSE_REQUESTED"
      ) {

        setError(
          "Only a pending closure request can be denied."
        );

        return;

      }


      if (
        !hasPermission(
          "close_ticket"
        )
      ) {

        setError(
          "You do not have permission to deny closure requests."
        );

        return;

      }


      if (
        !window.confirm(
          `Deny the closure request for ${ticket.ticket_number} and send it back for rework?`
        )
      ) {
        return;
      }


      try {

        setActionLoading(true);
        setError("");


        await fetchJson(
          `${API_URL}/tickets/${ticket.id}/deny-closure`,
          {
            method: "POST",
          }
        );


        await Promise.all([
          fetchTicket(),
          fetchHistory(),
        ]);

      } catch (error) {

        console.error(error);

        setError(
          error.message
        );

      } finally {

        setActionLoading(false);

      }

    };


  // ============================================================
  // APPROVE & CLOSE
  // ============================================================

  const handleApproveAndClose =
    async () => {

      if (!ticket) {
        return;
      }


      if (
        ticket.status !==
        "CLOSE_REQUESTED"
      ) {

        setError(
          "Only a pending closure request can be approved."
        );

        return;

      }


      if (
        !hasPermission(
          "close_ticket"
        )
      ) {

        setError(
          "You do not have permission to close tickets."
        );

        return;

      }


      if (
        !ticket.resolution?.trim()
      ) {

        setError(
          "The engineer must provide a resolution before closure."
        );

        return;

      }


      if (
        !window.confirm(
          `Approve closure for ${ticket.ticket_number}?`
        )
      ) {
        return;
      }


      try {

        setActionLoading(true);
        setError("");


        await fetchJson(
          `${API_URL}/tickets/${ticket.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status:
                  "CLOSED",
              }),
          }
        );


        await Promise.all([
          fetchTicket(),
          fetchHistory(),
        ]);

      } catch (error) {

        console.error(error);

        setError(
          error.message
        );

      } finally {

        setActionLoading(false);

      }

    };


  // ============================================================
  // REOPEN
  // ============================================================

  const handleReopenTicket =
    async () => {

      if (!ticket) {
        return;
      }


      if (!isServiceManager) {

        setError(
          "Only a Service Manager can reopen a ticket."
        );

        return;

      }


      if (
        !hasPermission(
          "update_ticket"
        )
      ) {

        setError(
          "You do not have permission to reopen tickets."
        );

        return;

      }


      if (
        ![
          "CLOSED",
          "CLOSE_REQUESTED",
        ].includes(
          ticket.status
        )
      ) {

        setError(
          "Only closed or pending-closure tickets can be reopened."
        );

        return;

      }


      if (
        !window.confirm(
          `${
            ticket.status === "CLOSED"
              ? "Reopen"
              : "Send back"
          } ${ticket.ticket_number} for rework?`
        )
      ) {
        return;
      }


      try {

        setActionLoading(true);
        setError("");


        await fetchJson(
          `${API_URL}/tickets/${ticket.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status:
                  "OPEN",
              }),
          }
        );


        await Promise.all([
          fetchTicket(),
          fetchHistory(),
        ]);

      } catch (error) {

        console.error(error);

        setError(
          error.message
        );

      } finally {

        setActionLoading(false);

      }

    };


  // ============================================================
  // HELPERS
  // ============================================================

  const getUserName =
    user => {

      if (!user) {
        return "Unassigned";
      }


      const fullName =
        [
          user.first_name,
          user.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();


      return (
        fullName ||
        user.employee_code ||
        user.email ||
        "Unknown User"
      );

    };


  const formatDate =
    value => {

      if (!value) {
        return "—";
      }


      const date =
        new Date(value);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {

        return value;

      }


      return date.toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

    };


  const getStatusClass =
    status => {

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


  const getPriorityClass =
    priority => {

      if (!priority) {
        return "";
      }


      return (
        `ticket-priority priority-${String(
          priority
        ).toLowerCase()}`
      );

    };


  const formatField =
    field => {

      const labels = {

        assigned_to_id:
          "Assigned Engineer",

        department_id:
          "Department",

        sub_department_id:
          "Sub Department",

        status:
          "Status",

        priority:
          "Priority",

        title:
          "Title",

        description:
          "Description",

        resolution:
          "Resolution",

      };


      return (
        labels[field] ||
        String(field || "")
          .replaceAll(
            "_",
            " "
          )
          .replace(
            /\b\w/g,
            char =>
              char.toUpperCase()
          )
      );

    };


 const getActionLabel =
  action => {

    const labels = {

      CREATED:
        "Ticket Created",

      DEPARTMENT_ASSIGNED:
        "Department Assigned",

      SUB_DEPARTMENT_ASSIGNED:
        "Sub Department Assigned",

      DEPARTMENT_CHANGED:
        "Department Changed",

      SUB_DEPARTMENT_CHANGED:
        "Sub Department Changed",

      ASSIGNED:
        "Engineer Assigned",

      STATUS_CHANGED:
        "Status Changed",

      PRIORITY_CHANGED:
        "Priority Changed",

      TITLE_CHANGED:
        "Title Changed",

      DESCRIPTION_CHANGED:
        "Description Changed",

      RESOLUTION_UPDATED:
        "Resolution Updated",

      CLOSE_REQUESTED:
        "Closure Requested",

      CLOSE_REQUEST_DENIED:
        "Closure Request Denied",

      RESOLVED:
        "Ticket Resolved",

      CLOSED:
        "Ticket Closed",

      CANCELLED:
        "Ticket Cancelled",

    };


    return (
      labels[action] ||
      action ||
      "Ticket Updated"
    );

  };


  const getHistoryActor =
    item => {

      if (item.changed_by) {

        return getUserName(
          item.changed_by
        );

      }


      if (
        Number(
          item.changed_by_id
        ) ===
        Number(
          currentUser?.id
        )
      ) {

        return getUserName(
          currentUser
        );

      }


      return "ServiOps User";

    };


  const formatHistoryValue =
    (
      field,
      value
    ) => {

      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {

        return "—";

      }


      if (
        field ===
        "assigned_to_id"
      ) {

        const id =
          Number(value);


        if (
          Number(
            ticket.assigned_to?.id
          ) === id
        ) {

          return getUserName(
            ticket.assigned_to
          );

        }


        if (
          Number(
            currentUser?.id
          ) === id
        ) {

          return getUserName(
            currentUser
          );

        }


        return "Engineer";

      }


      if (
        field ===
        "department_id"
      ) {

        if (
          Number(
            ticket.department?.id
          ) ===
          Number(value)
        ) {

          return (
            ticket.department.name
          );

        }


        return `Department #${value}`;

      }


      if (
        field ===
        "sub_department_id"
      ) {

        if (
          Number(
            ticket.sub_department?.id
          ) ===
          Number(value)
        ) {

          return (
            ticket.sub_department.name
          );

        }


        return `Sub Department #${value}`;

      }


      return String(value)
        .replaceAll(
          "_",
          " "
        );

    };


  const getHistoryClass =
    action => {

      const value =
        String(
          action || ""
        ).toLowerCase();


      if (
        value.includes(
          "denied"
        )
      ) {
        return "history-action-denied";
      }

      if (
        value.includes(
          "closed"
        )
      ) {
        return "history-action-closed";
      }

      if (
        value.includes(
          "request"
        )
      ) {
        return "history-action-requested";
      }

      if (
        value.includes(
          "assign"
        )
      ) {
        return "history-action-assigned";
      }

      if (
        value.includes(
          "resolution"
        )
      ) {
        return "history-action-resolution";
      }

      if (
        value.includes(
          "priority"
        )
      ) {
        return "history-action-priority";
      }

      if (
        value.includes(
          "reopen"
        )
      ) {
        return "history-action-reopened";
      }

      return "history-action-default";

    };


  // ============================================================
  // WORKFLOW FLAGS
  // ============================================================

  const isClosed =
    ticket?.status ===
    "CLOSED";

  const isCancelled =
    ticket?.status ===
    "CANCELLED";

  const isCloseRequested =
    ticket?.status ===
    "CLOSE_REQUESTED";

  const isAssignedEngineer =
    Number(
      ticket?.assigned_to_id
    ) ===
    Number(
      currentUser?.id
    );


  const canEditResolution =
    !isCancelled &&
    (
      (
        isAssignedEngineer &&
        hasPermission(
          "request_close_ticket"
        ) &&
        !isClosed &&
        !isCloseRequested
      )
      ||
      (
        isServiceManager &&
        hasPermission(
          "resolve_ticket"
        )
      )
      ||
      (
        hasPermission(
          "resolve_ticket"
        ) &&
        !isClosed &&
        !isCloseRequested
      )
    );


  const canRequestClosure =
    !isClosed &&
    !isCancelled &&
    !isCloseRequested &&
    isAssignedEngineer &&
    hasPermission(
      "request_close_ticket"
    );


  const canApproveClosure =
    isCloseRequested &&
    hasPermission(
      "close_ticket"
    );


  const canDenyClosure =
    isCloseRequested &&
    hasPermission(
      "close_ticket"
    );


  const canReopen =
    isServiceManager &&
    hasPermission(
      "update_ticket"
    ) &&
    (
      isClosed ||
      isCloseRequested
    );


  const historyActions = [
    ...new Set(
      history
        .map(
          item =>
            item.action
        )
        .filter(Boolean)
    ),
  ];


  const filteredHistory =
    historyFilter === "ALL"
      ? history
      : history.filter(
          item =>
            item.action ===
            historyFilter
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


  if (loading) {

    return (
      <div className="page-container">

        <div className="loading-state">
          Loading ticket...
        </div>

      </div>
    );

  }


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

    <div className="page-container ticket-details-page">


      <style>{`
        .ticket-details-page {
          max-width: 1220px;
          margin: 0 auto;
          padding-bottom: 48px;
        }

        .ticket-details-page .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 20px;
          padding: 24px 26px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
        }

        .ticket-details-page .ticket-details-heading {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ticket-details-page .ticket-summary-icon {
          width: 48px;
          height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #172033;
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: .06em;
          box-shadow: 0 8px 18px rgba(15, 23, 42, .16);
        }

        .ticket-details-page .ticket-summary-label,
        .ticket-details-page .workflow-card-kicker {
          display: block;
          margin-bottom: 4px;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .09em;
          text-transform: uppercase;
        }

        .ticket-details-page .page-header h2 {
          margin: 0;
          color: #0f172a;
          font-size: 25px;
          line-height: 1.15;
        }

        .ticket-details-page .page-header > div:first-child > p {
          margin: 9px 0 0 62px;
          max-width: 760px;
          color: #475569;
          font-size: 15px;
          line-height: 1.55;
        }


        .ticket-details-page .ticket-comments-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 18px;
        }

        .ticket-details-page .ticket-comment-card {
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #ffffff;
          box-shadow: 0 5px 16px rgba(15, 23, 42, 0.04);
          overflow: hidden;
        }

        .ticket-details-page .ticket-comment-main {
          display: flex;
          gap: 14px;
          padding: 18px;
        }

        .ticket-details-page .ticket-comment-avatar {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #172033;
          color: #ffffff;
          font-size: 13px;
          font-weight: 800;
        }

        .ticket-details-page .ticket-comment-content {
          min-width: 0;
          flex: 1;
        }

        .ticket-details-page .ticket-comment-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 10px;
        }

        .ticket-details-page .ticket-comment-author {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ticket-details-page .ticket-comment-author strong {
          color: #0f172a;
          font-size: 14px;
        }

        .ticket-details-page .ticket-comment-author span {
          padding: 3px 8px;
          border-radius: 999px;
          background: #f1f5f9;
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
        }

        .ticket-details-page .ticket-comment-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 11px;
          white-space: nowrap;
        }

        .ticket-details-page .ticket-comment-edited {
          color: #94a3b8;
          font-style: italic;
        }

        .ticket-details-page .ticket-comment-text {
          color: #334155;
          font-size: 13px;
          line-height: 1.65;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .ticket-details-page .ticket-comment-edit-box textarea {
          width: 100%;
          min-height: 96px;
          resize: vertical;
          margin-bottom: 10px;
        }

        .ticket-details-page .ticket-comment-attachments {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid #eef2f7;
        }

        .ticket-details-page .ticket-comment-attachments-title {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 9px;
          color: #475569;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .06em;
        }

        .ticket-details-page .ticket-comment-attachments-title span {
          min-width: 20px;
          padding: 2px 6px;
          border-radius: 999px;
          background: #f1f5f9;
          color: #64748b;
          text-align: center;
          font-size: 10px;
        }

        .ticket-details-page .ticket-comment-attachment-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .ticket-details-page .ticket-comment-attachment {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 9px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
        }

        .ticket-details-page .ticket-comment-attachment-info {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }

        .ticket-details-page .ticket-comment-attachment-icon {
          width: 32px;
          height: 32px;
          flex: 0 0 32px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: #e2e8f0;
          color: #475569;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .04em;
        }

        .ticket-details-page .ticket-comment-attachment-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ticket-details-page .ticket-comment-attachment-copy strong {
          max-width: 520px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #1e293b;
          font-size: 12px;
        }

        .ticket-details-page .ticket-comment-attachment-copy span {
          color: #64748b;
          font-size: 10px;
        }

        .ticket-details-page .ticket-comment-attachment-actions {
          display: flex;
          align-items: center;
          gap: 7px;
          flex: 0 0 auto;
        }

        .ticket-details-page .ticket-comment-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 12px;
        }

        .ticket-details-page .ticket-comment-edit-button {
          min-height: 32px;
          padding: 6px 11px;
          font-size: 11px;
        }


        .ticket-details-page .ticket-comment-selected-files {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
        }

        .ticket-details-page .ticket-comment-selected-file {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          max-width: 260px;
          padding: 5px 7px 5px 9px;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          background: #f8fafc;
          color: #475569;
          font-size: 10px;
        }

        .ticket-details-page .ticket-comment-selected-file > span {
          max-width: 210px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ticket-details-page .ticket-comment-selected-file button {
          width: 20px;
          height: 20px;
          border: 0;
          border-radius: 50%;
          background: #e2e8f0;
          color: #475569;
          cursor: pointer;
          line-height: 1;
        }

        .ticket-details-page .ticket-comment-selected-file button:hover:not(:disabled) {
          background: #cbd5e1;
        }

        .ticket-details-page .action-buttons {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
        }

        .ticket-details-page .primary-button,
        .ticket-details-page .secondary-button,
        .ticket-details-page .danger-button {
          min-height: 38px;
          border-radius: 10px;
          padding: 9px 14px;
          font-weight: 750;
          transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
        }

        .ticket-details-page .primary-button:hover:not(:disabled),
        .ticket-details-page .secondary-button:hover:not(:disabled),
        .ticket-details-page .danger-button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .ticket-details-page .ticket-overview-card {
          display: grid;
          grid-template-columns: minmax(210px, .75fr) minmax(0, 1.8fr);
          gap: 20px;
          margin-bottom: 20px;
          padding: 22px;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 6px 20px rgba(15, 23, 42, .05);
        }

        .ticket-details-page .ticket-overview-status {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 9px;
          padding: 4px 20px 4px 2px;
          border-right: 1px solid #e2e8f0;
        }

        .ticket-details-page .ticket-overview-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ticket-details-page .ticket-status,
        .ticket-details-page .ticket-priority {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 6px 11px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .04em;
        }

        .ticket-details-page .ticket-overview-meta {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          align-items: center;
        }

        .ticket-details-page .ticket-overview-meta > div {
          min-width: 0;
          padding: 11px 13px;
          border: 1px solid #edf2f7;
          border-radius: 12px;
          background: #f8fafc;
        }

        .ticket-details-page .ticket-overview-meta span,
        .ticket-details-page .info-box > span {
          display: block;
          margin-bottom: 5px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .07em;
          text-transform: uppercase;
        }

        .ticket-details-page .ticket-overview-meta strong,
        .ticket-details-page .info-box strong {
          display: block;
          color: #1e293b;
          font-size: 13px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .ticket-details-page .section-card,
        .ticket-details-page .workflow-card {
          margin-bottom: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 6px 20px rgba(15, 23, 42, .045);
          overflow: hidden;
        }

        .ticket-details-page .section-card {
          padding: 22px;
        }

        .ticket-details-page .section-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eef2f7;
        }

        .ticket-details-page .section-card-header h3,
        .ticket-details-page .workflow-card h3 {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
        }

        .ticket-details-page .section-card-header p,
        .ticket-details-page .workflow-card p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.55;
        }

        .ticket-details-page .ticket-info-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .ticket-details-page .info-box {
          min-width: 0;
          padding: 14px;
          border: 1px solid #edf2f7;
          border-radius: 12px;
          background: #f8fafc;
        }

        .ticket-details-page .info-box p {
          margin: 0;
          color: #334155;
          font-size: 13px;
          line-height: 1.65;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .ticket-details-page .info-box-wide {
          grid-column: 1 / -1;
          background: #fbfdff;
        }

        .ticket-details-page .workflow-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 20px 22px;
          border-left: 4px solid #94a3b8;
        }

        .ticket-details-page .workflow-card-kicker {
          color: #475569;
        }

        .ticket-details-page .workflow-waiting-badge,
        .ticket-details-page .history-count-badge {
          display: inline-flex;
          align-items: center;
          min-height: 27px;
          padding: 5px 10px;
          border-radius: 999px;
          background: #fff7ed;
          color: #c2410c;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .ticket-details-page .resolution-panel {
          padding: 16px;
          border: 1px solid #e8eef5;
          border-radius: 13px;
          background: #f8fafc;
        }

        .ticket-details-page textarea,
        .ticket-details-page input,
        .ticket-details-page select {
          border-radius: 10px;
        }

        .ticket-details-page .resolution-panel textarea {
          display: block;
          width: 100%;
          box-sizing: border-box;
          min-height: 150px;
          padding: 13px 14px;
          border: 1px solid #dbe3ec;
          background: #ffffff;
          color: #1e293b;
          line-height: 1.6;
          resize: vertical;
        }

        .ticket-details-page .resolution-panel textarea:focus,
        .ticket-details-page input:focus,
        .ticket-details-page select:focus {
          outline: none;
          border-color: #94a3b8;
          box-shadow: 0 0 0 3px rgba(148, 163, 184, .18);
        }

        .ticket-details-page .form-actions {
          display: flex;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 12px;
        }

        .ticket-details-page .workflow-note {
          margin-bottom: 20px;
          padding: 15px 18px;
          border: 1px solid #dbeafe;
          border-radius: 13px;
          background: #eff6ff;
        }

        .ticket-details-page .workflow-note strong {
          color: #1e40af;
          font-size: 13px;
        }

        .ticket-details-page .workflow-note p {
          margin: 4px 0 0;
          color: #475569;
          font-size: 12px;
        }

        .ticket-details-page .manager-resolution-preview {
          margin-top: 14px;
          padding: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
        }

        .ticket-details-page .manager-resolution-preview > span {
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .07em;
          text-transform: uppercase;
        }

        .ticket-details-page .manager-resolution-preview p {
          margin: 8px 0 0;
          color: #334155;
          white-space: pre-wrap;
          line-height: 1.65;
        }

        .ticket-details-page .table-container {
          border: 1px solid #e5eaf0;
          border-radius: 12px;
          overflow-x: auto;
          background: #ffffff;
        }

        .ticket-details-page .data-table,
        .ticket-details-page .history-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .ticket-details-page .data-table th,
        .ticket-details-page .history-table th {
          background: #f8fafc;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .07em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .ticket-details-page .data-table th,
        .ticket-details-page .data-table td,
        .ticket-details-page .history-table th,
        .ticket-details-page .history-table td {
          padding: 13px 14px;
          border-bottom: 1px solid #edf2f7;
          vertical-align: top;
          text-align: left;
        }

        .ticket-details-page .data-table tbody tr:last-child td,
        .ticket-details-page .history-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .ticket-details-page .data-table tbody tr:hover,
        .ticket-details-page .history-table tbody tr:hover {
          background: #fbfdff;
        }

        .ticket-details-page .table-secondary-text,
        .ticket-details-page .table-date-text {
          margin-top: 4px;
          color: #64748b;
          font-size: 11px;
        }

        .ticket-details-page .history-heading {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .ticket-details-page .history-filter-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ticket-details-page .history-filter-wrapper label {
          color: #64748b;
          font-size: 11px;
          font-weight: 750;
        }

        .ticket-details-page .history-filter-wrapper select {
          min-width: 180px;
          padding: 8px 11px;
          border: 1px solid #dbe3ec;
          background: #ffffff;
          color: #334155;
        }

        .ticket-details-page .history-row-number {
          display: inline-flex;
          width: 25px;
          height: 25px;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f1f5f9;
          color: #475569;
          font-size: 10px;
          font-weight: 800;
        }

        .ticket-details-page .history-performer {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 150px;
        }

        .ticket-details-page .history-user-avatar {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          border-radius: 50%;
          background: #e0e7ff;
          color: #3730a3;
          font-size: 11px;
          font-weight: 800;
        }

        .ticket-details-page .history-value-change {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          min-width: 180px;
        }

        .ticket-details-page .history-old-value,
        .ticket-details-page .history-new-value {
          display: inline-block;
          padding: 4px 7px;
          border-radius: 6px;
          font-size: 11px;
          overflow-wrap: anywhere;
        }

        .ticket-details-page .history-old-value {
          background: #f1f5f9;
          color: #64748b;
        }

        .ticket-details-page .history-new-value {
          background: #ecfdf5;
          color: #047857;
          font-weight: 700;
        }

        .ticket-details-page .history-arrow {
          color: #94a3b8;
          font-weight: 800;
        }

        .ticket-details-page .history-description {
          display: block;
          min-width: 180px;
          color: #475569;
          line-height: 1.5;
        }

        .ticket-details-page .empty-state,
        .ticket-details-page .loading-state {
          border-radius: 12px;
          background: #f8fafc;
        }

        .ticket-details-page .error-message {
          margin-bottom: 18px;
          border-radius: 12px;
        }

        .ticket-details-page .ticket-spare-part-form {
          margin-bottom: 18px;
          padding: 17px;
          border: 1px solid #e2e8f0;
          border-radius: 13px;
          background: #f8fafc;
        }

        .ticket-details-page .ticket-spare-part-form .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .ticket-details-page .ticket-spare-part-form input,
        .ticket-details-page .ticket-spare-part-form select {
          width: 100%;
          box-sizing: border-box;
          min-height: 40px;
          padding: 9px 11px;
          border: 1px solid #dbe3ec;
          background: #ffffff;
        }

        .ticket-details-page .ticket-spare-part-form .form-group label {
          display: block;
          margin-bottom: 6px;
          color: #475569;
          font-size: 11px;
          font-weight: 750;
        }

        @media (max-width: 1000px) {
          .ticket-details-page .ticket-overview-card {
            grid-template-columns: 1fr;
          }

          .ticket-details-page .ticket-overview-status {
            padding-right: 0;
            padding-bottom: 16px;
            border-right: 0;
            border-bottom: 1px solid #e2e8f0;
          }

          .ticket-details-page .ticket-overview-meta {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ticket-details-page .ticket-info-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .ticket-details-page .page-header,
          .ticket-details-page .workflow-card {
            flex-direction: column;
            align-items: stretch;
          }

          .ticket-details-page .page-header > div:first-child > p {
            margin-left: 0;
          }

          .ticket-details-page .page-header .action-buttons {
            justify-content: flex-start;
          }

          .ticket-details-page .ticket-overview-meta,
          .ticket-details-page .ticket-info-grid,
          .ticket-details-page .ticket-spare-part-form .form-grid {
            grid-template-columns: 1fr;
          }

          .ticket-details-page .section-card {
            padding: 16px;
          }

          .ticket-details-page .section-card-header {
            flex-direction: column;
          }

          .ticket-details-page .history-filter-wrapper {
            width: 100%;
          }

          .ticket-details-page .history-filter-wrapper select {
            flex: 1;
            min-width: 0;
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
                Service Ticket
              </span>

              <h2>
                {ticket.ticket_number}
              </h2>

            </div>

          </div>

          <p>
            {ticket.title}
          </p>

        </div>


        <div className="action-buttons">

          <Link
            to="/tickets"
            className="secondary-button"
          >
            ← Back
          </Link>


          {hasPermission(
            "update_ticket"
          ) && (

            <Link
              to={`/tickets/${ticket.id}/edit`}
              className="primary-button"
              style={{
                textDecoration:
                  "none",
              }}
            >
              Edit Ticket
            </Link>

          )}

        </div>

      </div>


      {/* ======================================================
          STATUS BANNER
      ======================================================= */}

      <section className="ticket-overview-card">

        <div className="ticket-overview-status">

          <span className="ticket-summary-label">
            Current Status
          </span>

          <div className="ticket-overview-badges">

            <span
              className={
                getStatusClass(
                  ticket.status
                )
              }
            >
              {ticket.status}
            </span>

            <span
              className={
                getPriorityClass(
                  ticket.priority
                )
              }
            >
              {ticket.priority}
            </span>

          </div>

        </div>


        <div className="ticket-overview-meta">

          <div>

            <span>
              Created By
            </span>

            <strong>
              {getUserName(
                ticket.created_by
              )}
            </strong>

          </div>


          <div>

            <span>
              Assigned Engineer
            </span>

            <strong>
              {getUserName(
                ticket.assigned_to
              )}
            </strong>

          </div>


          <div>

            <span>
              Created
            </span>

            <strong>
              {formatDate(
                ticket.created_at
              )}
            </strong>

          </div>


          <div>

            <span>
              Updated
            </span>

            <strong>
              {formatDate(
                ticket.updated_at
              )}
            </strong>

          </div>

        </div>

      </section>


      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (

        <div className="error-message">
          {error}
        </div>

      )}


      {/* ======================================================
          MANAGER CONTROLS
      ======================================================= */}

      {isServiceManager && (

        <section className="workflow-card">

          <div>

            <span className="workflow-card-kicker">
              Manager Controls
            </span>

            <h3>
              Ticket Review
            </h3>

            <p>
              Review the resolution and control the
              closure workflow from here.
            </p>

          </div>


          <div className="action-buttons">

            {canReopen && (

              <button
                type="button"
                className="secondary-button"
                onClick={
                  handleReopenTicket
                }
                disabled={
                  actionLoading
                }
              >
                {actionLoading
                  ? "Working..."
                  : isClosed
                    ? "Reopen for Rework"
                    : "Send Back for Rework"}
              </button>

            )}


            {canApproveClosure && (

              <button
                type="button"
                className="primary-button"
                onClick={
                  handleApproveAndClose
                }
                disabled={
                  actionLoading
                }
              >
                {actionLoading
                  ? "Closing..."
                  : "Approve & Close"}
              </button>

            )}

          </div>

        </section>

      )}


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
              Customer, plant, machine and ticket details.
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
              {ticket.customer
                ? `${ticket.customer.customer_code} - ${ticket.customer.name}`
                : `Customer #${ticket.customer_id}`}
            </strong>

          </div>


          <div className="info-box">

            <span>
              Plant
            </span>

            <strong>
              {ticket.plant
                ? `${ticket.plant.plant_code} - ${ticket.plant.name}`
                : `Plant #${ticket.plant_id}`}
            </strong>

          </div>


          <div className="info-box">

            <span>
              Machine
            </span>

            <strong>
              {ticket.machine
                ? `${ticket.machine.machine_code} - ${ticket.machine.name}`
                : `Machine #${ticket.machine_id}`}
            </strong>

          </div>


          <div className="info-box">

            <span>
              Department
            </span>

            <strong>
              {ticket.department?.name ||
                (ticket.department_id
                  ? `Department #${ticket.department_id}`
                  : "—")}
            </strong>

          </div>


          <div className="info-box">

            <span>
              Sub Department
            </span>

            <strong>
              {ticket.sub_department?.name ||
                (ticket.sub_department_id
                  ? `Sub Department #${ticket.sub_department_id}`
                  : "—")}
            </strong>

          </div>


          <div className="info-box">

            <span>
              Model
            </span>

            <strong>
              {ticket.machine?.model || "—"}
            </strong>

          </div>


          <div className="info-box">

            <span>
              Serial Number
            </span>

            <strong>
              {ticket.machine?.serial_number || "—"}
            </strong>

          </div>


          <div className="info-box">

            <span>
              Manufacturer
            </span>

            <strong>
              {ticket.machine?.manufacturer || "—"}
            </strong>

          </div>


          <div className="info-box">

            <span>
              Machine Status
            </span>

            <strong>
              {ticket.machine?.status || "—"}
            </strong>

          </div>


          <div className="info-box">

            <span>
              Created By
            </span>

            <strong>
              {getUserName(
                ticket.created_by
              )}
            </strong>

          </div>


          <div className="info-box">

            <span>
              Assigned Engineer
            </span>

            <strong>
              {getUserName(
                ticket.assigned_to
              )}
            </strong>

          </div>


          <div className="info-box">

            <span>
              Created At
            </span>

            <strong>
              {formatDate(
                ticket.created_at
              )}
            </strong>

          </div>


          <div className="info-box">

            <span>
              Last Updated
            </span>

            <strong>
              {formatDate(
                ticket.updated_at
              )}
            </strong>

          </div>


          <div className="info-box info-box-wide">

            <span>
              Description
            </span>

            <p>
              {ticket.description ||
                "No description provided."}
            </p>

          </div>

        </div>

      </section>


      {/* ======================================================
          RESOLUTION
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              Resolution
            </h3>

            <p>
              Technical work performed and final result.
            </p>

          </div>


          {isCloseRequested && (

            <span className="workflow-waiting-badge">
              Awaiting Manager Review
            </span>

          )}

        </div>


        <div className="resolution-panel">

          <textarea
            value={
              resolution
            }
            onChange={
              event =>
                setResolution(
                  event.target.value
                )
            }
            disabled={
              !canEditResolution
            }
            rows="7"
            placeholder={
              canEditResolution
                ? "Describe the technical work performed, root cause, parts replaced, testing performed and final result..."
                : "No editable resolution available."
            }
          />


          {canEditResolution && (

            <div className="form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setResolution(
                    ticket.resolution ||
                    ""
                  )
                }
                disabled={
                  savingResolution ||
                  actionLoading
                }
              >
                Reset
              </button>


              <button
                type="button"
                className="primary-button"
                onClick={
                  handleSaveResolution
                }
                disabled={
                  savingResolution ||
                  actionLoading
                }
              >
                {savingResolution
                  ? "Saving..."
                  : "Save Resolution"}
              </button>

            </div>

          )}

        </div>


        {isCloseRequested && (

          <div className="workflow-note">

            <strong>
              Closure request submitted
            </strong>

            <p>
              This ticket is waiting for manager review.
            </p>

          </div>

        )}

      </section>


      {/* ======================================================
          ENGINEER CLOSURE
      ======================================================= */}

      {canRequestClosure && (

        <section className="workflow-card">

          <div>

            <span className="workflow-card-kicker">
              Engineer Action
            </span>

            <h3>
              Ready for Closure?
            </h3>

            <p>
              Save the resolution first, then send the ticket
              to the manager for closure review.
            </p>

          </div>


          <button
            type="button"
            className="primary-button"
            onClick={
              handleRequestClosure
            }
            disabled={
              actionLoading ||
              savingResolution ||
              !resolution.trim()
            }
          >
            {actionLoading
              ? "Requesting..."
              : "Request Closure"}
          </button>

        </section>

      )}


      {/* ======================================================
          CLOSURE REQUEST
      ======================================================= */}

      {(
        isCloseRequested ||
        ticket.close_requested_by ||
        ticket.close_requested_at
      ) && (

        <section className="section-card">

          <div className="section-card-header">

            <div>

              <h3>
                Closure Request
              </h3>

              <p>
                Closure workflow information.
              </p>

            </div>

          </div>


          <div className="ticket-info-grid">

            <div className="info-box">

              <span>
                Requested By
              </span>

              <strong>
                {getUserName(
                  ticket.close_requested_by
                )}
              </strong>

            </div>


            <div className="info-box">

              <span>
                Requested At
              </span>

              <strong>
                {formatDate(
                  ticket.close_requested_at
                )}
              </strong>

            </div>


            <div className="info-box">

              <span>
                Review Status
              </span>

              <strong>
                {isCloseRequested
                  ? "Awaiting Manager Review"
                  : ticket.status === "CLOSED"
                    ? "Approved and Closed"
                    : ticket.status}
              </strong>

            </div>

          </div>

        </section>

      )}


      {/* ======================================================
          MANAGER REVIEW
      ======================================================= */}

      {isCloseRequested && (

        <section className="workflow-card">

          <div className="manager-review-content">

            <span className="workflow-card-kicker">
              Manager Review
            </span>

            <h3>
              Closure Review
            </h3>

            <p>
              Review the engineer's resolution before
              approving this ticket for closure.
            </p>


            <div className="manager-resolution-preview">

              <span>
                Current Resolution
              </span>

              <p>
                {ticket.resolution ||
                  "No resolution provided."}
              </p>

            </div>

          </div>


          <div className="action-buttons">

            {canDenyClosure && (

              <button
                type="button"
                className="danger-button"
                onClick={
                  handleDenyClosure
                }
                disabled={
                  actionLoading
                }
              >
                {actionLoading
                  ? "Sending Back..."
                  : "Deny / Send Back"}
              </button>

            )}


            {canApproveClosure && (

              <button
                type="button"
                className="primary-button"
                onClick={
                  handleApproveAndClose
                }
                disabled={
                  actionLoading
                }
              >
                {actionLoading
                  ? "Closing..."
                  : "Approve & Close"}
              </button>

            )}

          </div>

        </section>

      )}


      {/* ======================================================
          CLOSED NOTE
      ======================================================= */}

      {isServiceManager &&
        isClosed && (

        <div className="workflow-note">

          <strong>
            This ticket is closed.
          </strong>

          <p>
            You can update the resolution or reopen the
            ticket for rework. Existing audit history is preserved.
          </p>

        </div>

      )}


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
              Factual material consumption recorded against this ticket.
            </p>

          </div>


          {hasPermission(
            "consume_ticket_spare"
          ) &&
            [
              "ASSIGNED",
              "IN_PROGRESS",
              "RESOLVED",
              "CLOSE_REQUESTED",
            ].includes(
              ticket.status
            ) && (

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


        {sparePartFormOpen && (

          <form
            className="ticket-spare-part-form"
            onSubmit={
              submitSparePart
            }
          >

            <div className="form-grid">

              <div className="form-group">

                <label>
                  Spare part
                </label>

                <select
                  value={
                    sparePartForm.spare_part_id
                  }
                  onChange={
                    event =>
                      setSparePartForm({
                        ...sparePartForm,
                        spare_part_id:
                          event.target.value,
                      })
                  }
                  required
                >

                  <option value="">
                    Select a spare part
                  </option>


                  {catalogParts.map(
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
                        {" — "}
                        {part.name}

                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="form-group">

                <label>
                  Source location
                </label>

                <input
                  maxLength="100"
                  value={
                    sparePartForm.location
                  }
                  onChange={
                    event =>
                      setSparePartForm({
                        ...sparePartForm,
                        location:
                          event.target.value,
                      })
                  }
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={
                    sparePartForm.quantity
                  }
                  onChange={
                    event =>
                      setSparePartForm({
                        ...sparePartForm,
                        quantity:
                          event.target.value,
                      })
                  }
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Notes
                </label>

                <input
                  value={
                    sparePartForm.notes
                  }
                  onChange={
                    event =>
                      setSparePartForm({
                        ...sparePartForm,
                        notes:
                          event.target.value,
                      })
                  }
                />

              </div>

            </div>


            <div className="form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setSparePartFormOpen(
                    false
                  );
                  setSparePartError("");
                }}
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
                  ? "Recording..."
                  : "Record Usage"}
              </button>

            </div>

          </form>

        )}


        {sparePartsLoading ? (

          <div className="loading-state">
            Loading spare parts used...
          </div>

        ) : sparePartsUsed.length === 0 ? (

          <div className="empty-state">

            <strong>
              No spare parts have been used on this ticket yet.
            </strong>

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
                        {usage.spare_part?.unit ||
                          ""}

                      </td>


                      <td>
                        {usage.location}
                      </td>


                      <td>

                        {usage.created_by
                          ? `${usage.created_by.first_name || ""} ${usage.created_by.last_name || ""}`.trim() ||
                            usage.created_by.employee_code ||
                            "Unknown User"
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
                        {usage.notes ||
                          "—"}
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
          COMMENTS
      ======================================================= */}

      <section className="section-card">

        <div className="section-card-header">

          <div>

            <h3>
              Comments
            </h3>

            <p>
              Ongoing communication and updates for this ticket.
            </p>

          </div>

          <span className="history-count-badge">
            {comments.length}
            {comments.length === 1
              ? " Comment"
              : " Comments"}
          </span>

        </div>


        {commentError && (

          <div className="error-message">
            {commentError}
          </div>

        )}


        {hasPermission("comment_ticket") && (

          <form
            onSubmit={
              handleAddComment
            }
            className="resolution-panel"
          >

            <div className="form-group full-width">

              <label>
                Add Comment
              </label>

              <div style={{ position: "relative" }}>

                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={handleCommentInputChange}
                  onKeyDown={handleCommentInputKeyDown}
                  onBlur={() => {
                    window.setTimeout(() => setMentionActive(false), 150);
                  }}
                  rows="4"
                  placeholder="Write an update or comment... Use @ to mention someone."
                  disabled={commentSaving}
                />

                {mentionActive && mentionSuggestions.length > 0 && (
                  <div
                    role="listbox"
                    aria-label="Mention suggestions"
                    style={{
                      position: "fixed",
                      top: mentionDropdownPosition.top,
                      left: mentionDropdownPosition.left,
                      width: mentionDropdownPosition.width,
                      maxHeight: "320px",
                      minHeight: "80px",
                      overflowY: "auto",
                      overflowX: "hidden",
                      WebkitOverflowScrolling: "touch",
                      overscrollBehavior: "contain",
                      background: "#ffffff",
                      border: "2px solid #d9ff3f",
                      borderRadius: "10px",
                      boxShadow: "0 12px 30px rgba(15, 23, 42, 0.22)",
                      zIndex: 99999,
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 12px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#64748b",
                        background: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                      }}
                    >
                      {mentionSuggestions.length} active user
                      {mentionSuggestions.length === 1 ? "" : "s"} available
                      {" · "}You cannot mention yourself
                    </div>

                    {mentionSuggestions.map((user, index) => {
                      const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
                      const selected = index === mentionSelectedIndex;

                      return (
                        <button
                          key={user.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onMouseDown={event => {
                            event.preventDefault();
                            insertMention(user);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            width: "100%",
                            minHeight: "54px",
                            padding: "10px 12px",
                            border: "0",
                            borderBottom: "1px solid #f1f5f9",
                            background: selected ? "#efff9c" : "#ffffff",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          <span
                            style={{
                              width: "30px",
                              height: "30px",
                              flexShrink: 0,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "50%",
                              background: "#eff6ff",
                              color: "#2563eb",
                              fontWeight: 700,
                              fontSize: "12px",
                            }}
                          >
                            {fullName.charAt(0).toUpperCase()}
                          </span>
                          <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                            <strong style={{ color: "#1e293b", fontSize: "13px" }}>
                              @{fullName}
                            </strong>
                            <span style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>
                              {user.employee_code}
                              {user.email ? ` · ${user.email}` : ""}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

              </div>

            </div>


            <div className="form-actions" style={{ alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <label className="secondary-button" style={{ cursor: commentSaving ? "not-allowed" : "pointer" }}>
                  Add Attachment
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    onChange={handleCommentFilesChange}
                    disabled={commentSaving}
                    style={{ display: "none" }}
                  />
                </label>

                {commentFiles.length > 0 && (
                  <div className="ticket-comment-selected-files">
                    {commentFiles.map((file, index) => (
                      <span key={`${file.name}-${file.size}-${index}`} className="ticket-comment-selected-file">
                        <span title={file.name}>{file.name}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${file.name}`}
                          onClick={() => setCommentFiles(current => current.filter((_, fileIndex) => fileIndex !== index))}
                          disabled={commentSaving}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={
                  commentSaving ||
                  !commentText.trim()
                }
              >
                {commentSaving
                  ? "Adding..."
                  : "Add Comment"}
              </button>

            </div>

          </form>

        )}


        {commentsLoading ? (

          <div className="loading-state">
            Loading comments...
          </div>

        ) : comments.length === 0 ? (

          <div className="empty-state">

            <strong>
              No comments yet
            </strong>

            <p>
              Add the first comment to start the conversation on this ticket.
            </p>

          </div>

        ) : (

          <div className="ticket-comments-list">

            {comments.map(comment => {
              const isOwnComment =
                currentUser?.id === comment.created_by?.id;

              const isEditing =
                editingCommentId === comment.id;

              const wasEdited =
                comment.updated_at &&
                comment.created_at &&
                new Date(comment.updated_at).getTime() >
                  new Date(comment.created_at).getTime();

              const authorName = getUserName(comment.created_by);
              const authorInitial = (authorName || "U").charAt(0).toUpperCase();

              return (
                <article className="ticket-comment-card" key={comment.id}>

                  <div className="ticket-comment-main">

                    <div className="ticket-comment-avatar">
                      {authorInitial}
                    </div>

                    <div className="ticket-comment-content">

                      <div className="ticket-comment-header">
                        <div className="ticket-comment-author">
                          <strong>{authorName}</strong>
                          {comment.created_by?.role && (
                            <span>{comment.created_by.role}</span>
                          )}
                        </div>

                        <div className="ticket-comment-meta">
                          <span>{formatDate(comment.created_at)}</span>
                          {wasEdited && <span className="ticket-comment-edited">Edited</span>}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="ticket-comment-edit-box">
                          <div style={{ position: "relative" }}>
                            <textarea
                              ref={editingCommentInputRef}
                              value={editingCommentText}
                              onChange={handleEditingCommentInputChange}
                              onKeyDown={handleEditingCommentInputKeyDown}
                              onBlur={() => {
                                window.setTimeout(() => setEditMentionActive(false), 150);
                              }}
                              rows="4"
                              placeholder="Edit your comment... Use @ to mention someone."
                              disabled={commentEditSaving}
                            />

                            {editMentionActive && editMentionSuggestions.length > 0 && (
                              <div
                                role="listbox"
                                aria-label="Mention suggestions"
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  right: 0,
                                  top: "calc(100% - 2px)",
                                  maxHeight: "260px",
                                  overflowY: "auto",
                                  background: "#ffffff",
                                  border: "2px solid #d9ff3f",
                                  borderRadius: "10px",
                                  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.22)",
                                  zIndex: 1000,
                                }}
                              >
                                <div
                                  style={{
                                    padding: "8px 12px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#64748b",
                                    background: "#f8fafc",
                                    borderBottom: "1px solid #e2e8f0",
                                  }}
                                >
                                  {editMentionSuggestions.length} active user
                                  {editMentionSuggestions.length === 1 ? "" : "s"} available
                                  {" · "}You cannot mention yourself
                                </div>

                                {editMentionSuggestions.map((user, index) => {
                                  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
                                  const selected = index === editMentionSelectedIndex;

                                  return (
                                    <button
                                      key={user.id}
                                      type="button"
                                      role="option"
                                      aria-selected={selected}
                                      onMouseDown={event => {
                                        event.preventDefault();
                                        insertEditMention(user);
                                      }}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        width: "100%",
                                        minHeight: "50px",
                                        padding: "9px 12px",
                                        border: "0",
                                        borderBottom: "1px solid #f1f5f9",
                                        background: selected ? "#efff9c" : "#ffffff",
                                        textAlign: "left",
                                        cursor: "pointer",
                                      }}
                                    >
                                      <span
                                        style={{
                                          width: "28px",
                                          height: "28px",
                                          flexShrink: 0,
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          borderRadius: "50%",
                                          background: "#eff6ff",
                                          color: "#2563eb",
                                          fontWeight: 700,
                                          fontSize: "11px",
                                        }}
                                      >
                                        {fullName.charAt(0).toUpperCase()}
                                      </span>
                                      <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                        <strong style={{ color: "#1e293b", fontSize: "13px" }}>
                                          @{fullName}
                                        </strong>
                                        <span style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>
                                          {user.employee_code}
                                          {user.email ? ` · ${user.email}` : ""}
                                        </span>
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="action-buttons">
                            <button
                              type="button"
                              className="primary-button"
                              onClick={() => handleEditComment(comment.id)}
                              disabled={commentEditSaving || !editingCommentText.trim()}
                            >
                              {commentEditSaving ? "Saving..." : "Save Changes"}
                            </button>

                            <button
                              type="button"
                              className="secondary-button"
                              onClick={cancelEditingComment}
                              disabled={commentEditSaving}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="ticket-comment-text">
                          {renderCommentWithMentions(comment.comment)}
                        </div>
                      )}

                      {comment.attachments?.length > 0 && (
                        <div className="ticket-comment-attachments">
                          <div className="ticket-comment-attachments-title">
                            Attachments <span>{comment.attachments.length}</span>
                          </div>

                          <div className="ticket-comment-attachment-list">
                            {comment.attachments.map(attachment => (
                              <div className="ticket-comment-attachment" key={attachment.id}>
                                <div className="ticket-comment-attachment-info">
                                  <div className="ticket-comment-attachment-icon">
                                    {attachment.content_type?.startsWith("image/") ? "IMG" : "DOC"}
                                  </div>
                                  <div className="ticket-comment-attachment-copy">
                                    <strong title={attachment.file_name}>{attachment.file_name}</strong>
                                    <span>{formatAttachmentSize(attachment.file_size)}</span>
                                  </div>
                                </div>

                                <div className="ticket-comment-attachment-actions">
                                  <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => handleViewAttachment(attachment)}
                                    disabled={attachmentLoadingId === attachment.id}
                                  >
                                    {attachmentLoadingId === attachment.id ? "Opening..." : "View"}
                                  </button>

                                  {hasPermission("comment_ticket") && (
                                    <button
                                      type="button"
                                      className="danger-button"
                                      onClick={() => handleDeleteAttachment(attachment)}
                                      disabled={attachmentLoadingId === attachment.id}
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!isEditing && isOwnComment && hasPermission("comment_ticket") && (
                        <div className="ticket-comment-footer">
                          <button
                            type="button"
                            className="secondary-button ticket-comment-edit-button"
                            onClick={() => startEditingComment(comment)}
                          >
                            Edit Comment
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                </article>
              );
            })}

          </div>
        )}

      </section>


      {/* ======================================================
          HISTORY
      ======================================================= */}

      <section className="section-card history-card">

        <div className="section-card-header">

          <div>

            <div className="history-heading">

              <h3>
                Ticket History
              </h3>

              <span className="history-count-badge">
                {history.length}
                {" "}
                {
                  history.length === 1
                    ? "Event"
                    : "Events"
                }
              </span>

            </div>

            <p>
              Complete audit trail for this ticket.
            </p>

          </div>


          {history.length > 0 && (

            <div className="history-filter-wrapper">

              <label htmlFor="history-filter">
                Activity
              </label>

              <select
                id="history-filter"
                value={
                  historyFilter
                }
                onChange={
                  event =>
                    setHistoryFilter(
                      event.target.value
                    )
                }
              >

                <option value="ALL">
                  All Activities
                </option>


                {historyActions.map(
                  action => (

                    <option
                      key={action}
                      value={action}
                    >

                      {
                        getActionLabel(
                          action
                        )
                      }

                    </option>

                  )
                )}

              </select>

            </div>

          )}

        </div>


        {filteredHistory.length === 0 ? (

          <div className="empty-state">

            <strong>
              No activity recorded
            </strong>

            <p>
              Changes and workflow actions will appear here.
            </p>

          </div>

        ) : (

          <div className="table-container">

            <table className="history-table">

              <thead>

                <tr>

                  <th>
                    #
                  </th>

                  <th>
                    Activity
                  </th>

                  <th>
                    Performed By
                  </th>

                  <th>
                    Change
                  </th>

                  <th>
                    Description
                  </th>

                  <th>
                    Date &amp; Time
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredHistory.map(
                  (
                    item,
                    index
                  ) => (

                    <tr
                      key={
                        item.id ||
                        `${item.action}-${index}`
                      }
                    >

                      <td>

                        <span className="history-row-number">
                          {index + 1}
                        </span>

                      </td>


                      <td>

                        <strong>
                          {
                            getActionLabel(
                              item.action
                            )
                          }
                        </strong>

                        {item.field_name && (

                          <span className="table-secondary-text">
                            {
                              formatField(
                                item.field_name
                              )
                            }
                          </span>

                        )}

                      </td>


                      <td>

                        <div className="history-performer">

                          <span className="history-user-avatar">

                            {
                              getHistoryActor(
                                item
                              )
                                .charAt(0)
                                .toUpperCase()
                            }

                          </span>

                          <strong>
                            {
                              getHistoryActor(
                                item
                              )
                            }
                          </strong>

                        </div>

                      </td>


                      <td>

                        {item.field_name ? (

                          <div className="history-value-change">

                            <span className="history-old-value">
                              {
                                formatHistoryValue(
                                  item.field_name,
                                  item.old_value
                                )
                              }
                            </span>

                            <span className="history-arrow">
                              →
                            </span>

                            <span className="history-new-value">
                              {
                                formatHistoryValue(
                                  item.field_name,
                                  item.new_value
                                )
                              }
                            </span>

                          </div>

                        ) : (

                          <span className="history-no-change">
                            —
                          </span>

                        )}

                      </td>


                      <td>

                        <span className="history-description">

                          {
                            item.description ||
                            "No additional description."
                          }

                        </span>

                      </td>


                      <td>

                        <span className="table-date-text">

                          {
                            formatDate(
                              item.created_at
                            )
                          }

                        </span>

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


export default TicketDetails;


