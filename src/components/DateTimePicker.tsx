"use client";

import React, { useState, useRef, useEffect } from 'react';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export default function DateTimePicker({ value, onChange, label }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState<Date>(value ? new Date(value) : new Date());
  const [month, setMonth] = useState(displayDate.getMonth());
  const [year, setYear] = useState(displayDate.getFullYear());
  const [hour, setHour] = useState(displayDate.getHours());
  const [minute, setMinute] = useState(displayDate.getMinutes());
  const [error, setError] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get days in month
  const daysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = [];
  const totalDays = daysInMonth(month, year);

  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  // Check if a date is in the past
  const isPastDate = (day: number, m: number, y: number) => {
    const checkDate = new Date(y, m, day);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // Check if a time is in the past (for today)
  const isPastTime = () => {
    const now = new Date();
    const selectedDate = new Date(year, month, displayDate.getDate());
    selectedDate.setHours(hour, minute, 0, 0);
    return selectedDate <= now;
  };

  // Get current time dynamically
  const getCurrentTime = () => {
    const now = new Date();
    return { hour: now.getHours(), minute: now.getMinutes(), date: now.getDate() };
  };

  const current = getCurrentTime();

  const handleDateClick = (day: number) => {
    if (isPastDate(day, month, year)) {
      setError('Cannot select a past date');
      return;
    }
    setError('');
    const newDate = new Date(year, month, day, hour, minute);
    setDisplayDate(newDate);
  };

  const handleOK = () => {
    if (isPastDate(displayDate.getDate(), month, year)) {
      setError('Cannot select a past date');
      return;
    }
    if (isPastTime()) {
      setError('Cannot select a past time');
      return;
    }
    setError('');
    const newDate = new Date(year, month, displayDate.getDate(), hour, minute);
    // Format as local time without UTC conversion: YYYY-MM-DDTHH:mm:ss
    const pad = (n: number) => String(n).padStart(2, '0');
    const localTimeString = `${year}-${pad(month + 1)}-${pad(newDate.getDate())}T${pad(hour)}:${pad(minute)}:00`;
    onChange(localTimeString);
    setIsOpen(false);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const displayValue = value ? new Date(value).toLocaleString('en-GB', { 
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : 'Select date & time';

  return (
    <div className="form-group" ref={pickerRef} style={{ position: 'relative' }}>
      <label>{label}</label>
      <input
        type="text"
        readOnly
        value={displayValue}
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer', background: '#f5f5f5' }}
        placeholder="Click to select"
      />
      {error && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>⚠ {error}</div>}

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          zIndex: 1000,
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          marginTop: '8px',
          minWidth: '380px',
        }}>
          {/* Header with month/year */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setMonth(m => m === 0 ? 11 : m - 1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}
            >
              ←
            </button>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              style={{ padding: '4px', marginRight: '8px' }}
            >
              {Array.from({ length: 5 }, (_, i) => year - 2 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              style={{ padding: '4px', flex: 1 }}
            >
              {monthNames.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setMonth(m => m === 11 ? 0 : m + 1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}
            >
              →
            </button>
          </div>

          {/* Calendar grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            marginBottom: '16px',
          }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontWeight: 600, fontSize: '12px', color: '#666' }}>
                {d}
              </div>
            ))}
            {days.map((day, idx) => {
              const isPast = day && isPastDate(day, month, year);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => day && !isPast && handleDateClick(day)}
                  disabled={!day || isPast}
                  title={isPast && day ? 'Past date not allowed' : ''}
                  style={{
                    padding: '8px',
                    border: isPast && day ? '1px solid #fee2e2' : '1px solid #ddd',
                    borderRadius: '4px',
                    background: day && new Date(year, month, day).toDateString() === displayDate.toDateString() 
                      ? '#4f46e5' 
                      : isPast && day ? '#fee2e2' : day ? 'white' : 'transparent',
                    color: day && new Date(year, month, day).toDateString() === displayDate.toDateString()
                      ? 'white' 
                      : isPast && day ? '#fca5a5' : '#333',
                    cursor: day && !isPast ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: day ? 500 : 400,
                    opacity: isPast && day ? 0.5 : 1,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time selector */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '12px',
            alignItems: 'center',
          }}>
            <label style={{ fontSize: '14px', color: '#666' }}>Time:</label>
            <input
              type="number"
              min="0"
              max="23"
              value={String(hour).padStart(2, '0')}
              onChange={(e) => {
                const newHour = Math.min(23, Math.max(0, parseInt(e.target.value) || 0));
                setHour(newHour);
              }}
              style={{ width: '50px', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <span>:</span>
            <input
              type="number"
              min="0"
              max="59"
              value={String(minute).padStart(2, '0')}
              onChange={(e) => {
                const newMinute = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                setMinute(newMinute);
              }}
              style={{ width: '50px', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#999' }}>
              {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
            </span>
            {new Date(year, month, displayDate.getDate()).toDateString() === today.toDateString() && (
              <span style={{ fontSize: '11px', color: '#f97316' }}>
                (min: {String(current.hour).padStart(2, '0')}:{String(current.minute).padStart(2, '0')})
              </span>
            )}
          </div>

          {/* OK button */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: '#f5f5f5',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleOK}
              disabled={!!error}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                background: error ? '#d1d5db' : '#4f46e5',
                color: 'white',
                cursor: error ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              ✓ OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
