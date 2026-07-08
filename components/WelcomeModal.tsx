"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import styles from "./WelcomeModal.module.css";
import { hasSeenWelcome, markWelcomeSeen } from "@/lib/welcome";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!hasSeenWelcome()) setOpen(true);
  }, []);

  function handleClose() {
    markWelcomeSeen();
    setOpen(false);
  }

  return (
    <Modal isOpen={open} onClose={handleClose} titleId="welcome-title" className={styles.dialog}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 id="welcome-title">Welcome to NZ Image Slideshow</h2>
          <p className={styles.subtitle}>
            Created by Bradley Windybank –{" "}
            <a
              href="https://www.windybank.net"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.windybank.net
            </a>
          </p>
        </div>
        <button
          type="button"
          className={styles.close}
          onClick={handleClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className={styles.body}>
        <p>
          This is a full-screen slideshow of New Zealand heritage images drawn
          from 45+ collections around the country.
        </p>
        <p>
          Open the <strong>settings gear (⚙)</strong> in the top-right corner to
          change how it looks and behaves: appearance (light/dark/system, colour
          tint, font), how fast images advance, how much photo detail is shown,
          and which collections to hide.
        </p>
      </div>
    </Modal>
  );
}
