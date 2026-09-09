"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";

type ModalContextValue = {
  showModal(render: () => React.ReactNode): void;
  hideModal(): void;
  visible: boolean;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [renderFn, setRenderFn] = useState<(() => React.ReactNode) | null>(
    null,
  );
  const [visible, setVisible] = useState(false);

  const showModal = useCallback((render: () => React.ReactNode) => {
    setRenderFn(() => render);
    setVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setVisible(false);
    setRenderFn(null);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") hideModal();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible, hideModal]);

  const value = { showModal, hideModal, visible };

  return (
    <ModalContext.Provider value={value}>
      {children}
      {visible &&
        renderFn &&
        createPortal(
          <ModalShell onClose={hideModal}>{renderFn()}</ModalShell>,
          document.body,
        )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const value = useContext(ModalContext);
  if (!value) throw new Error("useModal must be used inside ModalProvider");
  return value;
}

function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="glass relative mx-4 w-full max-w-[480px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-fog transition-colors hover:bg-white/[0.06] hover:text-bone"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
