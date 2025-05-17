import React from "react";

interface SpinnerProps {
  className?: string;
  color?: string;
  size?: number;
}

/**
 * A simple animated spinner for loading states.
 * Default color is currentColor (inherits from parent), but can be overridden.
 */
export const Spinner: React.FC<SpinnerProps> = ({ className = "", color = "currentColor", size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`animate-spin h-6 w-6 ${className}`.trim()}
    aria-label="Loading"
    role="status"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default Spinner;
