"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "./NotificationBell";

interface NavItem {
  href: string;
  label: string;
  /** If set, only shown when user has one of these roles */
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",              label: "Resources"      },
  { href: "/create-booking",label: "+ New Booking"  },
  { href: "/my-bookings",   label: "My Bookings"    },
  { href: "/admin-panel",   label: "Admin Panel", roles: ["ROLE_ADMIN"] },
];

/**
 * Application navbar for the Next.js App Router.
 * Replaces the react-router-dom Navbar for auth-aware navigation.
 * Includes the NotificationBell and a logout button.
 *
 * The original Navbar.tsx is left untouched for backward compatibility.
 */
export default function AppNavbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();

  // Don't show navbar on the login page
  if (pathname === "/login") return null;

  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b border-gray-200 bg-white px-6 shadow-sm">
      {/* Brand */}
      <Link
        href="/"
        className="mr-5 text-base font-bold tracking-tight text-blue-600"
      >
        📚 Smart Campus
      </Link>

      {/* Nav links */}
      <div className="flex flex-1 items-center gap-1">
        {NAV_ITEMS.map((item) => {
          // Role-gated items — hide for UX (backend enforces real security)
          if (item.roles && !item.roles.some((r) => user?.roles.includes(r))) {
            return null;
          }

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Right side — bell + user info + logout */}
      {isAuthenticated && (
        <div className="flex items-center gap-3">
          <NotificationBell />

          <span className="hidden text-sm text-gray-500 sm:block">
            {user?.email}
          </span>

          <button
            onClick={logout}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      )}

      {!isAuthenticated && (
        <Link
          href="/login"
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Sign in
        </Link>
      )}
    </nav>
  );
}
