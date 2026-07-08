"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Modal.module.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  children: ReactNode;
  // Lets a specific modal (e.g. WelcomeModal) override the shared dialog look without
  // affecting every other consumer of this component.
  className?: string;
}

/**
 * Thin wrapper over native <dialog>: showModal()/close() give us the top-layer, ::backdrop,
 * Esc-to-close, and inert background for free, so no hand-rolled focus trap is needed.
 */
export function Modal({ isOpen, onClose, titleId, children, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={ref}
      className={className ? `${styles.dialog} ${className}` : styles.dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
