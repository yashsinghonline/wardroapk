import React, { useEffect, useState } from 'react';
import { WireframeShape } from '../types/outfit';

interface ApparelVisualProps {
  src?: string;
  alt: string;
  shape?: WireframeShape;
  label?: string;
  className?: string;
  wireframeSize?: 'xs' | 'sm' | 'md' | 'lg';
}

export const CategoryWireframeSvg: React.FC<{
  shape: WireframeShape;
  className?: string;
}> = ({ shape, className = 'w-10 h-10 theme-text-muted' }) => {
  switch (shape) {
    case 'complete_outfit':
      return (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          {/* Hanger + Complete Full-Body Outfit */}
          <path d="M29 10 a3 3 0 0 1 6 0 c0 2 -3 3 -3 5" />
          <path d="M18 21 L32 15 L46 21" />
          <path d="M22 21 L42 21 L45 34 L41 34 L43 54 L34 54 L32 39 L30 54 L21 54 L23 34 L19 34 Z" />
          <line x1="22" y1="31" x2="42" y2="31" strokeDasharray="2 2" />
        </svg>
      );
    case 'top':
      return (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M22 12 L27 16 Q32 19 37 16 L42 12 L54 20 L48 31 L42 27 L42 52 L22 52 L22 27 L16 31 L10 20 Z" />
        </svg>
      );
    case 'bottom':
      return (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M20 12 L44 12 L47 52 L36 52 L32 28 L28 52 L17 52 Z" />
          <line x1="20" y1="17" x2="44" y2="17" />
        </svg>
      );
    case 'footwear':
      return (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M12 40 L12 31 L22 27 L29 21 L34 28 C41 31 50 32 52 38 L52 44 L12 44 Z" />
          <line x1="12" y1="40" x2="52" y2="40" />
        </svg>
      );
    case 'accessories':
      return (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <rect x="25" y="10" width="14" height="10" rx="2" />
          <circle cx="32" cy="32" r="12" />
          <polyline points="32 26 32 32 36 34" />
          <rect x="25" y="44" width="14" height="10" rx="2" />
        </svg>
      );
    case 'outerwear':
      return (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M21 12 L27 17 L32 15 L37 17 L43 12 L54 20 L49 36 L43 32 L43 52 L21 52 L21 32 L15 36 L10 20 Z" />
          <line x1="32" y1="15" x2="32" y2="52" />
        </svg>
      );
    default:
      return (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M29 12 a3 3 0 0 1 6 0 c0 2 -3 3 -3 5" />
          <path d="M14 25 L32 17 L50 25 L46 29 L18 29 Z" />
          <rect x="20" y="29" width="24" height="22" rx="3" />
        </svg>
      );
  }
};

export const ApparelVisual: React.FC<ApparelVisualProps> = ({
  src,
  alt,
  shape = 'top',
  label,
  className = 'w-full h-full object-cover',
  wireframeSize = 'md',
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const sizeMap = {
    xs: 'w-5 h-5',
    sm: 'w-7 h-7',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  };

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center theme-elevated theme-text-muted select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <CategoryWireframeSvg
          shape={shape}
          className={`${sizeMap[wireframeSize]} theme-text-muted`}
        />
        {(wireframeSize === 'md' || wireframeSize === 'lg') && label && (
          <span className="mt-1.5 text-[10px] font-mono-tech uppercase tracking-wider theme-text-muted px-1 truncate max-w-full">
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
