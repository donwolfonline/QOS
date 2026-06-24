import React from 'react';
import { clsx } from 'clsx';

interface NeonContainerProps {
  children: React.ReactNode;
  className?: string;
  /** 'primary' = green glow, 'accent' = blue glow, 'danger' = red glow */
  variant?: 'primary' | 'accent' | 'danger';
  /** If true, renders as a clickable card */
  interactive?: boolean;
  onClick?: () => void;
}

const glowMap = {
  primary: 'border-qos-primary shadow-[0_0_16px_rgba(0,255,65,0.25)] hover:shadow-[0_0_28px_rgba(0,255,65,0.45)]',
  accent:  'border-qos-accent  shadow-[0_0_16px_rgba(0,212,255,0.25)] hover:shadow-[0_0_28px_rgba(0,212,255,0.45)]',
  danger:  'border-qos-danger  shadow-[0_0_16px_rgba(255,0,60,0.25)]  hover:shadow-[0_0_28px_rgba(255,0,60,0.45)]',
};

export function NeonContainer({
  children,
  className,
  variant = 'primary',
  interactive = false,
  onClick,
}: NeonContainerProps) {
  const Tag = interactive ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={clsx(
        'relative bg-qos-surface border rounded-sm p-4 transition-all duration-300',
        glowMap[variant],
        interactive && 'cursor-pointer w-full text-left',
        className,
      )}
    >
      {/* Corner accents */}
      <span className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-current opacity-60" />
      <span className="pointer-events-none absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-current opacity-60" />
      <span className="pointer-events-none absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-current opacity-60" />
      <span className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-current opacity-60" />
      {children}
    </Tag>
  );
}
