import { getAccessToken } from "../auth/auth";

import { API_URL } from "../config";
const API_BASE_URL =
  `${API_URL}`;


// ============================================================
// Generic API request
// ============================================================

async function apiRequest(
  endpoint,
  options = {}
) {

  const token =
    getAccessToken();


  if (!token) {

    throw new Error(
      "Authentication token is missing."
    );

  }


  const response =
    await fetch(
      `${API_BASE_URL}${endpoint}`,
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
            `Bearer ${token}`,

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

      if (data.detail) {
        message =
          data.detail;
      }

    } catch {

      // Ignore JSON parsing failure.

    }


    throw new Error(
      message
    );

  }


  return response.json();

}


// ============================================================
// Get notifications
// ============================================================

export async function getNotifications() {

  return apiRequest(
    "/notifications/"
  );

}


// ============================================================
// Get unread count
// ============================================================

export async function getUnreadNotificationCount() {

  return apiRequest(
    "/notifications/unread-count"
  );

}


// ============================================================
// Mark one notification as read
// ============================================================

export async function markNotificationAsRead(
  notificationId
) {

  return apiRequest(
    `/notifications/${notificationId}/read`,
    {
      method: "PATCH",
    }
  );

}


// ============================================================
// Mark all notifications as read
// ============================================================

export async function markAllNotificationsAsRead() {

  return apiRequest(
    "/notifications/read-all",
    {
      method: "PATCH",
    }
  );

}


