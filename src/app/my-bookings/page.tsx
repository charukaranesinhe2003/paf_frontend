"use client";

import React, { useState, useCallback } from "react";
import axios from "axios";
import { getBookingsByUser } from "@/services/bookingApi";
import BookingCard from "@/components/BookingCard";
import ToastContainer from "@/components/ToastContainer";

type Booking = {
  id: number;
  userId: string;
  resourceName: string;
  startTime: string;
  endTime: string;
  purpose?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
};

export default function MyBookings() {
  const [userId, setUserId] = useState("");
  const [input, setInput] = useState("");
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBookings = useCallback(async (uid: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await getBookingsByUser(uid);
      setData(res.data);
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

  return (
    <ToastContainer>
      <div className="page-wrap">
        <h1 className="page-title">
          My <span>Bookings</span>
        </h1>

        <div className="card" style={{ maxWidth: 460, marginBottom: 28 }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 10 }}>
            <input
              style={{
                flex: 1,
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "9px 14px",
                color: "var(--text)",
                fontFamily: "inherit",
                fontSize: "0.95rem",
                outline: "none",
              }}
              placeholder="Enter your User ID..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {loading && <div className="loader">Loading…</div>}

        {!loading && userId && data.length === 0 && (
          <div className="empty-state">
            <div className="icon">📭</div>
            <p>
              No bookings found for <strong>{userId}</strong>.
            </p>
          </div>
        )}

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
    </ToastContainer>
  );
}