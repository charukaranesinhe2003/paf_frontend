import React from "react";

type Status = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type Props = {
  status: Status;
};

const config: Record<Status, { color: string; bg: string; label: string }> = {
  PENDING: {
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    label: "⏳ Pending",
  },
  APPROVED: {
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    label: "✅ Approved",
  },
  REJECTED: {
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    label: "❌ Rejected",
  },
  CANCELLED: {
    color: "#6b7280",
    bg: "rgba(107,114,128,0.12)",
    label: "🚫 Cancelled",
  },
};

export default function StatusBadge({ status }: Props) {
  const s = config[status] || config.PENDING;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 11px",
        borderRadius: "999px",
        fontSize: "0.78rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.color}44`,
      }}
    >
      {s.label}
    </span>
  );
}