import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ModalProvider, useModal } from "./modal";
import { ConfirmModal } from "./ui/confirm-modal";

function Confirmer({ onResolved }: { onResolved: (value: boolean) => void }) {
  const { showModal } = useModal();
  const open = () => {
    let settled = false;
    const settle = (value: boolean) => {
      if (settled) return;
      settled = true;
      onResolved(value);
    };
    showModal(
      () => (
        <ConfirmModal
          title="Cancel oath"
          message="Cancel this unaccepted oath and refund its full escrow?"
          confirmLabel="Yes, cancel and refund"
          variant="danger"
          onConfirm={() => settle(true)}
        />
      ),
      () => settle(false),
    );
  };
  return <button onClick={open}>Open confirm</button>;
}

function setup() {
  const onResolved = vi.fn();
  render(
    <ModalProvider>
      <Confirmer onResolved={onResolved} />
    </ModalProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Open confirm" }));
  return { onResolved };
}

describe("modal confirm lifecycle", () => {
  it("resolves true when the destructive confirmation is accepted", () => {
    const { onResolved } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Yes, cancel and refund" }));
    expect(onResolved).toHaveBeenCalledTimes(1);
    expect(onResolved).toHaveBeenCalledWith(true);
  });

  it("resolves false when dismissed with Escape", () => {
    const { onResolved } = setup();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onResolved).toHaveBeenCalledWith(false);
  });

  it("resolves false when the backdrop is clicked", () => {
    const { onResolved } = setup();
    fireEvent.click(screen.getByRole("dialog"));
    expect(onResolved).toHaveBeenCalledWith(false);
  });

  it("resolves false when the close control is used", () => {
    const { onResolved } = setup();
    fireEvent.click(screen.getByLabelText("Close dialog"));
    expect(onResolved).toHaveBeenCalledWith(false);
  });

  it("does not request signing when the dialog is never confirmed", () => {
    const { onResolved } = setup();
    expect(onResolved).not.toHaveBeenCalled();
  });
});
