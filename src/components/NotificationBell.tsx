"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMyNotifications,
  markNotificationRead,
  NotificationDTO,
} from "@/services/notificationService";
import { useAuth } from "@/context/AuthContext";

const POLL_INTERVAL_MS = 30_000; // poll every 30 seconds

/**
 * Notification bell for the navbar.
 *
 * - Shows a red badge with unread count
 * - Clicking opens a dropdown list of notifications
 * - Clicking a notification marks it as read
 * - Polls the backend every 30 seconds while the user is authenticated
 */
export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── Fetch notifications ───────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getMyNotifications();
      setNotifications(data);
    } catch {
      // Silently fail — bell should not break the page
    }
  }, [isAuthenticated]);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── Close dropdown on outside click ──────────────────────────────────────

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Mark as read ──────────────────────────────────────────────────────────

  const handleMarkRead = async (notification: NotificationDTO) => {
    if (notification.isRead) return;
    try {
      const updated = await markNotificationRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n))
      );
    } catch {
      // Silently fail
    }
  };

  if (!isAuthenticated) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        {/* Bell icon (inline SVG — no extra dependency) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Notifications
            </h3>
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-400">
                No notifications yet
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => handleMarkRead(n)}
                  className={`cursor-pointer border-b border-gray-50 px-4 py-3 text-sm transition hover:bg-gray-50 ${
                    n.isRead ? "opacity-60" : "font-medium"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Unread dot */}
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                    )}
                    <div className={n.isRead ? "ml-4" : ""}>
                      <p className="text-gray-800">{n.message}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
