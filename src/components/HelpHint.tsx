import React, { useState } from "react";

/**
 * Petite aide repliable : une ligne « Comment ça marche ? » qui s'ouvre au toucher.
 * Si `storageKey` est donné, l'aide s'ouvre toute seule la PREMIÈRE fois seulement,
 * puis reste fermée aux visites suivantes (l'utilisateur peut toujours la rouvrir).
 */
interface HelpHintProps {
  title?: string;
  storageKey?: string;
  children: React.ReactNode;
  className?: string;
}

function wasSeen(key?: string): boolean {
  if (!key) return true;
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return true;
  }
}

function markSeen(key?: string) {
  if (!key) return;
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* sans importance */
  }
}

export default function HelpHint({ title = "Comment ça marche ?", storageKey, children, className = "" }: HelpHintProps) {
  const [open, setOpen] = useState<boolean>(() => {
    const firstTime = !wasSeen(storageKey);
    if (firstTime) markSeen(storageKey);
    return firstTime;
  });

  return (
    <div className={`text-center ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all cursor-pointer active:scale-95"
      >
        <span className="material-symbols-outlined text-[16px]">{open ? "expand_less" : "info"}</span>
        {open ? "Masquer l'aide" : title}
      </button>
      {open && (
        <div className="mt-2 mx-auto max-w-md text-xs text-on-surface-variant leading-relaxed animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}
