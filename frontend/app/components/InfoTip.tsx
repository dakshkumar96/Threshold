"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

type InfoTipProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export default function InfoTip({ label, children, className = "" }: InfoTipProps) {
  const id = useId();
  const tipId = `${id}-tip`;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onDocPointer(e: MouseEvent | TouchEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) close();
    }
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("touchstart", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("touchstart", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  function onTriggerKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  return (
    <span
      ref={rootRef}
      className={`info-tip ${className}`.trim()}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={close}
    >
      <button
        type="button"
        className="info-tip__trigger"
        aria-label={`About ${label}`}
        aria-expanded={open}
        aria-controls={tipId}
        aria-describedby={open ? tipId : undefined}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          if (!rootRef.current?.contains(e.relatedTarget as Node)) close();
        }}
        onKeyDown={onTriggerKey}
      >
        i
      </button>
      <span
        id={tipId}
        className="info-tip__panel left-0 top-[calc(100%+0.35rem)] md:left-auto md:right-0"
        data-open={open ? "true" : "false"}
        style={{ ["--tip-origin" as string]: "top left" }}
      >
        <span className="mb-1 block font-semibold text-[#f0d78c]">{label}</span>
        {children}
      </span>
    </span>
  );
}
