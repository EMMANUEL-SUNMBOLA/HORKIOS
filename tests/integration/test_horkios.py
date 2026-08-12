"""GenLayer integration smoke tests.

Run with a local node:
    gltest tests/integration -v --network localnet
"""

import pytest

gltest = pytest.importorskip("gltest")

from gltest import get_contract_factory  # noqa: E402
from gltest.assertions import tx_execution_succeeded  # noqa: E402


@pytest.mark.integration
def test_create_campaign_and_read_accounting(accounts):
    factory = get_contract_factory("HorkiosEscrow")
    contract = factory.deploy(args=[])
    now = 2_000_000_000
    receipt = contract.create_campaign(args=[
        "Launch thread", "Public test", "horkios", now + 3600,
        "00" * 32, ["Publish the launch post"], [10_000], [now + 7200], [0], [0], [0],
    ]).transact(value=10**18)
    assert tx_execution_succeeded(receipt)
    accounting = contract.get_campaign_accounting(args=[0]).call()
    assert int(accounting["original_escrow"]) == 10**18
    assert int(accounting["locked_amount"]) == 10**18
