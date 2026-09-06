"use client";

import { useModal } from "./modal";

type Props = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
};

export function ConfirmModal({ title, message, confirmLabel, cancelLabel = "Cancel", variant = "default", onConfirm }: Props) {
  const { hideModal } = useModal();

  function handleConfirm() {
    hideModal();
    onConfirm();
  }

  function handleCancel() {
    hideModal();
  }

  return <>
    <h2>{title}</h2>
    <p className="confirm-message">{message}</p>
    <div className="confirm-buttons">
      <button className="button secondary" onClick={handleCancel}>{cancelLabel}</button>
      <button className={variant === "danger" ? "button danger" : "button bronze"} onClick={handleConfirm}>{confirmLabel}</button>
    </div>
  </>;
}
