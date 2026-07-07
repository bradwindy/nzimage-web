"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { SettingsButton } from "./SettingsButton";
import { SettingsModal } from "./SettingsModal";
import styles from "./SettingsRoot.module.css";
import { useSettings } from "@/lib/settings-context";

export interface SettingsRootHandle {
  reveal: () => void;
}

const REVEAL_DURATION_MS = 4000;

export const SettingsRoot = forwardRef<SettingsRootHandle>(function SettingsRoot(_props, ref) {
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(!settings.hideChromeUntilInteract);
  // Bumped by reveal() to restart the hide countdown; belongs in this effect's deps rather than
  // being read inside a callback, which would risk seeing a stale `isOpen` the same tick `isOpen`
  // itself changes (e.g. right after closing the modal).
  const [revealToken, setRevealToken] = useState(0);

  useEffect(() => {
    if (isOpen || !settings.hideChromeUntilInteract) {
      setChromeVisible(true);
      return;
    }
    setChromeVisible(true);
    const timer = setTimeout(() => setChromeVisible(false), REVEAL_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isOpen, settings.hideChromeUntilInteract, revealToken]);

  const reveal = useCallback(() => setRevealToken((t) => t + 1), []);

  useImperativeHandle(ref, () => ({ reveal }), [reveal]);

  // Keyboard fallback for the right-click reveal gesture, which has no touch/keyboard equivalent.
  useEffect(() => {
    if (!settings.hideChromeUntilInteract) return;
    const handler = () => reveal();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [settings.hideChromeUntilInteract, reveal]);

  const visible = chromeVisible || isOpen;

  return (
    <>
      <SettingsButton visible={visible} onClick={() => setIsOpen(true)} />
      <SettingsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      {!visible && (
        // Touch fallback for the right-click reveal gesture: a small always-tappable hotspot.
        <button
          type="button"
          aria-label="Show settings"
          className={styles.revealHotspot}
          onClick={reveal}
        />
      )}
    </>
  );
});
