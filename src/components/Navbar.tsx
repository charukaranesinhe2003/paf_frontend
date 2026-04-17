import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
}

const NAV: NavItem[] = [
  { to: '/create',  label: '+ New Booking' },
  { to: '/my',      label: 'My Bookings'   },
  { to: '/admin',   label: 'Admin Panel'   },
];

export default function Navbar() {
  return (
    <nav style={{
      background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      padding: '0 24px', display: 'flex', alignItems: 'center',
      gap: '8px', height: '58px', position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent)', marginRight: 20, letterSpacing: '-0.02em' }}>
        📚 PAF Booking
      </div>
      {NAV.map(n => (
        <NavLink key={n.to} to={n.to}
          style={({ isActive }: { isActive: boolean }) => ({
            padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem',
            fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s',
            background: isActive ? 'var(--accent)' : 'transparent',
            color:      isActive ? '#fff'          : 'var(--text-dim)',
          })}>
          {n.label}
        </NavLink>
      ))}
    </nav>
  );
}