"use client";

import { useModal } from "@/components/modal";

type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
};

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
}: ConfirmModalProps) {
  const { hideModal } = useModal();

  function handleConfirm() {
    hideModal();
    onConfirm();
  }

  return (
    <>
      <h2 className="mt-0 pr-8 font-display text-[22px] font-semibold tracking-[-0.02em] text-foreground">
        {title}
      </h2>
      <p className="mt-3 text-[14px] leading-[1.6] text-muted-foreground">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          className="glass-input inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-white/[0.06]"
          onClick={hideModal}
        >
          {cancelLabel}
        </button>
        <button
          className={`inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-medium transition-all duration-200 ${
            variant === "danger"
              ? "border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
              : "bg-white text-black hover:bg-foreground"
          }`}
          onClick={handleConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </>
  );
}
