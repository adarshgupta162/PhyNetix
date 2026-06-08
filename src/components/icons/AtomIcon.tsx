import React from 'react';

interface AtomIconProps {
  className?: string;
}

export const AtomIcon: React.FC<AtomIconProps> = ({ className = "" }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Nucleus - Center circle */}
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      
      {/* Electron orbit 1 - Diagonal from top-left to bottom-right */}
      <ellipse
        cx="12"
        cy="12"
        rx="9"
        ry="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(-45 12 12)"
      />
      
      {/* Electron orbit 2 - Diagonal from top-right to bottom-left */}
      <ellipse
        cx="12"
        cy="12"
        rx="9"
        ry="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(45 12 12)"
      />
      
      {/* Electron orbit 3 - Horizontal */}
      <ellipse
        cx="12"
        cy="12"
        rx="9"
        ry="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
};
