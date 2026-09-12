"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalContextValue = { showModal(render: () => React.ReactNode): void; hideModal(): void; visible: boolean };
const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [renderFn, setRenderFn] = useState<(() => React.ReactNode) | null>(null);
  const [visible, setVisible] = useState(false);
  const showModal = useCallback((render: () => React.ReactNode) => { setRenderFn(() => render); setVisible(true); }, []);
  const hideModal = useCallback(() => { setVisible(false); setRenderFn(null); }, []);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") hideModal(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible, hideModal]);

  return <ModalContext.Provider value={{ showModal, hideModal, visible }}>
    {children}
    {visible && renderFn && createPortal(<ModalShell onClose={hideModal}>{renderFn()}</ModalShell>, document.body)}
  </ModalContext.Provider>;
}

export function useModal() {
  const value = useContext(ModalContext);
  if (!value) throw new Error("useModal must be used inside ModalProvider");
  return value;
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10201f]/55 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-[480px] rounded-2xl border border-border bg-card p-6 shadow-[0_24px_80px_rgba(16,32,31,.2)]" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:bg-accent hover:text-primary" onClick={onClose} aria-label="Close dialog">
          <X size={17} strokeWidth={1.8} aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  );
}
