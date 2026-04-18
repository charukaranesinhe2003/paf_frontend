"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import axios from "axios";
import { getBookingsByUser } from "@/services/bookingApi";
import BookingCard from "@/components/BookingCard";
import ToastContainer, { useToast } from "@/components/ToastContainer";
import styles from "./MyBookings.module.css";

type Booking = {
  id: number;
  userId: string;
  resourceName: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  purpose?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
};

function MyBookingsContent() {
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<"list" | "schedule">("list");
  const [userId, setUserId] = useState("");
  const [input, setInput] = useState("");
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const previousStatusesRef = useRef<Record<number, Booking["status"]>>({});

  useEffect(() => {
    if (!userId) {
      previousStatusesRef.current = {};
      return;
    }

    const previousStatuses = previousStatusesRef.current;
    for (const booking of data) {
      const previousStatus = previousStatuses[booking.id];
      if (!previousStatus || previousStatus === booking.status) {
        continue;
      }

      if (booking.status === "APPROVED") {
        showToast(`Booking #${booking.id} was approved`, "success");
      } else if (booking.status === "REJECTED") {
        showToast(`Booking #${booking.id} was rejected`, "warning");
      }
    }

    previousStatusesRef.current = Object.fromEntries(data.map((booking) => [booking.id, booking.status]));
  }, [data, userId, showToast]);

  const fetchBookings = useCallback(async (uid: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await getBookingsByUser(uid);
      setData(res.data || []);
    } catch (e) {
      const errorMsg = axios.isAxiosError(e) ? e.response?.data?.message : "Could not load bookings.";
      setError(errorMsg || "Could not load bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    setUserId(input.trim());
    fetchBookings(input.trim());
  };

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: data.length,
      pending: data.filter(b => b.status === "PENDING").length,
      approved: data.filter(b => b.status === "APPROVED").length,
      rejected: data.filter(b => b.status === "REJECTED").length,
      cancelled: data.filter(b => b.status === "CANCELLED").length,
    };
  }, [data]);

  const scheduleGroups = useMemo(() => {
    const groups: Record<string, Booking[]> = {};

    const sorted = [...data].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    for (const booking of sorted) {
      const dateKey = new Date(booking.startTime).toLocaleDateString("en-GB", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(booking);
    }

    return Object.entries(groups);
  }, [data]);

  const formatTimeRange = (startTime: string, endTime: string) => {
    const start = new Date(startTime).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const end = new Date(endTime).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${start} - ${end}`;
  };

  return (
    <div className={styles.pageShell}>
      <div className={styles.backdropOrbA}></div>
      <div className={styles.backdropOrbB}></div>

      <div className={styles.container}>
        <div className={styles.headerCard}>
          <div>
            <h1 className={styles.title}>My Bookings</h1>
            <p className={styles.subtitle}>Track requests, monitor approvals, and manage upcoming sessions in one place.</p>
          </div>
        </div>

        <div className={styles.searchSection}>
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <input
              className={styles.searchInput}
              placeholder="Enter your User ID to view bookings..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className={styles.searchBtn} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        {error && (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>!</div>
            <div className={styles.errorMessage}>{error}</div>
          </div>
        )}

        {loading && (
          <div className={styles.statusLoading}>
            <div className={styles.loaderSpinner}></div>
            <div className={styles.loaderText}>Loading your bookings...</div>
          </div>
        )}

        {!loading && userId && data.length > 0 && (
          <div className={styles.bookingStatsBar}>
            <div className={`${styles.statCard} ${styles.statCardPrimary}`}>
              <div className={styles.statLabel}>Total Bookings</div>
              <div className={styles.statValue}>{stats.total}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Pending</div>
              <div className={`${styles.statValue} ${styles.statValuePending}`}>{stats.pending}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Approved</div>
              <div className={`${styles.statValue} ${styles.statValueApproved}`}>{stats.approved}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Rejected</div>
              <div className={`${styles.statValue} ${styles.statValueRejected}`}>{stats.rejected}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Cancelled</div>
              <div className={`${styles.statValue} ${styles.statValueCancelled}`}>{stats.cancelled}</div>
            </div>
          </div>
        )}

        {!loading && userId && data.length > 0 && (
          <div className={styles.controlBar}>
            <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === "list" ? styles.viewBtnActive : ""}`}
              onClick={() => setViewMode("list")}
            >
              List View
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === "schedule" ? styles.viewBtnActive : ""}`}
              onClick={() => setViewMode("schedule")}
            >
              Schedule View
            </button>
            </div>
          </div>
        )}

        {!loading && userId && data.length === 0 && !error && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>0</div>
            <h2 className={styles.emptyTitle}>No Bookings Found</h2>
            <p className={styles.emptyText}>
              No bookings found for <strong>{userId}</strong>. <br />
              Try searching with a different User ID or create a new booking.
            </p>
            <a href="/create-booking" className={styles.emptyAction}>
              Create New Booking
            </a>
          </div>
        )}

        {!loading && userId && data.length > 0 && viewMode === "list" && (
          <ul className={styles.bookingsList}>
            {data.map((b) => (
              <li key={b.id} className={styles.bookingItem}>
                <BookingCard
                  booking={b}
                  isAdmin={false}
                  currentUserId={userId}
                  onRefresh={() => fetchBookings(userId)}
                />
              </li>
            ))}
          </ul>
        )}

        {!loading && userId && data.length > 0 && viewMode === "schedule" && (
          <div className={styles.scheduleView}>
            {scheduleGroups.map(([dateKey, bookings]) => (
              <section key={dateKey} className={styles.scheduleDayGroup}>
                <h3 className={styles.scheduleDayTitle}>{dateKey}</h3>
                <div className={styles.scheduleItems}>
                  {bookings.map((booking) => (
                    <article key={booking.id} className={styles.scheduleItem}>
                      <div className={styles.scheduleTime}>{formatTimeRange(booking.startTime, booking.endTime)}</div>
                      <div className={styles.scheduleMain}>
                        <div className={styles.scheduleResource}>{booking.resourceName}</div>
                        <div className={styles.scheduleMeta}>
                          Booking #{booking.id} • {booking.attendeeCount} attendees • {booking.status}
                        </div>
                        {booking.purpose && <div className={styles.schedulePurpose}>{booking.purpose}</div>}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {!loading && !userId && data.length === 0 && !error && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>?</div>
            <h2 className={styles.emptyTitle}>Search for Your Bookings</h2>
            <p className={styles.emptyText}>
              Enter your User ID above to view all your bookings and manage them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyBookings() {
  return (
    <ToastContainer>
      <MyBookingsContent />
    </ToastContainer>
  );
}