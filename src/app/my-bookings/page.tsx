"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import axios from "axios";
import { getBookingsByUser } from "@/services/bookingApi";
import BookingCard from "@/components/BookingCard";
import ToastContainer, { useToast } from "@/components/ToastContainer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import PageShell from "@/components/PageShell";
import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";

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
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"list" | "schedule">("list");
  // userId is now sourced from the JWT — no manual input needed
  const userId = user?.userId?.toString() ?? "";
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
    } catch (e: unknown) {
      const errorMsg = axios.isAxiosError(e) ? (e.response?.data?.message as string | undefined) : undefined;
      setError(errorMsg || "Could not load bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load bookings when the authenticated user is available
  useEffect(() => {
    if (userId) {
      fetchBookings(userId);
    }
  }, [userId, fetchBookings]);

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
    <PageShell>
      <SectionHeader
        title="My Bookings"
        subtitle="Track requests, monitor approvals, and manage upcoming sessions in one place."
      />

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <span className="font-bold">!</span> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl bg-white border border-gray-200 p-10 text-center shadow-sm">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mb-3" />
          <p className="text-gray-500 text-sm">Loading your bookings...</p>
        </div>
      )}

      {/* Stats */}
      {!loading && userId && data.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-6">
          <StatCard label="Total"     value={stats.total}     primary color="blue" />
          <StatCard label="Pending"   value={stats.pending}   color="yellow" />
          <StatCard label="Approved"  value={stats.approved}  color="green" />
          <StatCard label="Rejected"  value={stats.rejected}  color="red" />
          <StatCard label="Cancelled" value={stats.cancelled} color="gray" />
        </div>
      )}

      {/* View toggle */}
      {!loading && userId && data.length > 0 && (
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              viewMode === "list" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            List View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("schedule")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              viewMode === "schedule" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Schedule View
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && userId && data.length === 0 && !error && (
        <div className="rounded-2xl bg-white border border-gray-200 p-16 text-center shadow-sm">
          <p className="text-4xl mb-3">📋</p>
          <h2 className="text-lg font-bold text-gray-800 mb-2">No Bookings Found</h2>
          <p className="text-gray-500 text-sm mb-5">You have no bookings yet. Create one to get started.</p>
          <a
            href="/create-booking"
            className="inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Create New Booking
          </a>
        </div>
      )}

      {/* List view */}
      {!loading && userId && data.length > 0 && viewMode === "list" && (
        <div className="flex flex-col gap-3">
          {data.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              isAdmin={false}
              currentUserId={userId}
              onRefresh={() => fetchBookings(userId)}
            />
          ))}
        </div>
      )}

      {/* Schedule view */}
      {!loading && userId && data.length > 0 && viewMode === "schedule" && (
        <div className="flex flex-col gap-4">
          {scheduleGroups.map(([dateKey, bookings]) => (
            <section key={dateKey} className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
              <h3 className="px-5 py-3 text-sm font-bold text-gray-800 bg-gray-50 border-b border-gray-100">
                {dateKey}
              </h3>
              <div className="divide-y divide-gray-50">
                {bookings.map((booking) => (
                  <article key={booking.id} className="grid grid-cols-[120px_1fr] gap-4 px-5 py-4">
                    <div className="text-sm font-bold text-gray-900">
                      {formatTimeRange(booking.startTime, booking.endTime)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{booking.resourceName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Booking #{booking.id} · {booking.attendeeCount} attendees · {booking.status}
                      </p>
                      {booking.purpose && (
                        <p className="text-xs text-gray-600 mt-1">{booking.purpose}</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}

export default function MyBookings() {
  return (
    <ProtectedRoute>
      <ToastContainer>
        <MyBookingsContent />
      </ToastContainer>
    </ProtectedRoute>
  );
}