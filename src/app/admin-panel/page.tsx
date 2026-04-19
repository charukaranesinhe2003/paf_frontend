"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getAllBookings } from "@/services/bookingApi";
import BookingCard from "@/components/BookingCard";
import ToastContainer from "@/components/ToastContainer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import PageShell from "@/components/PageShell";
import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";

type Status = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

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

type Analytics = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  mostUsedResource: string;
};

const TABS: Status[] = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"];

export default function AdminPanel() {
  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <AdminPanelContent />
    </ProtectedRoute>
  );
}

function AdminPanelContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Status>("ALL");
  const [data, setData] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    mostUsedResource: "N/A",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const computeAnalytics = useCallback((bookings: Booking[]): Analytics => {
    const resourceCounts: Record<string, number> = {};

    for (const booking of bookings) {
      resourceCounts[booking.resourceName] = (resourceCounts[booking.resourceName] || 0) + 1;
    }

    const mostUsedResource =
      Object.entries(resourceCounts)
        .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))[0]?.[0] || "N/A";

    return {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "PENDING").length,
      approved: bookings.filter((b) => b.status === "APPROVED").length,
      rejected: bookings.filter((b) => b.status === "REJECTED").length,
      cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
      mostUsedResource,
    };
  }, []);

  const fetchBookings = useCallback(async (status: Status) => {
    setLoading(true);
    setError("");
    try {
      const [filteredRes, allRes] = await Promise.all([
        getAllBookings(status === "ALL" ? null : status),
        getAllBookings(null),
      ]);
      setData(filteredRes.data);
      setAnalytics(computeAnalytics(allRes.data));
    } catch {
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, [computeAnalytics]);

  useEffect(() => {
    fetchBookings(tab);
  }, [tab, fetchBookings]);

  const tabCount = (status: Status) => {
    if (status === "ALL") return analytics.total;
    if (status === "PENDING") return analytics.pending;
    if (status === "APPROVED") return analytics.approved;
    if (status === "REJECTED") return analytics.rejected;
    return analytics.cancelled;
  };

  return (
    <ToastContainer>
      <PageShell>
        <SectionHeader
          title="Admin Panel"
          subtitle="Review incoming requests, handle approvals, and monitor booking activity in real time."
        />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mb-6">
          <StatCard label="Total Bookings" value={analytics.total} primary color="blue" />
          <StatCard label="Pending"         value={analytics.pending}   color="yellow" />
          <StatCard label="Approved"        value={analytics.approved}  color="green" />
          <StatCard label="Rejected"        value={analytics.rejected}  color="red" />
          <StatCard label="Cancelled"       value={analytics.cancelled} color="gray" />
          <StatCard label="Top Resource"    value={analytics.mostUsedResource} color="blue" />
        </div>

        {/* Tab bar */}
        <div className="mb-6 rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Filter by status</p>
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  tab === t
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t}
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  tab === t ? "bg-white/20 text-white" : "bg-white text-gray-600"
                }`}>
                  {tabCount(t)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl bg-white border border-gray-200 p-10 text-center text-gray-500 shadow-sm">
            Loading bookings...
          </div>
        )}

        {/* Empty */}
        {!loading && data.length === 0 && (
          <div className="rounded-2xl bg-white border border-gray-200 p-16 text-center shadow-sm">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500">No bookings with status <strong>{tab}</strong>.</p>
          </div>
        )}

        {/* Booking list */}
        {!loading && data.length > 0 && (
          <div className="flex flex-col gap-3">
            {data.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                isAdmin={true}
                currentUserId={user?.userId?.toString() ?? ""}
                onRefresh={() => fetchBookings(tab)}
              />
            ))}
          </div>
        )}
      </PageShell>
    </ToastContainer>
  );
}