import React, { useState } from "react";

/**
 * --------------------------------------------------------------------------
 * WIDGETS D'INSPIRATION FLUTTER (MATERIAL DESIGN 3) POUR REACT / PWA
 * Offre le rendu visuel, la réactivité tactile et les animations 60fps
 * d'une application native Flutter (Dart/Material 3).
 * --------------------------------------------------------------------------
 */

/* 1. Flutter Floating Action Button (FAB) */
interface FlutterFABProps {
  icon: string;
  label?: string;
  extended?: boolean;
  onClick: () => void;
  className?: string;
  badge?: number | string;
  color?: "primary" | "accent" | "secondary" | "surface";
}

export function FlutterFAB({
  icon,
  label,
  extended = false,
  onClick,
  className = "",
  badge,
  color = "primary"
}: FlutterFABProps) {
  const colorClasses = {
    primary: "bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-container",
    accent: "bg-accent text-white shadow-lg shadow-accent/25 hover:bg-amber-600",
    secondary: "bg-secondary text-white shadow-lg shadow-secondary/25 hover:bg-sky-700",
    surface: "bg-surface-container-highest text-primary border border-outline-variant/30 shadow-md"
  };

  const handleClick = () => {
    if ("vibrate" in navigator) {
      try { navigator.vibrate(12); } catch { /* ignore */ }
    }
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center gap-2.5 h-14 rounded-2xl font-sans font-bold text-sm transition-all duration-200 active:scale-90 cursor-pointer select-none ${
        extended ? "px-5" : "w-14"
      } ${colorClasses[color]} ${className}`}
    >
      <span className="material-symbols-outlined text-[24px] transition-transform duration-300 group-hover:rotate-12">
        {icon}
      </span>
      {extended && label && <span className="whitespace-nowrap tracking-wide">{label}</span>}
      
      {badge !== undefined && (
        <span className="absolute -top-1.5 -right-1.5 bg-error text-white font-mono text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-surface animate-pulse">
          {badge}
        </span>
      )}
    </button>
  );
}

/* 2. Flutter InkWell Card (Effet de pression tactile & Élevation Material 3) */
interface FlutterCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "elevated" | "filled" | "outlined";
  className?: string;
}

export function FlutterCard({
  children,
  onClick,
  variant = "elevated",
  className = ""
}: FlutterCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  const variantClasses = {
    elevated: "bg-surface-container-lowest border border-outline-variant/20 shadow-md hover:shadow-xl",
    filled: "bg-surface-container border border-transparent",
    outlined: "bg-surface-container-lowest border border-outline-variant/50"
  };

  const handleTouchStart = () => setIsPressed(true);
  const handleTouchEnd = () => setIsPressed(false);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      if ("vibrate" in navigator) {
        try { navigator.vibrate(8); } catch { /* ignore */ }
      }
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative overflow-hidden rounded-3xl transition-all duration-200 ${
        onClick ? "cursor-pointer select-none" : ""
      } ${isPressed ? "scale-[0.98] opacity-95" : "scale-100"} ${variantClasses[variant]} ${className}`}
    >
      {/* InkWell Ripple Overlay Effect */}
      {isPressed && onClick && (
        <span className="absolute inset-0 bg-primary/10 pointer-events-none transition-opacity duration-150 animate-fade-in" />
      )}
      {children}
    </div>
  );
}

/* 3. Flutter Choice / Filter Chip */
interface FlutterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: string;
  count?: number;
}

export function FlutterChip({ label, selected, onClick, icon, count }: FlutterChipProps) {
  const handleClick = () => {
    if ("vibrate" in navigator) {
      try { navigator.vibrate(10); } catch { /* ignore */ }
    }
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-sans text-xs font-bold transition-all duration-200 cursor-pointer select-none border active:scale-95 ${
        selected
          ? "bg-primary text-white border-primary shadow-sm"
          : "bg-surface-container-high/80 text-on-surface border-outline-variant/30 hover:bg-surface-variant"
      }`}
    >
      {selected ? (
        <span className="material-symbols-outlined text-[16px]">check</span>
      ) : (
        icon && <span className="material-symbols-outlined text-[16px]">{icon}</span>
      )}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`ml-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
            selected ? "bg-white/20 text-white" : "bg-surface-container-highest text-outline"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* 4. Flutter Bottom Sheet Modal (Menu Glissant du Bas) */
interface FlutterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function FlutterBottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children
}: FlutterBottomSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Backdrop Click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Content Panel */}
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-t-[32px] p-6 shadow-2xl border-t border-outline-variant/30 z-10 space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up">
        {/* Flutter Drag Handle */}
        <div className="w-12 h-1.5 bg-outline-variant/50 rounded-full mx-auto cursor-grab active:cursor-grabbing" onClick={onClose} />

        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-start justify-between pb-2 border-b border-outline-variant/20">
            <div>
              {title && <h3 className="font-sans text-headline-sm font-bold text-on-surface">{title}</h3>}
              {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-variant/50 text-outline hover:text-on-surface transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="pt-2">{children}</div>
      </div>
    </div>
  );
}

/* 5. Flutter SnackBar (Toast Notification) */
interface FlutterSnackBarProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
  type?: "info" | "success" | "warning";
  onDismiss: () => void;
}

export function FlutterSnackBar({
  message,
  actionLabel,
  onAction,
  icon = "info",
  type = "info",
  onDismiss
}: FlutterSnackBarProps) {
  const bgTypes = {
    info: "bg-surface-container-highest text-on-surface border-outline-variant/40",
    success: "bg-emerald-950 text-emerald-100 border-emerald-800/50",
    warning: "bg-amber-950 text-amber-100 border-amber-800/50"
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-slide-up">
      <div className={`flex items-center justify-between gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md ${bgTypes[type]}`}>
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] shrink-0">{icon}</span>
          <span className="text-xs font-bold font-sans">{message}</span>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="text-xs font-mono font-extrabold text-accent uppercase tracking-wider hover:underline cursor-pointer"
            >
              {actionLabel}
            </button>
          )}
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg hover:bg-black/10 text-outline hover:text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
