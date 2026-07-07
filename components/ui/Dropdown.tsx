"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Dropdown.module.css";

export interface DropdownOption {
  value: string;
  label: string;
  leftDot?: string;
  fontStack?: string;
}

interface DropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  triggerContent?: ReactNode;
}

/**
 * Custom single-select dropdown. Open state is lifted to the parent so only one dropdown in a
 * given form can be open at a time.
 */
export function Dropdown({
  label,
  value,
  options,
  onChange,
  open,
  onToggle,
  onClose,
  triggerContent,
}: DropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const active = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <div ref={rootRef} className={styles.root}>
      <div className={styles.caption}>{label}</div>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={active?.fontStack ? { fontFamily: active.fontStack } : undefined}
        onClick={onToggle}
      >
        <span className={styles.triggerLabel}>
          {triggerContent ?? (
            <>
              {active?.leftDot && (
                <span className={styles.dot} style={{ background: active.leftDot }} />
              )}
              <span className={styles.triggerText}>{active?.label ?? value}</span>
            </>
          )}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden="true"
          className={styles.chevron}
        >
          <path
            d="M2 3.5 5 6.5 8 3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className={styles.menu} role="listbox">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              className={opt.value === value ? styles.rowActive : styles.row}
              style={opt.fontStack ? { fontFamily: opt.fontStack } : undefined}
              onClick={() => {
                onChange(opt.value);
                onClose();
              }}
            >
              {opt.leftDot && <span className={styles.dot} style={{ background: opt.leftDot }} />}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
