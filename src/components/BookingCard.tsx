"use client";

import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import EditBookingModal from './EditBookingModal';
import { approveOrReject, cancelBooking } from '../services/bookingApi';
import { useToast } from './ToastContainer';
import axios from 'axios';

interface Booking {
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
}

interface BookingCardProps {
  booking: Booking;
  isAdmin: boolean;
  currentUserId: string;
  onRefresh: () => void;
}

function fmt(dt: string | undefined): string {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function BookingCard({ booking, isAdmin, currentUserId, onRefresh }: BookingCardProps) {
  const [note, setNote]              = useState('');
  const [loading, setLoading]        = useState(false);
  const [error, setError]            = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { showToast } = useToast();

  const handleAction = async (action: string) => {
    setLoading(true); 
    setError('');
    try {
      await approveOrReject(booking.id, { action, adminNote: note });
      const actionText = action.charAt(0) + action.slice(1).toLowerCase();
      showToast(`Booking #${booking.id} ${actionText.toLowerCase()}ed successfully`, 'success');
      setNote('');
      onRefresh();
    } catch (e) {
      const errorMsg = axios.isAxiosError(e) ? e.response?.data?.message : 'Action failed';
      setError(errorMsg || 'Action failed');
      showToast(errorMsg || 'Action failed', 'error');
    } finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return;
    setLoading(true); 
    setError('');
    try {
      await cancelBooking(booking.id, currentUserId);
      showToast(`Booking #${booking.id} cancelled successfully`, 'success');
      onRefresh();
    } catch (e) {
      const errorMsg = axios.isAxiosError(e) ? e.response?.data?.message : 'Cancel failed';
      setError(errorMsg || 'Cancel failed');
      showToast(errorMsg || 'Cancel failed', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="card">
      <div className="booking-header">
        <div>
          <span className="booking-id">#{booking.id}</span>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: 2 }}>{booking.resourceName}</h3>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {booking.purpose && <p className="booking-purpose">"{booking.purpose}"</p>}

      <div className="booking-meta">
        <span className="meta-item">👤 {booking.userId}</span>
        <span className="meta-item">🕐 {fmt(booking.startTime)}</span>
        <span className="meta-item">🕔 {fmt(booking.endTime)}</span>
        <span className="meta-item">📅 Created {fmt(booking.createdAt)}</span>
      </div>

      {booking.adminNote && (
        <p className="admin-note">💬 Admin: {booking.adminNote}</p>
      )}

      {error && <div className="alert alert-error" style={{ marginTop: 10 }}>{error}</div>}

      {isAdmin && booking.status === 'PENDING' && (
        <>
          <div className="note-input">
            <input
              placeholder="Optional admin note..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
          <div className="booking-actions">
            <button className="btn btn-success btn-sm" onClick={() => handleAction('APPROVE')} disabled={loading}>
              ✅ Approve
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => handleAction('REJECT')} disabled={loading}>
              ❌ Reject
            </button>
          </div>
        </>
      )}

      {!isAdmin && currentUserId === booking.userId &&
        (booking.status === 'PENDING' || booking.status === 'APPROVED') && (
        <div className="booking-actions">
          {booking.status === 'PENDING' && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsEditModalOpen(true)} disabled={loading}>
              ✏️ Edit Booking
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleCancel} disabled={loading}>
            🚫 Cancel Booking
          </button>
        </div>
      )}

      <EditBookingModal
        booking={booking}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
}