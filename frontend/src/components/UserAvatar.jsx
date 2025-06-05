import React from "react";

export default function UserAvatar() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="User avatar"
      role="img"
      className="rounded-full bg-flowforge-panel"
      style={{ width: 32, height: 32 }}
    >
      <rect width="48" height="48" rx="12" fill="#1E293B" />
      <circle cx="24" cy="16" r="10" fill="#3B82F6" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 38C12 32.4772 17.4772 28 24 28C30.5228 28 36 32.4772 36 38H12Z"
        fill="#2563EB"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24 36C29.5228 36 34 39.134 34 43H14C14 39.134 18.4772 36 24 36Z"
        fill="#1E40AF"
      />
    </svg>
  );
}
