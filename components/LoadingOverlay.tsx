import styles from "./LoadingOverlay.module.css";

export function LoadingOverlay() {
  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden="true" />
      <p className={styles.text}>Loading NZ Image Slideshow…</p>
    </div>
  );
}
