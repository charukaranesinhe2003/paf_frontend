"use client";

import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { updateBooking } from '@/services/bookingApi';
import DateTimePicker from '@/components/DateTimePicker';
import { useToast } from '@/components/ToastContainer';

interface EditBookingModalProps {
  booking: {
    id: number;
    userId: string;
    resourceName: string;
    startTime: string;
    endTime: string;
    attendeeCount: number;
    purpose?: string;
    status: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ValidationErrors {
  startTime?: string;
  endTime?: string;
  attendeeCount?: string;
}

const RESOURCES = [
  { id: 'lab-a', name: 'Lab A', capacity: 20 },
  { id: 'lab-b', name: 'Lab B', capacity: 20 },
  { id: 'seminar-1', name: 'Seminar Room 1', capacity: 15 },
  { id: 'seminar-2', name: 'Seminar Room 2', capacity: 15 },
  { id: 'auditorium', name: 'Auditorium', capacity: 100 },
  { id: 'meeting-3', name: 'Meeting Room 3', capacity: 8 },
];

const MIN_BOOKING_DURATION = 30;
const MAX_BOOKING_DURATION = 480;

function normalizeLocalDateTime(value: string): string {
  const trimmed = value.trim();
  const hasSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed);
  if (hasSeconds) return trimmed;
  const hasMinutePrecision = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed);
  if (hasMinutePrecision) return `${trimmed}:00`;
  return trimmed;
}

export default function EditBookingModal({ booking, isOpen, onClose, onSuccess }: EditBookingModalProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    startTime: booking.startTime,
    endTime: booking.endTime,
    attendeeCount: booking.attendeeCount.toString(),
    purpose: booking.purpose || '',
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resourceCapacity = useMemo(() => {
    const resource = RESOURCES.find(r => r.name === booking.resourceName);
    return resource?.capacity || 100;
  }, [booking.resourceName]);

  const calculateDuration = () => {
    if (!form.startTime || !form.endTime) return null;
    const diffMs = new Date(form.endTime).getTime() - new Date(form.startTime).getTime();
    return Math.floor(diffMs / 60000);
  };

  const duration = calculateDuration();

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    if (!form.startTime) {
      errors.startTime = 'Start time is required';
    } else if (new Date(form.startTime) <= new Date()) {
      errors.startTime = 'Start time must be in the future';
    }
    if (!form.endTime) {
      errors.endTime = 'End time is required';
    } else if (form.startTime && new Date(form.endTime) <= new Date(form.startTime)) {
      errors.endTime = 'End time must be after start time';
    }
    if (duration !== null) {
      if (duration < MIN_BOOKING_DURATION) errors.startTime = `Booking must be at least ${MIN_BOOKING_DURATION} minutes`;
      if (duration > MAX_BOOKING_DURATION) errors.endTime = `Booking cannot exceed ${MAX_BOOKING_DURATION} minutes`;
    }
    const count = parseInt(form.attendeeCount, 10);
    if (!form.attendeeCount || count < 1) errors.attendeeCount = 'Attendee count must be at least 1';
    if (count > resourceCapacity) errors.attendeeCount = `Cannot exceed ${resourceCapacity} for ${booking.resourceName}`;
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError('');
    try {
      await updateBooking(booking.id, {
        startTime: normalizeLocalDateTime(form.startTime),
        endTime: normalizeLocalDateTime(form.endTime),
        attendeeCount: parseInt(form.attendeeCount, 10),
        purpose: form.purpose || undefined,
      }, booking.userId);
      showToast(`Booking #${booking.id} updated successfully!`, 'success', 4000);
      onSuccess();
      onClose();
    } catch (e: unknown) {
      let msg = 'Failed to update booking';
      if (axios.isAxiosError(e) && e.response) {
        const { status, data } = e.response;
        if (status === 409) msg = 'Booking conflict: Resource is already booked for this time';
        else if (status === 403) msg = 'You can only update your own bookings';
        else if (data?.message) msg = data.message;
      }
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Edit Booking #{booking.id}</h2>
          <button
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-7 py-6 flex flex-col gap-5">
          {error && (
            <div className="rounded-lg bg-red-50 border-l-4 border-red-500 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Resource (read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Resource</label>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500">
              {booking.resourceName}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Resource cannot be changed. Cancel and create a new booking to change resources.
            </p>
          </div>

          {/* Date fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <DateTimePicker
                label="Start Time"
                value={form.startTime}
                onChange={value => {
                  setForm(f => ({ ...f, startTime: value }));
                  setValidationErrors(v => ({ ...v, startTime: undefined }));
                }}
              />
              {validationErrors.startTime && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.startTime}</p>
              )}
            </div>
            <div>
              <DateTimePicker
                label="End Time"
                value={form.endTime}
                onChange={value => {
                  setForm(f => ({ ...f, endTime: value }));
                  setValidationErrors(v => ({ ...v, endTime: undefined }));
                }}
              />
              {validationErrors.endTime && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.endTime}</p>
              )}
            </div>
          </div>

          {/* Duration display */}
          {duration !== null && duration > 0 && (
            <div className="rounded-lg bg-blue-50 border-l-4 border-blue-500 px-4 py-2.5 text-sm text-blue-700 font-medium">
              Duration: {duration} minutes ({(duration / 60).toFixed(1)} hours)
            </div>
          )}

          {/* Attendee count */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Attendee Count</label>
            <input
              type="number"
              min="1"
              max={resourceCapacity}
              value={form.attendeeCount}
              onChange={e => {
                setForm(f => ({ ...f, attendeeCount: e.target.value }));
                setValidationErrors(v => ({ ...v, attendeeCount: undefined }));
              }}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">Max capacity for {booking.resourceName}: {resourceCapacity}</p>
            {validationErrors.attendeeCount && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.attendeeCount}</p>
            )}
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Purpose</label>
            <textarea
              value={form.purpose}
              onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
              placeholder="What is this booking for?"
              rows={3}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {loading ? 'Updating...' : 'Update Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
