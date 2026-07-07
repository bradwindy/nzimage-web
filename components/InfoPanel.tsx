"use client";

import { useState } from "react";
import styles from "./InfoPanel.module.css";
import { useSettings } from "@/lib/settings-context";
import type { NZImage } from "@/lib/nz-image";

function truncateAtWordBoundary(text: string, limit: number): string {
  const slice = text.slice(0, limit);
  const lastSpace = slice.lastIndexOf(" ");
  return lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
}

function TruncatedText({ text, limit }: { text: string; limit: number }) {
  const [expanded, setExpanded] = useState(false);

  if (text.length <= limit) {
    return <p className={styles.description}>{text}</p>;
  }

  return (
    <p className={styles.description}>
      {expanded ? text : `${truncateAtWordBoundary(text, limit)}…`}{" "}
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? "See less" : "See more"}
      </button>
    </p>
  );
}

function MetadataRow({ label, values }: { label: string; values?: string[] }) {
  if (!values || values.length === 0) return null;
  return (
    <p className={styles.metadataRow}>
      <span className={styles.metadataLabel}>{label}:</span> {values.join(", ")}
    </p>
  );
}

export function InfoPanel({ image }: { image: NZImage }) {
  const { settings } = useSettings();

  return (
    <div className={styles.panel}>
      <h2>{image.title}</h2>
      {image.description && (
        <TruncatedText
          key={image.id}
          text={image.description}
          limit={settings.descriptionCharLimit}
        />
      )}
      {settings.infoDensity === "more" && (
        <div className={styles.metadata}>
          <MetadataRow label="Creator" values={image.creator} />
          <MetadataRow label="Date" values={image.date} />
          <MetadataRow label="Subjects" values={image.subject} />
        </div>
      )}
      {image.displayCollection && <p className={styles.collection}>{image.displayCollection}</p>}
      {image.landingUrl && (
        <a
          className={styles.landingLink}
          href={image.landingUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View "${image.title}" on the source website`}
        >
          See more ↗
        </a>
      )}
    </div>
  );
}
