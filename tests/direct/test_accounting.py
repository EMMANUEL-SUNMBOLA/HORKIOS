"""Pure invariant tests that run without a GenLayer node."""

from dataclasses import dataclass


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

    def assert_invariants(self) -> None:
        assert self.original == self.locked + self.gross + self.refunded
        assert self.gross == self.net + self.fees
        assert self.locked >= 0


def allocations(escrow: int, weights: list[int]) -> list[int]:
    result: list[int] = []
    allocated = 0
    for index, weight in enumerate(weights):
        amount = escrow - allocated if index == len(weights) - 1 else escrow * weight // 10_000
        result.append(amount)
        allocated += amount
    return result


def test_allocation_remainder_is_assigned_to_final_demand() -> None:
    result = allocations(100, [3333, 3333, 3334])
    assert result == [33, 33, 34]
    assert sum(result) == 100


def test_mixed_payout_and_refund_conserve_escrow() -> None:
    ledger = Ledger(original=10**21, locked=10**21)
    first, second, third = allocations(ledger.original, [2500, 2500, 5000])
    ledger.pay(first)
    ledger.refund(second)
    ledger.pay(third)
    ledger.assert_invariants()


def test_hardship_split_charges_fee_only_to_kol_share() -> None:
    ledger = Ledger(original=1_000_000, locked=1_000_000)
    hardship_gross = ledger.locked * 20 // 100
    refund = ledger.locked - hardship_gross
    ledger.pay(hardship_gross)
    ledger.refund(refund)
    ledger.assert_invariants()
    assert ledger.fees == 2_000
    assert ledger.net == 198_000
    assert ledger.refunded == 800_000
