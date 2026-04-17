"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { createBooking } from '@/services/bookingApi';
import DateTimePicker from '@/components/DateTimePicker';
import styles from './booking.module.css';

interface BookingForm {
  userId: string;
  resourceName: string;
  startTime: string;
  endTime: string;
  purpose: string;
}

interface ValidationErrors {
  userId?: string;
  resourceName?: string;
  startTime?: string;
  endTime?: string;
}

const RESOURCES = [
  { id: 'lab-a', name: 'Lab A', capacity: 20 },
  { id: 'lab-b', name: 'Lab B', capacity: 20 },
  { id: 'seminar-1', name: 'Seminar Room 1', capacity: 15 },
  { id: 'seminar-2', name: 'Seminar Room 2', capacity: 15 },
  { id: 'auditorium', name: 'Auditorium', capacity: 100 },
  { id: 'meeting-3', name: 'Meeting Room 3', capacity: 8 },
];

const MIN_BOOKING_DURATION = 30; // minutes
const MAX_BOOKING_DURATION = 480; // 8 hours in minutes

export default function CreateBooking() {
  const router = useRouter();
  const [form, setForm] = useState<BookingForm>({
    userId: '', resourceName: '', startTime: '', endTime: '', purpose: '',
  });
  
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

    // Validate resourceName
    if (!form.resourceName.trim()) {
      errors.resourceName = 'Please select a resource';
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
      // Times from DateTimePicker are already in format: YYYY-MM-DDTHH:mm (local time)
      // Convert to YYYY-MM-DDTHH:mm:ss format for API
      const startTime = form.startTime + ':00';
      const endTime = form.endTime + ':00';

      const payload = {
        userId: form.userId.trim(),
        resourceName: form.resourceName,
        startTime: startTime,
        endTime: endTime,
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

      const res = await createBooking(payload);

      console.log('✅ Booking created:', res.data);

      setBookingId(res.data.id);
      setShowSuccessModal(true);
      setSuccess(`Booking #${res.data.id} submitted successfully!`);

      // Reset form
      setForm({
        userId: '', resourceName: '', startTime: '', endTime: '', purpose: '',
      });

      // Navigate after 3 seconds
      setTimeout(() => {
        router.push(`/my-bookings?userId=${payload.userId}`);
      }, 3000);
    } catch (e) {
      console.error('❌ Full error object:', e);
      let msg = 'Failed to create booking. Please try again.';
      let details = '';

      if (axios.isAxiosError(e)) {
        console.error('API Error Details:', {
          status: e.response?.status,
          data: e.response?.data,
          statusText: e.response?.statusText,
          config: e.config
        });

        // Check for specific error fields
        const responseData = e.response?.data as any;
        
        if (responseData?.message) {
          msg = responseData.message;
        } else if (responseData?.error) {
          msg = responseData.error;
        } else if (responseData?.fieldErrors) {
          // Handle field-level validation errors
          msg = 'Validation failed:';
          details = Object.entries(responseData.fieldErrors)
            .map(([field, errors]) => `${field}: ${errors}`)
            .join('; ');
        } else if (e.response?.status === 400) {
          msg = 'Validation error from server';
          // Try to extract meaningful error details
          if (typeof responseData === 'string') {
            details = responseData;
          } else {
            details = JSON.stringify(responseData, null, 2);
          }
        } else if (e.response?.status === 409) {
          msg = 'Booking conflict: Resource is already booked for this time';
        } else if (e.response?.status === 500) {
          msg = 'Server error. Please try again later.';
          if (responseData?.message) {
            details = responseData.message;
          }
        } else if (e.code === 'ECONNREFUSED' || e.code === 'ERR_NETWORK') {
          msg = 'Cannot connect to backend server. Is it running on port 8081?';
        } else if (e.message === 'Network Error') {
          msg = 'Network error. Check if backend is running.';
        }
      }

      console.error('Error message to display:', msg);
      console.error('Error details:', details);

      setError(details ? `${msg}\n\n${details}` : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>
          Create New <span className={styles.highlight}>Booking</span>
        </h1>
        <p className={styles.subtitle}>Fill in the details below to request a resource booking</p>
      </div>

      <div className={styles.mainContent}>
        {/* Success Modal */}
        {showSuccessModal && (
          <div className={styles.successModal}>
            <div className={styles.modalContent}>
              <div className={styles.successIcon}>✓</div>
              <h2>Booking Submitted Successfully!</h2>
              <p>Booking ID: <strong>#{bookingId}</strong></p>
              <p className={styles.statusText}>Status: <span className={styles.pendingBadge}>PENDING</span></p>
              <p className={styles.description}>Your booking request is awaiting admin approval.</p>
              <p className={styles.redirectText}>Redirecting to your bookings...</p>
            </div>
          </div>
        )}

        {/* Alert Messages */}
        {error && (
          <div className={styles.alertError}>
            <span className={styles.alertIcon}>⚠️</span>
            <div className={styles.alertContent}>
              <strong>Error</strong>
              <p>{error}</p>
            </div>
            <button
              className={styles.alertClose}
              onClick={() => setError('')}
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        {success && !showSuccessModal && (
          <div className={styles.alertSuccess}>
            <span className={styles.alertIcon}>✓</span>
            <div className={styles.alertContent}>
              <strong>Success</strong>
              <p>{success}</p>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <div className={styles.formCard}>
          <form onSubmit={handleSubmit} noValidate>
            {/* User ID Field */}
            <div className={styles.formGroup}>
              <label htmlFor="userId" className={styles.label}>
                User ID <span className={styles.required}>*</span>
              </label>
              <input
                id="userId"
                type="text"
                name="userId"
                value={form.userId}
                onChange={onChange}
                placeholder="e.g., student_001 or faculty_john"
                className={`${styles.input} ${validationErrors.userId ? styles.inputError : ''}`}
                aria-invalid={!!validationErrors.userId}
                aria-describedby={validationErrors.userId ? 'userId-error' : undefined}
              />
              {validationErrors.userId && (
                <span id="userId-error" className={styles.errorMessage}>
                  {validationErrors.userId}
                </span>
              )}
            </div>

            {/* Resource Selection */}
            <div className={styles.formGroup}>
              <label htmlFor="resourceName" className={styles.label}>
                Select Resource <span className={styles.required}>*</span>
              </label>
              <select
                id="resourceName"
                name="resourceName"
                value={form.resourceName}
                onChange={onChange}
                className={`${styles.select} ${validationErrors.resourceName ? styles.inputError : ''}`}
                aria-invalid={!!validationErrors.resourceName}
                aria-describedby={validationErrors.resourceName ? 'resource-error' : undefined}
              >
                <option value="">— Select a resource —</option>
                {RESOURCES.map((resource) => (
                  <option key={resource.id} value={resource.name}>
                    {resource.name} (Capacity: {resource.capacity})
                  </option>
                ))}
              </select>
              {validationErrors.resourceName && (
                <span id="resource-error" className={styles.errorMessage}>
                  {validationErrors.resourceName}
                </span>
              )}
            </div>

            {/* Date/Time Selection */}
            <div className={styles.dateTimeSection}>
              <div className={styles.formRow}>
                <div className={styles.dateField}>
                  <DateTimePicker
                    label="Start Time"
                    value={form.startTime}
                    onChange={(value) => {
                      setForm(f => ({ ...f, startTime: value }));
                      setValidationErrors(v => ({ ...v, startTime: undefined }));
                    }}
                  />
                  {validationErrors.startTime && (
                    <span className={styles.errorMessage}>{validationErrors.startTime}</span>
                  )}
                </div>

                <div className={styles.dateField}>
                  <DateTimePicker
                    label="End Time"
                    value={form.endTime}
                    onChange={(value) => {
                      setForm(f => ({ ...f, endTime: value }));
                      setValidationErrors(v => ({ ...v, endTime: undefined }));
                    }}
                  />
                  {validationErrors.endTime && (
                    <span className={styles.errorMessage}>{validationErrors.endTime}</span>
                  )}
                </div>
              </div>

              {/* Duration Display */}
              {form.startTime && form.endTime && (
                <div className={styles.durationInfo}>
                  <span className={styles.durationLabel}>Duration:</span>
                  <span className={styles.durationValue}>{calculateDuration()}</span>
                </div>
              )}
            </div>

            {/* Purpose Field */}
            <div className={styles.formGroup}>
              <label htmlFor="purpose" className={styles.label}>
                Purpose <span className={styles.optional}>(Optional)</span>
              </label>
              <textarea
                id="purpose"
                name="purpose"
                value={form.purpose}
                onChange={onChange}
                placeholder="What is this booking for? (e.g., Lab practical, Project work, Student meeting)"
                className={styles.textarea}
                rows={4}
              />
              <p className={styles.helpText}>
                Provide any relevant details about your booking request to help admins make informed decisions.
              </p>
            </div>

            {/* Form Guidelines */}
            <div className={styles.guidelinesBox}>
              <h3 className={styles.guidelinesTitle}>📋 Booking Guidelines</h3>
              <ul className={styles.guidelinesList}>
                <li>Minimum booking duration: <strong>30 minutes</strong></li>
                <li>Maximum booking duration: <strong>8 hours</strong></li>
                <li>Bookings must be in the future</li>
                <li>All bookings require <strong>admin approval</strong></li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className={styles.buttonContainer}>
              <button
                type="submit"
                className={`${styles.submitButton} ${loading ? styles.loading : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Submitting...
                  </>
                ) : (
                  'Submit Booking Request'
                )}
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}