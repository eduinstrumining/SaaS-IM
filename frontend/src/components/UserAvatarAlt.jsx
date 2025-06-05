import React from "react";

export default function UserAvatarAlt() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="User avatar alternative"
      role="img"
      className="rounded-full bg-flowforge-panel"
      style={{ width: 32, height: 32 }}
    >
      <circle cx="32" cy="32" r="30" fill="#1E293B" />
      <circle cx="32" cy="20" r="12" fill="#60A5FA" />
      <path
        d="M16 52c0-8.837 7.163-16 16-16s16 7.163 16 16v4H16v-4z"
        fill="#2563EB"
      />
      <path
        d="M32 40c-6 0-11 4-11 9v3h22v-3c0-5-5-9-11-9z"
        fill="#1E40AF"
      />
    </svg>
  );
}
