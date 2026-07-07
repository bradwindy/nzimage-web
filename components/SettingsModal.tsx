"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import styles from "./SettingsModal.module.css";
import { useSettings } from "@/lib/settings-context";
import { fetchCollections } from "@/lib/nz-image";
import {
  DESCRIPTION_LENGTH_OPTIONS,
  FONT_CHOICES,
  INTERVAL_STEP_OPTIONS_SECONDS,
  MODES,
  TINTS,
  type FontChoice,
  type Mode,
  type Tint,
} from "@/lib/settings";

const MODE_LABELS: Record<Mode, string> = { system: "System", light: "Light", dark: "Dark" };
const TINT_LABELS: Record<Tint, string> = {
  neutral: "Neutral",
  sepia: "Sepia",
  blue: "Blue",
  orange: "Orange",
};
const FONT_LABELS: Record<FontChoice, string> = {
  system: "System",
  serif: "Serif",
  mono: "Mono",
  display: "Display",
};

function formatIntervalLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = seconds / 60;
  return Number.isInteger(minutes) ? `${minutes}m` : `${minutes.toFixed(1)}m`;
}

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { settings, update, reset } = useSettings();
  const [collections, setCollections] = useState<string[]>([]);
  const [collectionSearch, setCollectionSearch] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    fetchCollections(controller.signal)
      .then(setCollections)
      .catch(() => {});
    return () => controller.abort();
  }, [isOpen]);

  const visibleCollectionsCount = collections.length - settings.hiddenCollections.length;

  const sortedFilteredCollections = useMemo(() => {
    const query = collectionSearch.trim().toLowerCase();
    const filtered = query
      ? collections.filter((name) => name.toLowerCase().includes(query))
      : collections;
    // Hidden (checked) collections float to the top so the ones a user has already acted on
    // stay visible without scrolling, regardless of search state.
    return [...filtered].sort((a, b) => {
      const aHidden = settings.hiddenCollections.includes(a);
      const bHidden = settings.hiddenCollections.includes(b);
      if (aHidden !== bHidden) return aHidden ? -1 : 1;
      return a.localeCompare(b);
    });
  }, [collections, collectionSearch, settings.hiddenCollections]);

  function toggleCollection(name: string, hidden: boolean) {
    if (hidden) {
      update({ hiddenCollections: [...settings.hiddenCollections, name] });
    } else {
      update({ hiddenCollections: settings.hiddenCollections.filter((c) => c !== name) });
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} titleId="settings-title">
      <div className={styles.header}>
        <h2 id="settings-title">Settings</h2>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close settings">
          ✕
        </button>
      </div>

      <section className={styles.section}>
        <label className={styles.label} htmlFor="interval">
          Interval between images
        </label>
        <select
          id="interval"
          className={styles.select}
          value={settings.intervalMs}
          onChange={(e) => update({ intervalMs: Number(e.target.value) })}
        >
          {INTERVAL_STEP_OPTIONS_SECONDS.map((seconds) => (
            <option key={seconds} value={seconds * 1000}>
              {formatIntervalLabel(seconds)}
            </option>
          ))}
        </select>
      </section>

      <section className={styles.section}>
        <span className={styles.label}>Mode</span>
        <div className={styles.buttonRow}>
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              className={settings.mode === m ? styles.choiceActive : styles.choice}
              onClick={() => update({ mode: m })}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <span className={styles.label}>Tint</span>
        <div className={styles.buttonRow}>
          {TINTS.map((t) => (
            <button
              key={t}
              type="button"
              className={settings.tint === t ? styles.choiceActive : styles.choice}
              onClick={() => update({ tint: t })}
            >
              {TINT_LABELS[t]}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <span className={styles.label}>Font</span>
        <div className={styles.buttonRow}>
          {FONT_CHOICES.map((f) => (
            <button
              key={f}
              type="button"
              className={settings.font === f ? styles.choiceActive : styles.choice}
              style={{ fontFamily: `var(--font-${f})` }}
              onClick={() => update({ font: f })}
            >
              {FONT_LABELS[f]}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={settings.showInfoPanel}
            onChange={(e) => update({ showInfoPanel: e.target.checked })}
          />
          Show details
        </label>
        {settings.showInfoPanel && (
          <label className={`${styles.checkboxRow} ${styles.subOption}`}>
            <input
              type="checkbox"
              checked={settings.infoDensity === "more"}
              onChange={(e) => update({ infoDensity: e.target.checked ? "more" : "less" })}
            />
            Show creator, date &amp; subjects
          </label>
        )}
      </section>

      <section className={styles.section}>
        <label className={styles.label} htmlFor="char-limit">
          Description length before truncation
        </label>
        <select
          id="char-limit"
          className={styles.select}
          value={settings.descriptionCharLimit}
          onChange={(e) => update({ descriptionCharLimit: Number(e.target.value) })}
        >
          {DESCRIPTION_LENGTH_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </section>

      <section className={styles.section}>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={settings.hideChromeUntilInteract}
            onChange={(e) => update({ hideChromeUntilInteract: e.target.checked })}
          />
          Hide menu icon (right-click, tap a corner, or press any key to reveal)
        </label>
      </section>

      <section className={styles.section}>
        <span className={styles.label}>Hidden collections</span>
        <p className={styles.caption}>
          {settings.hiddenCollections.length} of {collections.length} hidden
        </p>
        <input
          type="text"
          className={styles.search}
          placeholder="Search collections…"
          value={collectionSearch}
          onChange={(e) => setCollectionSearch(e.target.value)}
          aria-label="Search collections"
        />
        <div className={styles.collectionList}>
          {sortedFilteredCollections.map((name) => {
            const isHidden = settings.hiddenCollections.includes(name);
            const disableCheck = !isHidden && visibleCollectionsCount <= 1;
            return (
              <label key={name} className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={isHidden}
                  disabled={disableCheck}
                  onChange={(e) => toggleCollection(name, e.target.checked)}
                />
                {name}
              </label>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <button type="button" className={styles.reset} onClick={reset}>
          Reset to defaults
        </button>
      </section>
    </Modal>
  );
}
