"""Static and invariant guards for the Studio Next escrow contract.

These run without a GenLayer node. They lock in the fixes that are hard to
catch at runtime: EOA payouts must use the EVM external-message interface
(not the IC-to-IC handle), user-facing validation must raise the namespaced
``gl.vm.UserError``, and verification must reason over self-threads.
"""

from dataclasses import dataclass
from pathlib import Path

SOURCE = Path("contracts/HorkiosEscrow.py").read_text()
SPIKE_SOURCE = Path("contracts/XVerificationSpike.py").read_text()


def test_eoa_payouts_use_evm_interface_not_contract_handle() -> None:
    assert "_send_native(campaign.kol, net)" in SOURCE
    assert "_send_native(self.fee_recipient, fee)" in SOURCE
    assert "_send_native(campaign.creator, amount)" in SOURCE
    assert "gl.get_contract_at" not in SOURCE
    assert "gl.evm.Account" in SOURCE


def test_no_bare_gl_usererror_namespace() -> None:
    assert "gl.UserError" not in SOURCE
    assert "gl.UserError" not in SPIKE_SOURCE
    assert "gl.vm.UserError" in SOURCE
    assert "gl.vm.UserError" in SPIKE_SOURCE


def test_verification_reasons_over_self_threads() -> None:
    assert "thread_length" in SOURCE
    assert "self-thread" in SOURCE
    assert "not only the root tweet" in SOURCE


def test_release_identity_is_bumped_for_studio_next() -> None:
    assert 'RELEASE_ID = "horkios-escrow-2026-10-studio-next-v3"' in SOURCE


@dataclass
class Ledger:
    original: int
    locked: int
    gross: int = 0
    net: int = 0
    fees: int = 0
    refunded: int = 0

    def pay(self, amount: int) -> None:
        fee = amount * 100 // 10_000
        self.locked -= amount
        self.gross += amount
        self.fees += fee
        self.net += amount - fee

    def refund(self, amount: int) -> None:
        self.locked -= amount
        self.refunded += amount

    def cancel_or_expire(self) -> None:
        self.refund(self.locked)

    def assert_invariants(self) -> None:
        assert self.original == self.locked + self.gross + self.refunded
        assert self.gross == self.net + self.fees
        assert self.locked >= 0
        assert self.refunded <= self.original


def test_cancelled_campaign_refunds_full_escrow_with_no_fee() -> None:
    ledger = Ledger(original=10**20, locked=10**20)
    ledger.cancel_or_expire()
    ledger.assert_invariants()
    assert ledger.refunded == 10**20
    assert ledger.fees == 0
    assert ledger.locked == 0


def test_expired_campaign_refunds_full_escrow_with_no_fee() -> None:
    ledger = Ledger(original=3_333_333, locked=3_333_333)
    ledger.cancel_or_expire()
    ledger.assert_invariants()
    assert ledger.refunded == 3_333_333
    assert ledger.fees == 0


def test_partial_settlement_then_cancel_refunds_only_locked_remainder() -> None:
    ledger = Ledger(original=1_000_000, locked=1_000_000)
    ledger.pay(400_000)
    ledger.cancel_or_expire()
    ledger.assert_invariants()
    assert ledger.gross == 400_000
    assert ledger.refunded == 600_000
    assert ledger.locked == 0
