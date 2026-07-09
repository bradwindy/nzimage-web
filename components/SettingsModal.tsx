"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Modal } from "./Modal";
import { Dropdown, type DropdownOption } from "./ui/Dropdown";
import { Toggle } from "./ui/Toggle";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import styles from "./SettingsModal.module.css";
import { useSettings } from "@/lib/settings-context";
import { fetchCollections } from "@/lib/nz-image";
import {
  DESCRIPTION_LENGTH_OPTIONS,
  DETAIL_LEVELS,
  FONT_CHOICES,
  INTERVAL_STEP_OPTIONS_SECONDS,
  MODES,
  TINTS,
  countHiddenCollections,
  countVisibleCollections,
  detailLevelToSettings,
  settingsToDetailLevel,
  type DetailLevel,
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
const TINT_SWATCH: Record<Tint, string> = {
  neutral: "#c9d1d9",
  sepia: "#cf9a5c",
  blue: "#6ea8dc",
  orange: "#e08a3c",
};
const FONT_LABELS: Record<FontChoice, string> = {
  system: "System",
  serif: "Serif",
  mono: "Mono",
  display: "Display",
};
const FONT_STACKS: Record<FontChoice, string> = {
  system: "var(--font-system)",
  serif: "var(--font-serif), Georgia, serif",
  mono: "var(--font-mono), ui-monospace, monospace",
  display: "var(--font-display), Georgia, serif",
};
const DETAIL_LABELS: Record<DetailLevel, string> = {
  none: "None",
  minimal: "Minimal",
  all: "All",
};

function formatIntervalLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = seconds / 60;
  return Number.isInteger(minutes) ? `${minutes}m` : `${minutes.toFixed(1)}m`;
}

function AppearanceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 1.5 A6.5 6.5 0 0 1 8 14.5 Z" fill="currentColor" />
    </svg>
  );
}

function SlideshowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 4.5V8l2.6 1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhotoDetailsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="5.1" r="0.9" fill="currentColor" />
      <path d="M8 7.6V11.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CollectionsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function SettingsGroup({
  icon,
  title,
  caption,
  children,
}: {
  icon: ReactNode;
  title: string;
  caption?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          {icon}
          <span>{title}</span>
        </div>
        {caption && <span className={styles.cardCaption}>{caption}</span>}
      </div>
      {children}
    </div>
  );
}

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { settings, update, reset } = useSettings();
  const [collections, setCollections] = useState<string[]>([]);
  const [collectionSearch, setCollectionSearch] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    fetchCollections(controller.signal)
      .then(setCollections)
      .catch(() => {});
    return () => controller.abort();
  }, [isOpen]);

  function handleClose() {
    setOpenDropdown(null);
    onClose();
  }

  const visibleCollectionsCount = countVisibleCollections(collections, settings.hiddenCollections);
  const hiddenCollectionsCount = countHiddenCollections(collections, settings.hiddenCollections);

  const sortedFilteredCollections = useMemo(() => {
    const query = collectionSearch.trim().toLowerCase();
    const filtered = query
      ? collections.filter((name) => name.toLowerCase().includes(query))
      : collections;
    // Hidden (toggled) collections float to the top so the ones a user has already acted on
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

  function toggleDropdown(name: string) {
    setOpenDropdown((current) => (current === name ? null : name));
  }

  function handleConfirmReset() {
    reset();
    setConfirmResetOpen(false);
  }

  const modeOptions: DropdownOption[] = MODES.map((m) => ({ value: m, label: MODE_LABELS[m] }));
  const tintOptions: DropdownOption[] = TINTS.map((t) => ({
    value: t,
    label: TINT_LABELS[t],
    leftDot: TINT_SWATCH[t],
  }));
  const fontOptions: DropdownOption[] = FONT_CHOICES.map((f) => ({
    value: f,
    label: FONT_LABELS[f],
    fontStack: FONT_STACKS[f],
  }));
  const intervalOptions: DropdownOption[] = INTERVAL_STEP_OPTIONS_SECONDS.map((seconds) => ({
    value: String(seconds * 1000),
    label: formatIntervalLabel(seconds),
  }));
  const detailOptions: DropdownOption[] = DETAIL_LEVELS.map((level) => ({
    value: level,
    label: DETAIL_LABELS[level],
  }));
  const descOptions: DropdownOption[] = DESCRIPTION_LENGTH_OPTIONS.map((opt) => ({
    value: String(opt.value),
    label: opt.longLabel,
  }));

  const currentDetailLevel = settingsToDetailLevel(settings);
  const currentDescOption = DESCRIPTION_LENGTH_OPTIONS.find(
    (opt) => opt.value === settings.descriptionCharLimit
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} titleId="settings-title">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 id="settings-title">Settings</h2>
          <button
            type="button"
            className={styles.resetLink}
            onClick={() => setConfirmResetOpen(true)}
          >
            Reset all
          </button>
        </div>
        <button
          type="button"
          className={styles.close}
          onClick={handleClose}
          aria-label="Close settings"
        >
          ✕
        </button>
      </div>

      <div className={styles.body}>
        <SettingsGroup icon={<AppearanceIcon />} title="Appearance">
          <div className={styles.row}>
            <Dropdown
              label="Appearance"
              value={settings.mode}
              options={modeOptions}
              onChange={(v) => update({ mode: v as Mode })}
              open={openDropdown === "mode"}
              onToggle={() => toggleDropdown("mode")}
              onClose={() => setOpenDropdown(null)}
            />
            <Dropdown
              label="Tint"
              value={settings.tint}
              options={tintOptions}
              onChange={(v) => update({ tint: v as Tint })}
              open={openDropdown === "tint"}
              onToggle={() => toggleDropdown("tint")}
              onClose={() => setOpenDropdown(null)}
            />
            <Dropdown
              label="Font"
              value={settings.font}
              options={fontOptions}
              onChange={(v) => update({ font: v as FontChoice })}
              open={openDropdown === "font"}
              onToggle={() => toggleDropdown("font")}
              onClose={() => setOpenDropdown(null)}
            />
          </div>
        </SettingsGroup>

        <SettingsGroup icon={<SlideshowIcon />} title="Slideshow">
          <div className={styles.slideshowRow}>
            <div className={styles.intervalDropdown}>
              <Dropdown
                label="Interval"
                value={String(settings.intervalMs)}
                options={intervalOptions}
                onChange={(v) => update({ intervalMs: Number(v) })}
                open={openDropdown === "interval"}
                onToggle={() => toggleDropdown("interval")}
                onClose={() => setOpenDropdown(null)}
              />
            </div>
            <div className={styles.divider} />
            <div className={styles.toggleRow}>
              <div className={styles.toggleText}>
                <div className={styles.toggleLabel}>Hide settings menu icon</div>
                <div className={styles.toggleDescription}>
                  Right-click, tap a corner, or press any key to reveal
                </div>
              </div>
              <Toggle
                checked={settings.hideChromeUntilInteract}
                onChange={(checked) => update({ hideChromeUntilInteract: checked })}
                aria-label="Hide settings menu icon"
              />
            </div>
          </div>
        </SettingsGroup>

        <SettingsGroup icon={<PhotoDetailsIcon />} title="Photo details">
          <div className={styles.row}>
            <Dropdown
              label="Detail level"
              value={currentDetailLevel}
              options={detailOptions}
              onChange={(v) => update(detailLevelToSettings(v as DetailLevel))}
              open={openDropdown === "detail"}
              onToggle={() => toggleDropdown("detail")}
              onClose={() => setOpenDropdown(null)}
            />
            <Dropdown
              label="Max description length"
              value={String(settings.descriptionCharLimit)}
              options={descOptions}
              onChange={(v) => update({ descriptionCharLimit: Number(v) })}
              open={openDropdown === "desc"}
              onToggle={() => toggleDropdown("desc")}
              onClose={() => setOpenDropdown(null)}
              triggerContent={currentDescOption?.shortLabel}
            />
          </div>
        </SettingsGroup>

        <SettingsGroup
          icon={<CollectionsIcon />}
          title="Hidden Collections"
          caption={`${hiddenCollectionsCount} of ${collections.length} hidden`}
        >
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
              const disableToggle = !isHidden && visibleCollectionsCount <= 1;
              return (
                <div key={name} className={styles.collectionRow}>
                  <span
                    className={isHidden ? styles.collectionNameHidden : styles.collectionName}
                  >
                    {name}
                  </span>
                  <Toggle
                    checked={isHidden}
                    disabled={disableToggle}
                    onChange={(checked) => toggleCollection(name, checked)}
                    size="sm"
                    aria-label={`Hide ${name}`}
                  />
                </div>
              );
            })}
          </div>
        </SettingsGroup>
      </div>

      <ConfirmDialog
        isOpen={confirmResetOpen}
        title="Reset all settings?"
        message="This restores every setting on this page to its default value. This can't be undone."
        confirmLabel="Reset all"
        onConfirm={handleConfirmReset}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </Modal>
  );
}
