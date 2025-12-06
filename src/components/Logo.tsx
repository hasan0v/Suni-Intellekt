"use client";

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import '../styles/logo.css';

export interface LogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean; // show brand text next to logo
  uppercase?: boolean; // use fully uppercase brand text
  className?: string;
  textClassName?: string;
  badgeClassName?: string;
  stacked?: boolean; // logo above text
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  ariaLabel?: string;
}

// Centralized brand constants
const BRAND_NAME_STANDARD = 'Süni Intellekt';
const BRAND_NAME_UPPER = 'SÜNİ İNTELLEKT';

export const Logo: React.FC<LogoProps> = ({
  href = '/',
  size = 'md',
  showText = true,
  uppercase = false,
  className,
  textClassName,
  badgeClassName,
  stacked = false,
  onClick,
  ariaLabel = 'Go to Süni Intellekt home'
}) => {
  const sizeMap = {
    sm: { badge: 'w-10 h-10', image: 40, gap: 'gap-3', text: 'text-lg' },
    md: { badge: 'w-12 h-12', image: 48, gap: 'gap-4', text: 'text-xl' },
    lg: { badge: 'w-16 h-16', image: 64, gap: 'gap-5', text: 'text-2xl' }
  } as const;

  const s = sizeMap[size];
  const brand = uppercase ? BRAND_NAME_UPPER : BRAND_NAME_STANDARD;

  // Build className strings statically to avoid hydration mismatches
  const linkClasses = [
    'group inline-flex select-none items-center samsung-body tracking-tight transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-samsung-blue',
    'logo-container-samsung',
    stacked ? 'flex-col' : s.gap,
    className
  ].filter(Boolean).join(' ');

  const badgeClasses = [
    'flex items-center justify-center transition-all duration-500 ease-out rounded-2xl',
    'bg-gradient-to-br from-samsung-blue to-samsung-blue-dark p-2.5',
    'group-hover:scale-105 group-hover:shadow-samsung-float',
    'shadow-samsung-card',
    s.badge,
    badgeClassName
  ].filter(Boolean).join(' ');

  const textClasses = [
    'logo-text-samsung samsung-heading',
    s.text,
    stacked ? 'mt-3' : '',
    textClassName
  ].filter(Boolean).join(' ');

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      onClick={onClick}
      className={linkClasses}
    >
      {showText && (
        <span className={textClasses}>
          {brand}
        </span>
      )}
    </Link>
  );
};

export default Logo;
