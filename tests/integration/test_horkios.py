"""GenLayer integration tests for the HORKIOS escrow lifecycle.

Run with a local node:
    gltest tests/integration -v --network localnet

The contract constructor takes zero inputs. Time-dependent scenarios
(expiry, termination adjudication) warp the transaction datetime through
``transaction_context={"genvm_datetime": ...}`` instead of sleeping.
Adjudication uses mock validators so the LLM ruling is deterministic.
"""

from datetime import datetime, timezone
import hashlib
import time

import pytest

gltest = pytest.importorskip("gltest")

from gltest import get_contract_factory, get_validator_factory  # noqa: E402
from gltest.assertions import tx_execution_failed, tx_execution_succeeded  # noqa: E402

ESCROW = 10**18
ONE_HOUR = 3600
TWO_HOURS = 2 * ONE_HOUR
TERMINATION_WINDOW = 48 * ONE_HOUR
RELEASE_ID = "horkios-escrow-2026-08-storage-v2"

OFFERED = 0
COUNTERED = 1
ACTIVE = 2
TERMINATION_PENDING = 3
CANCELLED = 5

PENDING = 1

REVIEW_ACCEPTED = 1
REVIEW_COUNTERED = 2

TERMINATION_OPEN = 1
TERMINATION_READY = 2
TERMINATION_RULED = 3

RULING_UNSUPPORTED = 3


def _invite_pair():
    secret = "ab" * 32
    return secret, hashlib.sha256(bytes.fromhex(secret)).hexdigest()


def _iso(timestamp: int) -> str:
    stamp = datetime.fromtimestamp(timestamp, timezone.utc).isoformat(timespec="seconds")
    return stamp.replace("+00:00", "Z")


def _create_campaign(contract, acceptance_deadline=None, demand_deadline=None):
    secret, invite_hash = _invite_pair()
    now = int(time.time())
    acceptance_deadline = acceptance_deadline or (now + ONE_HOUR)
    demand_deadline = demand_deadline or (now + TWO_HOURS)
    receipt = contract.create_campaign(args=[
        "Launch thread", "Public test", "horkios", acceptance_deadline,
        invite_hash, ["Publish the launch post"], [10_000], [demand_deadline],
        [0], [0], [0],
    ]).transact(value=ESCROW)
    assert tx_execution_succeeded(receipt)
    return secret


@pytest.mark.integration
def test_create_campaign_and_read_accounting(accounts):
    factory = get_contract_factory("HorkiosEscrow")
    contract = factory.deploy(args=[])
    _create_campaign(contract)

    campaign = contract.get_campaign(args=[0]).call()
    assert int(campaign["status"]) == OFFERED
    creator = str(campaign["creator"])
    assert creator.startswith("0x") and len(creator) == 42

    accounting = contract.get_campaign_accounting(args=[0]).call()
    assert int(accounting["original_escrow"]) == ESCROW
    assert int(accounting["locked_amount"]) == ESCROW
    assert int(accounting["refunded"]) == 0

    config = contract.get_config().call()
    assert config["release_id"] == RELEASE_ID
    assert int(config["fee_bps"]) == 100
    assert int(config["max_demands"]) == 10
    assert int(config["termination_window"]) == TERMINATION_WINDOW
    assert str(config["fee_recipient"]) == "0x23a3bD9d047052318Fd51ff6ade53002DEF9F2fA"

    creator_ids = contract.get_creator_campaign_ids(args=[creator, 0, 50]).call()
    assert [int(raw) for raw in creator_ids] == [0]
    kol_ids = contract.get_kol_campaign_ids(args=[str(accounts[1]), 0, 50]).call()
    assert len(kol_ids) == 0


@pytest.mark.integration
def test_review_accept_activates_and_binds_kol(accounts):
    factory = get_contract_factory("HorkiosEscrow")
    contract = factory.deploy(args=[])
    secret = _create_campaign(contract)

    kol = contract.connect(accounts[1])
    receipt = kol.review_campaign(args=[0, secret, [True], [0]]).transact()
    assert tx_execution_succeeded(receipt)

    campaign = contract.get_campaign(args=[0]).call()
    assert int(campaign["status"]) == ACTIVE
    assert str(campaign["kol"]) == str(accounts[1])
    assert int(campaign["activated_at"]) > 0

    demand = contract.get_demand(args=[0, 0]).call()
    assert int(demand["status"]) == PENDING
    assert int(demand["review"]) == REVIEW_ACCEPTED
    assert int(demand["active_deadline"]) == int(demand["original_deadline"])

    kol_ids = contract.get_kol_campaign_ids(args=[str(accounts[1]), 0, 50]).call()
    assert [int(raw) for raw in kol_ids] == [0]

    outsider = contract.connect(accounts[2])
    wrong_secret = "ff" * 32
    bad = outsider.review_campaign(args=[0, wrong_secret, [True], [0]]).transact()
    assert tx_execution_failed(bad)


@pytest.mark.integration
def test_counteroffer_then_creator_approves(accounts):
    factory = get_contract_factory("HorkiosEscrow")
    contract = factory.deploy(args=[])
    secret = _create_campaign(contract)

    proposed_deadline = int(time.time()) + 3 * ONE_HOUR
    kol = contract.connect(accounts[1])
    receipt = kol.review_campaign(args=[0, secret, [False], [proposed_deadline]]).transact()
    assert tx_execution_succeeded(receipt)

    campaign = contract.get_campaign(args=[0]).call()
    assert int(campaign["status"]) == COUNTERED
    demand = contract.get_demand(args=[0, 0]).call()
    assert int(demand["review"]) == REVIEW_COUNTERED
    assert int(demand["proposed_deadline"]) == proposed_deadline

    approval = contract.approve_counteroffer(args=[0]).transact()
    assert tx_execution_succeeded(approval)
    campaign = contract.get_campaign(args=[0]).call()
    assert int(campaign["status"]) == ACTIVE
    demand = contract.get_demand(args=[0, 0]).call()
    assert int(demand["active_deadline"]) == proposed_deadline


@pytest.mark.integration
def test_creator_cancels_before_acceptance(accounts):
    factory = get_contract_factory("HorkiosEscrow")
    contract = factory.deploy(args=[])
    _create_campaign(contract)

    receipt = contract.cancel_unaccepted_campaign(args=[0]).transact()
    assert tx_execution_succeeded(receipt)

    campaign = contract.get_campaign(args=[0]).call()
    assert int(campaign["status"]) == CANCELLED
    accounting = contract.get_campaign_accounting(args=[0]).call()
    assert int(accounting["locked_amount"]) == 0
    assert int(accounting["refunded"]) == ESCROW

    kol = contract.connect(accounts[1])
    again = kol.cancel_unaccepted_campaign(args=[0]).transact()
    assert tx_execution_failed(again)


@pytest.mark.integration
def test_expire_unaccepted_after_acceptance_deadline(accounts):
    factory = get_contract_factory("HorkiosEscrow")
    contract = factory.deploy(args=[])
    now = int(time.time())
    _create_campaign(contract, acceptance_deadline=now + ONE_HOUR)

    early = contract.expire_unaccepted_campaign(args=[0]).transact()
    assert tx_execution_failed(early)

    late = contract.expire_unaccepted_campaign(args=[0]).transact(
        transaction_context={"genvm_datetime": _iso(now + TWO_HOURS)},
    )
    assert tx_execution_succeeded(late)

    campaign = contract.get_campaign(args=[0]).call()
    assert int(campaign["status"]) == CANCELLED
    accounting = contract.get_campaign_accounting(args=[0]).call()
    assert int(accounting["locked_amount"]) == 0
    assert int(accounting["refunded"]) == ESCROW


@pytest.mark.integration
def test_termination_request_and_respond(accounts):
    factory = get_contract_factory("HorkiosEscrow")
    contract = factory.deploy(args=[])
    secret = _create_campaign(contract)
    kol = contract.connect(accounts[1])
    assert tx_execution_succeeded(kol.review_campaign(args=[0, secret, [True], [0]]).transact())

    requested = kol.request_termination(
        args=[0, "other", "Cannot complete the work", []]
    ).transact()
    assert tx_execution_succeeded(requested)

    campaign = contract.get_campaign(args=[0]).call()
    assert int(campaign["status"]) == TERMINATION_PENDING
    case = contract.get_termination(args=[0]).call()
    assert int(case["status"]) == TERMINATION_OPEN
    assert str(case["requester"]) == str(accounts[1])
    assert int(case["response_deadline"]) == int(case["opened_at"]) + TERMINATION_WINDOW

    responded = contract.respond_to_termination(
        args=[0, "Disagree, the campaign must proceed", []]
    ).transact()
    assert tx_execution_succeeded(responded)
    case = contract.get_termination(args=[0]).call()
    assert int(case["status"]) == TERMINATION_READY
    assert case["respondent_statement"] == "Disagree, the campaign must proceed"

    double = kol.respond_to_termination(args=[0, "Second response", []]).transact()
    assert tx_execution_failed(double)


@pytest.mark.integration
def test_unsupported_termination_ruling_resumes_campaign(accounts):
    factory = get_contract_factory("HorkiosEscrow")
    contract = factory.deploy(args=[])
    secret = _create_campaign(contract)
    kol = contract.connect(accounts[1])
    assert tx_execution_succeeded(kol.review_campaign(args=[0, secret, [True], [0]]).transact())
    assert tx_execution_succeeded(
        kol.request_termination(args=[0, "other", "Cannot complete the work", []]).transact()
    )
    assert tx_execution_succeeded(
        contract.respond_to_termination(args=[0, "Disagree", []]).transact()
    )

    mock_response = {
        "eq_principle_prompt_non_comparative": {
            "Classify the termination under the three enumerated outcomes": (
                '{"ruling": 3, "reason": "No supporting evidence"}'
            ),
        },
    }
    validators = get_validator_factory().batch_create_mock_validators(
        count=5, mock_llm_response=mock_response
    )
    adjudicate_at = _iso(int(time.time()) + 2 * TERMINATION_WINDOW)
    transaction_context = {
        "validators": [validator.to_dict() for validator in validators],
        "genvm_datetime": adjudicate_at,
    }

    adjudicated = contract.adjudicate_termination(args=[0]).transact(
        transaction_context=transaction_context,
    )
    assert tx_execution_succeeded(adjudicated)

    campaign = contract.get_campaign(args=[0]).call()
    assert int(campaign["status"]) == ACTIVE
    case = contract.get_termination(args=[0]).call()
    assert int(case["status"]) == TERMINATION_RULED
    assert int(case["ruling"]) == RULING_UNSUPPORTED
    accounting = contract.get_campaign_accounting(args=[0]).call()
    assert int(accounting["locked_amount"]) == ESCROW
    assert int(accounting["refunded"]) == 0
