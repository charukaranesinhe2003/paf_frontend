"use client";

import React, { useState } from 'react';
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

const statusConfig: Record<string, { label: string; classes: string }> = {
  PENDING:   { label: '⏳ Pending',   classes: 'bg-amber-100 text-amber-700 border border-amber-300' },
  APPROVED:  { label: '✅ Approved',  classes: 'bg-emerald-100 text-emerald-700 border border-emerald-300' },
  REJECTED:  { label: '❌ Rejected',  classes: 'bg-red-100 text-red-700 border border-red-300' },
  CANCELLED: { label: '🚫 Cancelled', classes: 'bg-gray-100 text-gray-600 border border-gray-300' },
};

export default function BookingCard({ booking, isAdmin, currentUserId, onRefresh }: BookingCardProps) {
  const [note, setNote]              = useState('');
  const [loading, setLoading]        = useState(false);
  const [error, setError]            = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { showToast } = useToast();

  const getActionSuccessMessage = (action: string) => {
    if (action === 'APPROVE') return `Booking #${booking.id} approved successfully`;
    if (action === 'REJECT') return `Booking #${booking.id} rejected successfully`;
    return `Booking #${booking.id} updated successfully`;
  };

  const handleAction = async (action: string) => {
    setLoading(true);
    setError('');
    try {
      await approveOrReject(booking.id, { action, adminNote: note });
      showToast(getActionSuccessMessage(action), 'success');
      setNote('');
      onRefresh();
    } catch (e) {
      const errorMsg = axios.isAxiosError(e)
        ? e.response?.data?.message || e.response?.data?.error
        : 'Action failed';
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
      const errorMsg = axios.isAxiosError(e)
        ? e.response?.data?.message || e.response?.data?.error
        : 'Cancel failed';
      setError(errorMsg || 'Cancel failed');
      showToast(errorMsg || 'Cancel failed', 'error');
    } finally { setLoading(false); }
  };

  const status = statusConfig[booking.status] ?? { label: booking.status, classes: 'bg-gray-100 text-gray-600' };

  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-blue-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            Booking #{booking.id}
          </p>
          <h3 className="text-lg font-bold text-gray-900">{booking.resourceName}</h3>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.classes}`}>
          {status.label}
        </span>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-4 pb-5 mb-5 border-b border-gray-100 sm:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">📅 Date & Time</p>
          <p className="text-sm text-gray-800 font-medium">{fmt(booking.startTime)} – {fmt(booking.endTime)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">👥 Attendees</p>
          <p className="text-sm text-gray-800 font-medium">
            {booking.attendeeCount} {booking.attendeeCount === 1 ? 'person' : 'people'}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">👤 User ID</p>
          <p className="text-sm text-gray-800 font-medium">{booking.userId}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">⏰ Created</p>
          <p className="text-sm text-gray-800 font-medium">{fmt(booking.createdAt)}</p>
        </div>
      </div>

      {/* Purpose */}
      {booking.purpose && (
        <div className="mb-4 rounded-lg bg-gray-50 border-l-4 border-blue-500 px-4 py-3">
          <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Purpose</span>
          <p className="text-sm text-gray-700">{booking.purpose}</p>
        </div>
      )}

      {/* Admin Note */}
      {booking.adminNote && (
        <div className="mb-4 rounded-lg bg-blue-50 border-l-4 border-blue-500 px-4 py-3">
          <span className="block text-xs font-semibold uppercase tracking-wide text-blue-500 mb-1">Admin Note</span>
          <p className="text-sm text-gray-700">{booking.adminNote}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border-l-4 border-red-500 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Admin Actions */}
      {isAdmin && booking.status === 'PENDING' && (
        <>
          <textarea
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 resize-none mb-3"
            placeholder="Add an optional admin note..."
            rows={2}
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            <button
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 transition"
              onClick={() => handleAction('APPROVE')}
              disabled={loading}
            >
              ✅ Approve
            </button>
            <button
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition"
              onClick={() => handleAction('REJECT')}
              disabled={loading}
            >
              ❌ Reject
            </button>
          </div>
        </>
      )}

      {/* Student Actions */}
      {!isAdmin && currentUserId === booking.userId &&
        (booking.status === 'PENDING' || booking.status === 'APPROVED') && (
        <div className="flex gap-2 flex-wrap mt-4">
          {booking.status === 'PENDING' && (
            <button
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition"
              onClick={() => setIsEditModalOpen(true)}
              disabled={loading}
            >
              ✏️ Edit Booking
            </button>
          )}
          <button
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition"
            onClick={handleCancel}
            disabled={loading}
          >
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
