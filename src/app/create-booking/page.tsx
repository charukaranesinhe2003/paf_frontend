"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { createBooking } from '@/services/bookingApi';
import DateTimePicker from '@/components/DateTimePicker';
import ToastContainer, { useToast } from '@/components/ToastContainer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

interface BookingForm {
  userId: string;
  email: string;
  resourceName: string;
  startTime: string;
  endTime: string;
  attendeeCount: string;
  purpose: string;
}

interface ValidationErrors {
  userId?: string;
  email?: string;
  resourceName?: string;
  startTime?: string;
  endTime?: string;
  attendeeCount?: string;
}

type ResourceCategory = 'labs' | 'lecture-halls' | 'library-rooms' | 'auditoriums' | 'meeting-rooms';

interface ResourceOption {
  id: string;
  name: string;
  capacity: number;
  category: ResourceCategory;
}

const RESOURCE_CATEGORIES: Array<{ value: ResourceCategory; label: string }> = [
  { value: 'labs', label: 'Labs' },
  { value: 'lecture-halls', label: 'Lecture Halls' },
  { value: 'library-rooms', label: 'Library Rooms' },
  { value: 'auditoriums', label: 'Auditoriums' },
  { value: 'meeting-rooms', label: 'Meeting Rooms' },
];

const RESOURCES: ResourceOption[] = [
  { id: 'lab-a', name: 'Lab A', capacity: 20, category: 'labs' },
  { id: 'lab-b', name: 'Lab B', capacity: 20, category: 'labs' },
  { id: 'lab-c', name: 'Lab C', capacity: 24, category: 'labs' },
  { id: 'lecture-hall-1', name: 'Lecture Hall 1', capacity: 80, category: 'lecture-halls' },
  { id: 'lecture-hall-2', name: 'Lecture Hall 2', capacity: 120, category: 'lecture-halls' },
  { id: 'library-room-1', name: 'Library Room 1', capacity: 12, category: 'library-rooms' },
  { id: 'library-room-2', name: 'Library Room 2', capacity: 16, category: 'library-rooms' },
  { id: 'auditorium', name: 'Auditorium', capacity: 100, category: 'auditoriums' },
  { id: 'meeting-room-1', name: 'Meeting Room 1', capacity: 8, category: 'meeting-rooms' },
  { id: 'meeting-room-2', name: 'Meeting Room 2', capacity: 10, category: 'meeting-rooms' },
  { id: 'meeting-room-3', name: 'Meeting Room 3', capacity: 8, category: 'meeting-rooms' },
];

const MIN_BOOKING_DURATION = 30; // minutes
const MAX_BOOKING_DURATION = 480; // 8 hours in minutes
const GMAIL_REGEX = /^[a-z0-9._%+-]+@gmail\.com$/;

function normalizeLocalDateTime(value: string): string {
  const trimmed = value.trim();
  // DateTimePicker may return either YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss.
  // Ensure payload is always YYYY-MM-DDTHH:mm:ss.
  const hasSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed);
  if (hasSeconds) return trimmed;

  const hasMinutePrecision = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed);
  if (hasMinutePrecision) return `${trimmed}:00`;

  return trimmed;
}

function CreateBookingContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [form, setForm] = useState<BookingForm>({
    userId: '', email: '', resourceName: '', startTime: '', endTime: '', attendeeCount: '', purpose: '',
  });

  // Pre-fill userId and email from JWT as soon as the user is available
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        userId: user.userId.toString(),
        email: user.email,
      }));
    }
  }, [user]);
  
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(v => ({ ...v, [name]: undefined }));
    }
    // Clear general error
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Validate userId
    if (!form.userId.trim()) {
      errors.userId = 'User ID is required';
    } else if (form.userId.trim().length < 3) {
      errors.userId = 'User ID must be at least 3 characters';
    }

    // Validate email
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!GMAIL_REGEX.test(form.email.trim())) {
      errors.email = 'Please enter a valid Gmail address (example@gmail.com)';
    }

    // Validate resourceName
    if (!form.resourceName.trim()) {
      errors.resourceName = 'Please select a resource';
    }

    // Validate attendeeCount
    if (!form.attendeeCount) {
      errors.attendeeCount = 'Attendee count is required';
    } else {
      const count = parseInt(form.attendeeCount, 10);
      if (isNaN(count) || count < 1) {
        errors.attendeeCount = 'Attendee count must be at least 1';
      } else {
        // Get selected resource capacity
        const selectedResource = RESOURCES.find(r => r.name === form.resourceName);
        if (selectedResource && count > selectedResource.capacity) {
          errors.attendeeCount = `Attendee count cannot exceed capacity of ${selectedResource.capacity}`;
        }
      }
    }

    // Validate startTime
    if (!form.startTime) {
      errors.startTime = 'Start time is required';
    }

    // Validate endTime
    if (!form.endTime) {
      errors.endTime = 'End time is required';
    }

    // Validate time relationship
    if (form.startTime && form.endTime) {
      const startDate = new Date(form.startTime);
      const endDate = new Date(form.endTime);

      if (startDate >= endDate) {
        errors.endTime = 'End time must be after start time';
      } else {
        // Calculate duration in minutes
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationMins = durationMs / (1000 * 60);

        if (durationMins < MIN_BOOKING_DURATION) {
          errors.endTime = `Booking must be at least ${MIN_BOOKING_DURATION} minutes`;
        } else if (durationMins > MAX_BOOKING_DURATION) {
          errors.endTime = `Booking cannot exceed ${MAX_BOOKING_DURATION} minutes (${MAX_BOOKING_DURATION / 60} hours)`;
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateDuration = (): string => {
    if (!form.startTime || !form.endTime) return '';
    const startDate = new Date(form.startTime);
    const endDate = new Date(form.endTime);
    const durationMs = endDate.getTime() - startDate.getTime();
    
    if (durationMs < 0) return '';
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const mins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const startTime = normalizeLocalDateTime(form.startTime);
      const endTime = normalizeLocalDateTime(form.endTime);

      const payload = {
        userId: form.userId.trim(),
        email: form.email.trim().toLowerCase(),
        userEntityId: user?.userId ?? null,   // send DB id for notification dispatch
        resourceName: form.resourceName,
        startTime: startTime,
        endTime: endTime,
        attendeeCount: parseInt(form.attendeeCount, 10),
        purpose: form.purpose.trim() || null,
      };

      // Detailed logging for debugging
      console.log('=== BOOKING REQUEST ===');
      console.log('Raw form data:', form);
      console.log('Processed payload:', payload);
      console.log('Payload JSON:', JSON.stringify(payload, null, 2));
      console.log('Field types:', {
        userId: typeof payload.userId,
        resourceName: typeof payload.resourceName,
        startTime: typeof payload.startTime,
        endTime: typeof payload.endTime,
        purpose: typeof payload.purpose,
      });
      console.log('=======================');

      let res;
      try {
        res = await createBooking(payload);
      } catch (firstError) {
        if (axios.isAxiosError(firstError)) {
          const responseData = firstError.response?.data;
          const responseMessage =
            typeof responseData === 'string'
              ? responseData
              : (typeof responseData?.message === 'string' ? responseData.message : '');

          if (responseMessage.includes('Unrecognized field "email"')) {
            const fallbackPayload = { ...payload };
            delete (fallbackPayload as { email?: string }).email;
            res = await createBooking(fallbackPayload);
            showToast('Booking created, but backend email support is not active yet.', 'warning', 5000);
          } else {
            throw firstError;
          }
        } else {
          throw firstError;
        }
      }

      console.log('✅ Booking created:', res.data);

      setBookingId(res.data.id);
      setShowSuccessModal(true);
      setSuccess(`Booking #${res.data.id} submitted successfully!`);
      showToast(`Booking #${res.data.id} submitted successfully!`, 'success', 4000);

      // Reset form — keep userId and email from JWT
      setForm({
        userId: user?.userId.toString() ?? '',
        email: user?.email ?? '',
        resourceName: '',
        startTime: '',
        endTime: '',
        attendeeCount: '',
        purpose: '',
      });

      // Navigate after 3 seconds
      setTimeout(() => {
        router.push(`/my-bookings`);
      }, 3000);
    } catch (e) {
      let msg = 'Failed to create booking. Please try again.';
      let details = '';

      const isRecord = (value: unknown): value is Record<string, unknown> =>
        typeof value === 'object' && value !== null;

      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        const responseData: unknown = e.response?.data;

        // Keep diagnostics in dev, but avoid noisy console errors in runtime overlay.
        if (process.env.NODE_ENV === 'development') {
          console.debug('API Error Details:', {
            status,
            statusText: e.response?.statusText,
            data: responseData ?? null,
            headers: e.response?.headers,
            requestUrl: e.config?.url,
            method: e.config?.method,
            code: e.code,
            message: e.message,
            hasResponse: Boolean(e.response),
            hasRequest: Boolean(e.request),
          });
        }

        // Priority order for error extraction
        if (isRecord(responseData) && typeof responseData.message === 'string') {
          msg = responseData.message;
        } else if (isRecord(responseData) && typeof responseData.error === 'string') {
          msg = responseData.error;
        } else if (isRecord(responseData) && isRecord(responseData.fieldErrors)) {
          // Handle field-level validation errors
          msg = 'Validation failed:';
          details = Object.entries(responseData.fieldErrors)
            .map(([field, errors]) => `${field}: ${errors}`)
            .join('; ');
        } else if (status === 400 || status === 422) {
          msg = 'Validation error from server';
          // Try to extract meaningful error details
          if (typeof responseData === 'string') {
            details = responseData;
          } else if (responseData) {
            details = JSON.stringify(responseData, null, 2);
          }
        } else if (status === 409) {
          msg = 'Booking conflict: Resource is already booked for this time';
          if (isRecord(responseData) && typeof responseData.message === 'string') {
            details = responseData.message;
          }
        } else if (status === 500) {
          msg = 'Server error. Please try again later.';
          if (isRecord(responseData) && typeof responseData.message === 'string') {
            details = responseData.message;
          } else if (typeof responseData === 'string') {
            details = responseData;
          } else {
            details = JSON.stringify(responseData, null, 2);
          }
        } else if (e.code === 'ECONNREFUSED' || e.code === 'ERR_NETWORK') {
          msg = 'Cannot connect to backend server. Is it running on port 8081?';
        } else if (e.message === 'Network Error') {
          msg = 'Network error. Check if backend is running.';
        } else {
          // Fallback: include full response data
          msg = `API Error (${status}): ${e.response?.statusText || 'Unknown'}`;
          if (typeof responseData === 'string') {
            details = responseData;
          } else if (responseData) {
            details = JSON.stringify(responseData, null, 2);
          }
        }
      } else if (e instanceof Error) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('Non-Axios Error:', {
            name: e.name,
            message: e.message,
            stack: e.stack
          });
        }
        msg = e.message || 'An unexpected error occurred';
      }

      if (process.env.NODE_ENV === 'development') {
        console.debug('Error message to display:', msg);
        console.debug('Error details:', details);
      }

      const errorMsg = details ? `${msg}\n\n${details}` : msg;
      setError(errorMsg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Page header */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">
            Create New <span className="text-blue-600">Booking</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">Fill in the details below to request a resource booking</p>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">✓</div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Booking Submitted!</h2>
              <p className="text-sm text-gray-600 mb-1">Booking ID: <strong>#{bookingId}</strong></p>
              <span className="inline-block rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-semibold mb-3">PENDING</span>
              <p className="text-xs text-gray-400">Redirecting to your bookings...</p>
            </div>
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <span className="text-red-500 font-bold">⚠️</span>
            <div className="flex-1 text-sm text-red-700">
              <strong>Error</strong>
              <p className="mt-0.5 whitespace-pre-wrap">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 text-lg leading-none" aria-label="Close">×</button>
          </div>
        )}

        {/* 2-column layout */}
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200 h-fit">
            <h2 className="text-base font-bold text-gray-800 mb-2">Plan Smarter</h2>
            <p className="text-sm text-gray-500 mb-4">Request a resource quickly, avoid conflicts, and get faster approval.</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {['Fast Request', 'Capacity Checked', 'Conflict Detection'].map(p => (
                <span key={p} className="rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-semibold">{p}</span>
              ))}
            </div>
            {[
              'Enter requester and contact details',
              'Select resource, attendees, and time',
              'Submit and wait for admin approval',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3 mb-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{i + 1}</span>
                <span className="text-sm text-gray-600">{step}</span>
              </div>
            ))}
          </aside>

          {/* Form card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {/* Step 1 */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-0.5">Step 1</p>
                <h3 className="text-base font-bold text-gray-800 mb-4">Requester Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                    <input id="userId" type="text" value={form.userId} readOnly
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input id="email" type="email" value={form.email} readOnly
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-0.5">Step 2</p>
                <h3 className="text-base font-bold text-gray-800 mb-4">Booking Details</h3>

                {/* Resource */}
                <div className="mb-4">
                  <label htmlFor="resourceName" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Resource <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="resourceName" name="resourceName" value={form.resourceName} onChange={onChange}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-blue-500 ${validationErrors.resourceName ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">— Select a resource —</option>
                    {RESOURCE_CATEGORIES.map((category) => (
                      <optgroup key={category.value} label={category.label}>
                        {RESOURCES.filter(r => r.category === category.value).map(r => (
                          <option key={r.id} value={r.name}>{r.name} (Capacity: {r.capacity})</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {validationErrors.resourceName && <p className="mt-1 text-xs text-red-600">{validationErrors.resourceName}</p>}
                </div>

                {/* Attendees */}
                <div className="mb-4">
                  <label htmlFor="attendeeCount" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Attendees <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="attendeeCount" type="number" name="attendeeCount" value={form.attendeeCount}
                    onChange={onChange} placeholder="e.g., 5" min="1"
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-blue-500 ${validationErrors.attendeeCount ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  />
                  {validationErrors.attendeeCount && <p className="mt-1 text-xs text-red-600">{validationErrors.attendeeCount}</p>}
                </div>

                {/* Date/time */}
                <div className="grid gap-4 sm:grid-cols-2 mb-2">
                  <div>
                    <DateTimePicker label="Start Time" value={form.startTime}
                      onChange={v => { setForm(f => ({ ...f, startTime: v })); setValidationErrors(e => ({ ...e, startTime: undefined })); }} />
                    {validationErrors.startTime && <p className="mt-1 text-xs text-red-600">{validationErrors.startTime}</p>}
                  </div>
                  <div>
                    <DateTimePicker label="End Time" value={form.endTime}
                      onChange={v => { setForm(f => ({ ...f, endTime: v })); setValidationErrors(e => ({ ...e, endTime: undefined })); }} />
                    {validationErrors.endTime && <p className="mt-1 text-xs text-red-600">{validationErrors.endTime}</p>}
                  </div>
                </div>
                {form.startTime && form.endTime && (
                  <div className="rounded-lg bg-blue-50 border-l-4 border-blue-500 px-4 py-2 text-sm text-blue-700 font-medium">
                    Duration: {calculateDuration()}
                  </div>
                )}
              </div>

              {/* Step 3 */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-0.5">Step 3</p>
                <h3 className="text-base font-bold text-gray-800 mb-4">Purpose & Submission</h3>
                <div className="mb-4">
                  <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                  <textarea
                    id="purpose" name="purpose" value={form.purpose} onChange={onChange}
                    placeholder="What is this booking for?" rows={4}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-400">Provide details to help admins make informed decisions.</p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit" disabled={loading}
                  className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
                >
                  {loading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                  {loading ? 'Submitting...' : 'Submit Booking Request'}
                </button>
                <button
                  type="button" disabled={loading} onClick={() => router.back()}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateBooking() {
  return (
    <ProtectedRoute>
      <ToastContainer>
        <CreateBookingContent />
      </ToastContainer>
    </ProtectedRoute>
  );
}