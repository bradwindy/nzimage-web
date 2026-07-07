"use client";

import styles from "./Toggle.module.css";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  "aria-label": string;
}

/** iOS-style switch, standing in for a checkbox. */
export function Toggle({ checked, onChange, disabled, size = "md", ...rest }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={rest["aria-label"]}
      disabled={disabled}
      className={size === "sm" ? styles.trackSm : styles.trackMd}
      data-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.knob} />
    </button>
  );
}
