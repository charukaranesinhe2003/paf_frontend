"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getAllBookings } from "@/services/bookingApi";
import BookingCard from "@/components/BookingCard";

type Status = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type Booking = {
  id: number;
  userId: string;
  resourceName: string;
  startTime: string;
  endTime: string;
  purpose?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
};

const TABS: Status[] = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"];

export default function AdminPanel() {
  const [tab, setTab] = useState<Status>("ALL");
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBookings = useCallback(async (status: Status) => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllBookings(status === "ALL" ? undefined : status);
      setData(res.data);
    } catch (e) {
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(tab);
  }, [tab, fetchBookings]);

  return (
    <div className="page-wrap">
      <h1 className="page-title">
        Admin <span>Panel</span>
      </h1>

      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loader">Loading…</div>}

      {!loading && data.length === 0 && (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>
            No bookings with status <strong>{tab}</strong>.
          </p>
        </div>
      )}

      {data.map((b) => (
        <BookingCard
          key={b.id}
          booking={b}
          isAdmin={true}
          currentUserId={""}
          onRefresh={() => fetchBookings(tab)}
        />
      ))}
    </div>
  );
}