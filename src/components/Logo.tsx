import React from 'react';

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" rx="4" />
      <g stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.13 10.39 12 15l-8.13-4.61a2 2 0 0 1-1-1.73V7.34a2 2 0 0 1 1-1.73L12 1l8.13 4.61a2 2 0 0 1 1 1.73v4.02a2 2 0 0 1-1 1.73z"></path>
        <path d="m5.87 7.34 6.13 3.48 6.13-3.48"></path>
        <path d="M12 22V15"></path>
      </g>
    </svg>
  );
}
