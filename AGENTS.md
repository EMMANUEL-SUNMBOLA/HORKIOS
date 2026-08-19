# AGENTS.md — HORKIOS

Guidance for coding agents (and humans) working in this repository. This is a living
document: update it whenever the contract, the UI surface, or the project status changes.

---

## 1. Project overview

**HORKIOS** is a Web3 escrow SaaS built on **GenLayer Intelligent Contracts**.

> Programmable oaths. Verifiable work. Trustless settlement.

Named after **Zeus Horkios**, the guardian of oaths. It turns a working agreement into a
public, wallet-signed oath:

1. A creator defines weighted demands, funds the escrow in **native GEN**, and shares a
   private invitation link containing a one-time secret.
2. The KOL reviews each demand, accepts or proposes later deadlines, and signs.
3. The KOL submits canonical **X/Twitter status URLs** as evidence.
4. GenLayer validators independently render the page, run an LLM, reach consensus, and the
   escrow auto-settles each milestone.

Key product invariants (never break these):

- **No admin wallet, no operator override.** Neither party can unilaterally withdraw after
  activation, and no address can redirect escrow or reverse a payout.
- **1% platform fee (100 bps) is charged only on successful KOL payouts.** Refunds carry no
  fee. Gross KOL compensation is also fee'd (e.g., hardship gross payment).
- **Past payouts are final.** A later dispute cannot claw them back.
- **Everything is public.** Terms, wallets, evidence, and decisions are permanent on-chain.

Current release target: **Testnet Bradbury**, native GEN.

Environment policy: **all development, diagnosis, integration work, and real-X launch-gate
testing happens on Studionet**. Bradbury is promotion-only after the full gate passes.

Hosted browser RPC policy: Studionet and Bradbury traffic goes through the same-origin
Next.js `/api/genlayer-rpc` relay because the hosted Studionet endpoint does not allow
localhost CORS. The relay has fixed upstreams; never turn it into an arbitrary URL proxy or
log request bodies/calldata. It retries transient upstream failures (timeouts, 429/5xx) up
to 2× before surfacing an error. Localnet remains direct.

---

## 2. Repository layout

```text
HORKIOS/
├── AGENTS.md               # This file — agent guidance and project state
├── CONTRACTS-PLAN.md       # Contract spec + Studio deployment sheet (source of truth for the contract)
├── UI-LAYOUT.md            # Product UX, state vocabulary, component inventory, accessibility
├── Design-Inspo.md         # Visual system reference (dark editorial / "Hyperstudio" style)
├── README.md               # Public overview, MVP spec, phases, success criteria
├── contracts/
│   ├── HorkiosEscrow.py    # The production Intelligent Contract (all campaign logic)
│   └── XVerificationSpike.py  # Phase 1 launch-gate spike for repeated real-X validator tests
├── deploy/
│   └── 001_deploy_horkios.ts  # Deploys the contract and writes deployments/<network>/HorkiosEscrow.json
├── frontend/               # Next.js 16 + React 19 + TypeScript + genlayer-js (npm workspace)
│   ├── app/                # Landing, /create, /invite/[id], /campaign/[id], /dashboard
│   ├── components/         # status-badge, tx-progress, orbit-mark, wallet-button, providers
│   └── lib/                # contract.ts, wallet.tsx, invite.ts, validation.ts, format.ts, types.ts (+ tests)
├── tests/
│   ├── direct/             # Pure invariant tests, no GenLayer node required
│   ├── integration/        # gltest smoke tests against a local/Studio node
│   └── fixtures/           # X verification launch-gate matrix (URLs to fill live)
├── gltest.config.yaml      # gltest networks + funded test accounts
├── pyproject.toml          # pytest config + ruff lint settings
├── package.json            # npm workspaces root (frontend)
└── .env.example            # Browser-safe env vars; real values stay in ignored .env files
```

---

## 3. Ground rules for agents

- **The contract is the source of truth.** Before touching the frontend, read
  `contracts/HorkiosEscrow.py` and `CONTRACTS-PLAN.md`. Any contract change must be
  mirrored in `CONTRACTS-PLAN.md`, `README.md`, and every frontend caller.
- **Never change or remove the first line of the contract:** `# { "Depends": "py-genlayer:…" }`.
  The runtime is pinned to a specific GenVM build.
- **The constructor takes zero inputs.** Fee recipient, fee bps, max demands, and
  termination window are compiled into the contract. Do not add constructor inputs.
- **Time is transaction time, not wall clock.** `datetime.now(timezone.utc)` inside the
  GenVM returns the **transaction's datetime**, identical across validators. Never treat it
  as "current real-world time"; only use it for relative expiry/delta logic and timestamps.
- **Never introduce an admin path** (owner withdrawal, fee-changing method, ruling override,
  term editing). It is a hard product invariant.
- **Accounting invariants** (must always hold — validated by `tests/direct/test_accounting.py`):
  - `original_escrow = locked_amount + gross_paid + refunded`
  - `gross_paid = net_paid + fees_paid`
  - no demand allocation settles more than once
- **Secrets never go into the repo.** `.env*` is ignored except `.env.example`. Private keys
  only exist in local ignored env files.
- **Non-deterministic calls (`gl.nondet.*`) must live inside a nondet block** passed to
  `gl.vm.run_nondet` / `gl.eq_principle.*`. Storage writes, cross-contract calls, and
  `emit_transfer` happen only *after* consensus, in deterministic context.

---

## 4. GenLayer contract reference

### 4.1 Status codes (keep in sync with `frontend/lib/format.ts`)

| Constant | Value | Display |
| --- | --- | --- |
| `OFFERED` | 0 | Awaiting KOL review |
| `COUNTERED` | 1 | Deadline proposal pending |
| `ACTIVE` | 2 | Oath active |
| `TERMINATION_PENDING` | 3 | Termination under review |
| `COMPLETED` | 4 | Oath settled |
| `CANCELLED` | 5 | Cancelled and refunded |

Demand status: `PROPOSED=0`, `PENDING=1`, `SUBMITTED=2`, `PASSED=3`, `REFUNDED=4`.
Review: `REVIEW_UNSET=0`, `REVIEW_ACCEPTED=1`, `REVIEW_COUNTERED=2`.
Termination case: `TERMINATION_NONE=0`, `TERMINATION_OPEN=1`, `TERMINATION_READY=2`, `TERMINATION_RULED=3`.
Ruling: `RULING_NONE=0`, `RULING_HARDSHIP=1`, `RULING_KOL_BREACH=2`, `RULING_UNSUPPORTED=3`.

### 4.2 Public writes (exact signatures)

```python
create_campaign(title, description, x_account, acceptance_deadline, invite_hash,
    instructions, weights_bps, deadlines, min_views, min_likes, min_reposts) -> campaign_id   # @payable, value = escrow wei
review_campaign(campaign_id, invite_secret, accepted, proposed_deadlines)
approve_counteroffer(campaign_id)
cancel_unaccepted_campaign(campaign_id)
expire_unaccepted_campaign(campaign_id)
submit_evidence(campaign_id, demand_id, evidence_url)
verify_demand(campaign_id, demand_id)
finalize_expired_demand(campaign_id, demand_id)
request_termination(campaign_id, category, statement, evidence_urls)
respond_to_termination(campaign_id, statement, evidence_urls)
adjudicate_termination(campaign_id)
```

### 4.3 Public views

```python
get_campaign(campaign_id)
get_demand(campaign_id, demand_id)
get_demands(campaign_id)
get_termination(campaign_id)
get_campaign_accounting(campaign_id)
get_creator_campaign_ids(address, cursor, limit)
get_kol_campaign_ids(address, cursor, limit)
get_config()
```

### 4.4 Key semantics

- **Invite scheme:** frontend generates a random 32-byte hex secret (`randomInviteSecret`),
  sends its SHA-256 hex digest as `invite_hash` at creation, and appends
  `#invite=<secret>` to the invitation URL. The contract stores only the hash and binds the
  first wallet that reveals a matching secret. HORKIOS never stores the secret.
- **Weights:** must total exactly `10_000` bps (100%). The allocation is
  `escrow * weight_bps // 10_000` with the integer remainder assigned to the **last** demand.
  Allocations become immutable at activation.
- **Deadlines:** every demand deadline must be after the acceptance deadline. A countered
  deadline must be strictly later than the original. `acceptance_deadline` gates review and
  counteroffer approval; `active_deadline` gates verification and expiry.
- **Fee:** `fee = gross * FEE_BPS // BPS_TOTAL` (`FEE_BPS = 100`). Paid to
  `FEE_RECIPIENT = 0x23a3bD9d047052318Fd51ff6ade53002DEF9F2fA`. Refunds are unfee'd.
- **Evidence URLs:** only canonical HTTPS X/Twitter status URLs
  `https://x.com/{handle}/status/{id}` (no query/fragment). Rejected before any web access.
- **Verification flow (`_verify`):**
  1. `gl.nondet.web.render(url, mode="html")` → raw page.
  2. LLM prompt (`gl.nondet.exec_prompt`, `response_format="json"`) extracts
     `post_exists, author, status_id, content_matches, published_at_unix,
     observed_views, observed_likes, observed_reposts, reason`.
  3. `gl.vm.run_nondet(analyze, validate)` — validator re-runs the analysis and requires
     **exact equality** on identity fields (`post_exists`, `author`, `status_id`,
     `content_matches`, `published_at_unix`) and **threshold equality** on metrics
     (agreement on whether each target is met, when target > 0).
  4. LLM output is strictly typed and fails closed when malformed. `passed` requires: post
     exists + author matches + URL status ID matches + content matches + published by
     deadline + all enabled metric targets met.
- **Expiry:** a failed pre-deadline check may be retried; `finalize_expired_demand` runs one
  final verification after the deadline and otherwise refunds the demand's allocation.
- **Termination:** freezes the campaign for `termination_window = 172800` s (48 h); the other
  party may respond once. After the window, `adjudicate_termination` uses
  `gl.eq_principle.prompt_non_comparative(classify, task=…, criteria=…)` to rule 1|2|3:
  - `RULING_HARDSHIP` (1) with ≥1 passed demand → 20% of remaining escrow to KOL (gross,
    fee'd), 80% refunded to creator; with 0 passed demands → full refund.
  - `RULING_KOL_BREACH` (2) → full refund of remaining escrow.
  - `RULING_UNSUPPORTED` (3) → campaign resumes (`ACTIVE`).
- **Transfers:** outbound native GEN uses `gl.get_contract_at(addr).emit_transfer(value=…)
  ` on `finalized` (default). No `__receive__` handling is needed on the escrow contract.
- **`get_config()` must return:** `fee_recipient` = the FEE_RECIPIENT above,
  `release_id` = `horkios-escrow-2026-08-storage-v2`, `fee_bps` = 100,
  `max_demands` = 10, `termination_window` = 172800.

---

## 5. Frontend ↔ contract mapping

- **Connectivity** (`frontend/lib/contract.ts`): `createClient({ chain })` for reads;
  `createClient({ chain, account, provider: window.ethereum })` for writes. Network is
  `NEXT_PUBLIC_GENLAYER_NETWORK` (`localnet` | `studionet` | `testnetBradbury`, default
  `testnetBradbury`). Contract address is `NEXT_PUBLIC_HORKIOS_CONTRACT_ADDRESS`.
- **Write calls** (all use `writeContract({ address, functionName, args })`):
  - `/create` → `create_campaign` with `value: parseGen(escrowGen)` (wei). Everything else
    sends `value: 0n`.
  - `/invite/[id]` → `review_campaign([id, secret, accepted[], proposed[]])`; `proposed` is
    `0` for accepted demands, else the proposed Unix deadline.
  - `/campaign/[id]` → `submit_evidence`, `verify_demand`, `finalize_expired_demand`,
    `approve_counteroffer`, `cancel_unaccepted_campaign`.
- **Reads:** `readCampaign(id)` → `get_campaign`. Dashboard uses
  `get_creator_campaign_ids` / `get_kol_campaign_ids` then `get_campaign` per id.
- **Waiting:** every write flow goes through `waitForOutcome(hash, onAccepted?)` in
  `frontend/lib/contract.ts`, which waits for acceptance, then finalization, and throws
  `UndeterminedTransactionError` on validator disagreement or a rejected-with-trace error on
  execution failure. `receiptFailure` classifies **both** receipt shapes: localnet receipts
  (`status_name` + `txExecutionResultName`) and Studio receipts, which drop
  `txExecutionResultName` and must be read from `consensus_data.leader_receipt`
  (`execution_result`, `genvm_result.stderr`). A finalized receipt with no execution info is
  treated as failed (fail-closed).
- **GEN amounts** (`frontend/lib/format.ts`): `1 GEN = 10^18 wei`; `parseGen`/`formatGen`
  operate at wei precision. Deadlines pass through `unixSeconds(datetime-local)`.
- **TS types** (`frontend/lib/types.ts`) mirror contract storage, including the campaign's
  nested `termination` case returned by `get_campaign`.
- **Validation** (`frontend/lib/validation.ts` + zod) must stay in sync with contract checks:
  weights total 10,000, deadlines after acceptance, canonical X URL rules.

---

## 6. What's done

- **Contract MVP** (`contracts/HorkiosEscrow.py`): full lifecycle — create, review,
  counteroffer, cancel/expire, evidence, verify, final-expiry, termination, adjudication;
  wallet index views; accounting views; zero-input constructor. Confirmed API-correct
  against GenLayer docs (nondet blocks, `emit_transfer`, `prompt_non_comparative`,
  deterministic tx-datetime).
- **Contract storage hardening:** campaign demands are built as a plain
  `list[Demand]` (stored through the `Campaign` value type) and wallet indexes are written
  via `index.get_or_insert_default(address).append(campaign_id)` — no
  `gl.storage.inmem_allocate(DynArray[...])` on TreeMap values, which previously failed in
  the GenVM during `create_campaign`/`_append_wallet_index`.
- **Spike contract** (`contracts/XVerificationSpike.py`) for Phase 1 evidence feasibility.
- **Deploy script** (`deploy/001_deploy_horkios.ts`): refuses unpinned dependencies, waits
  for finalization, writes `deployments/<network>/HorkiosEscrow.json`.
- **Frontend:** landing, create-oath wizard (4-step form + escrow summary), invite/review
  page, public campaign page, dashboard, How It Works page, expire-unaccepted action, and
  termination request/respond/adjudicate controls; wallet connect + network switching;
  invite secret generation + SHA-256 commitment; `TxProgress` feedback; shared receipt
  classifier that handles both localnet and Studio receipt shapes; RPC relay that retries
  transient upstream failures; dark editorial design per `Design-Inspo.md`.
- **Tests:** `tests/direct/test_accounting.py` (allocation remainder, payout/refund
  conservation, hardship split); `tests/integration/test_horkios.py` (gltest lifecycle —
  create/accounting, accept+activate, counteroffer+approve, cancel, expiry, termination
  request/respond, unsupported-ruling adjudication with mock validators; see Problem 1
  below); vitest unit tests for format/validation/invite, the receipt classifier (localnet +
  Studio leader-receipt shapes), and the relay retry policy.
- **Docs:** `README.md`, `CONTRACTS-PLAN.md`, `UI-LAYOUT.md`, `Design-Inspo.md`.
- **Repository baseline:** source, tests, deployment/config files, `.env.example`, and the
  public `README.md` are versioned. Personal root Markdown remains ignored.
- **Verification identity/type hardening:** malformed LLM output fails closed and the
  extracted status ID must match the canonical URL before payout.
- **Active Studionet deployment** in `frontend/.env.local`:
  `0x1266EFF0b57163003D5A8F8dfa200c49B229FF06`. Deployment transaction
  `0xce6edfd14f96c303fe0620725e131c5d8650a09330628a67f7f953a53a325420`
  finalized successfully with release ID `horkios-escrow-2026-08-storage-v2`. Live source
  inspection confirmed both obsolete `inmem_allocate` calls are absent. One-demand and
  three-demand funded creation/cancellation canaries passed with exact accounting, creator
  indexing, allocation rounding, finalized refunds, and a zero ending contract balance.
- **Retired Studionet deployment:** `0xba7B71a94690dad19F8C90755900C3Bc5A5faD47`.
  Never send another transaction or additional GEN to it. Its 2,120 GEN balance is abandoned
  Studionet test value; do not add an admin/recovery path to retrieve it.

---

## 7. What's left

- **Status-code source of truth** — numeric maps remain duplicated across contract and TS.
- **Multi-source corroboration** — extend `_verify` to cross-check the author's X profile
  (handle match, account status), verify engagement patterns (views/likes ratio against known
  baselines), and compare against at least one independent public source. This directly
  addresses the FactCheck steward feedback (§10.2) and is the single highest-leverage
  improvement for point scoring.
- **Citation provenance** — store the exact URL rendered, the timestamp of rendering, the
  raw extracted fields (author, text, metrics), and which validator rendered what. Every
  verification decision should carry an on-chain provenance trail. FactCheck never had this.
- **Phase 1 evidence gate** — run `XVerificationSpike` repeatedly against the fixture matrix
  (`tests/fixtures/x-verification-matrix.md`) on real X posts; record results; pass the
  launch gate (3× five-validator runs, no false passes).
- **Integration test coverage** — the broken deploy args are fixed and counteroffer, cancel,
  expiry, and termination (request/respond/adjudicate) scenarios are added; verify them against
  a local node (`gltest tests/integration -v --network localnet`) and extend with hardship/breach
  rulings and a live evidence verification.
- **Bradbury testnet deploy (production/final submission)** — the dev/testing home is
  Studionet (§8.10); Bradbury is for the final port. Deploy, verify `get_config()`,
  record address, run demo scenarios (success, failure, counteroffer, hardship), and
  submit to the GenLayer contribution portal.
- **Technical blog post** — publish "Building a trustless escrow on GenLayer" on Medium or
  Dev.to. Architecture diagrams, contract walkthrough, why GenLayer over Chainlink for this
  use case. Target: 1000+ words, code examples, screenshots.
- **Demo video** — record the full creator → KOL → evidence → verification → payout flow.
  Screen-record the browser, show wallet signatures, show on-chain settlement. Upload to
  YouTube or Loom. Attach to portal submission as evidence.
- **Tutorial** — "How to build a programmable escrow on GenLayer" step-by-step guide.
  Contract structure, frontend integration, testing strategy. Separate from the blog post
  (tutorial is instructional, blog is analytical).
- **Portal submission (5 contributions)** — submit HORKIOS as 5 separate contributions to
  the GenLayer Points portal, each with clear evidence. See §10.6 for the breakdown.
- **Termination evidence grounding** — adjudication currently receives URL strings but
  does not render their contents; fetch and evaluate the submitted public sources.
- **Termination anti-griefing and deadline semantics** — repeated unsupported requests can
  keep freezing a campaign while active deadlines continue to elapse; define limits or a
  cooldown and pause/extend affected deadlines safely.

---

## 8. Problems we face and how we solve them

1. **Integration test used stale constructor args and hardcoded time.**
   `tests/integration/test_horkios.py` previously called `factory.deploy(args=[accounts[3].address, 60])`
   against a zero-input constructor → deploy failed. **Fixed:** `deploy(args=[])`; deadlines now derive
   from `time.time()`; time-dependent scenarios (expiry, termination adjudication) warp the transaction
   datetime via `transaction_context={"genvm_datetime": ...}` instead of hardcoded `now`; coverage expanded
   to accept, counteroffer+approve, cancel, expire, termination request/respond, and an unsupported-ruling
   appeal adjudication (driven by mock validators).

2. **Transaction outcomes must remain centralized.**
   The shared frontend receipt handler now distinguishes finalized success, execution
   errors, and `UNDETERMINED`. All new write flows must use it rather than polling directly.

3. **Verification consensus is fragile.**
   `_verify` demands exact equality on `status_id`, `published_at_unix`, `content_matches`,
   etc. between two independent page renders + LLM runs. Real X pages vary between fetches
   and X frequently serves login walls, so consensus will often fail → UNDETERMINED. The
   retry path exists, but expected UX cost is high. **How we solve it:** Phase 1 spike runs
   measure real agreement rates; if poor, relax the validator to compare stable/derived
   fields (e.g., status id presence + author + threshold-crossed metrics + timestamp range)
   rather than exact values.

4. **X access / login walls / rate limits.**
   `gl.nondet.web.render(mode="html")` may not return public metrics, and X blocks scrapers.
   This is the core feasibility question. **How we solve it:** the fixture matrix + spike
   gate must prove authorship/content/timestamp/metrics retrieval is stable before Bradbury
   deployment; if X HTML is unreliable, add a source-grounded fallback (still public, still
   independently fetchable) and encode it in the contract prompt.

5. **Termination evidence grounding and anti-griefing remain contract work.**
   Request/respond/adjudicate and expire-unaccepted UI now exist, but the adjudicator still
   receives URL strings without rendering them and repeated requests can freeze deadlines.

6. **Status codes and shapes drift across layers.**
   Numeric constants live in the contract and are re-encoded in `format.ts`,
   `status-badge.tsx`, and `types.ts`; `Campaign` omits `termination`. **How we solve it:**
   keep the TS types and maps in sync with the contract (this file is the checklist); add
   the missing fields when the termination UI lands.

7. **Invite counter-deadline validation is fixed in the UI.**
   The field starts empty and must parse to a time strictly later than the original.

8. **Deadline actions use a live UI clock.**
   The campaign clock refreshes every 30 seconds; preserve this for all expiry controls.

9. **Deployment artifacts are local-only.**
   The entire generated `deployments/` tree is ignored; publish final addresses in release
   documentation without committing machine-generated artifacts.

10. **Network/funds mismatch — dapp on one network, signer funded on another.**
    GEN is per-network: Studionet (61999) and Testnet Bradbury (4221) hold separate
    balances. `frontend/.env.local` was pointed at `studionet` while the tester's GEN sat
    on Bradbury → `ensureNetwork()` switched the wallet to Studionet, the account had
    0 GEN there, and the funded `create_campaign` write failed with "The transaction did
    not complete." **Fix (decision):** the `NEXT_PUBLIC_GENLAYER_NETWORK` env must match
    the network the signer is funded on.
    - **Dev/testing → Studionet.** Fund the account via the built-in 💧 faucet in the
      Studio account selector (studio.genlayer.com). The former contract at
      `0xba7B71a94690dad19F8C90755900C3Bc5A5faD47` is retired after the confirmed storage
      runtime failure; use only the next deployment after it passes the funded canary (§8.19).
    - **Production → Testnet Bradbury.** Deploy `HorkiosEscrow.py` there, fund via
      testnet-faucet.genlayer.foundation, and set `NEXT_PUBLIC_GENLAYER_NETWORK=
      testnetBradbury` + the Bradbury address in `.env.local` (Bradbury deployment is
      item in §7).
    - **Symptoms of a mismatch:** wallet switches networks at submit, then the write
      fails; check the exact error above the button (it's `caught.message`) and the
    account's balance on the *target* network before blaming the contract.

11. **Termination evidence is not source-grounded.**
    The contract records requester/respondent URL strings but `_adjudicate` does not render
    those pages. **Fix:** render bounded HTTPS evidence inside the nondeterministic
    adjudication flow, label it as untrusted data, and require the ruling to cite supplied
    sources without introducing an operator path.

12. **Termination can be used to grief settlement.**
    After an unsupported ruling, either party can reopen a 48-hour case immediately while
    demand deadlines keep advancing. **Fix:** specify and implement a bounded retry/cooldown
    rule plus deterministic deadline pause/extension semantics, then cover repeated cases,
    expiry races, and preserved past payouts in integration tests.

13. **Finalized execution errors and `UNDETERMINED` are surfaced.**
    Every current write uses the shared classifier; execution failures attempt to include
    the GenVM trace error and consensus disagreement explains that no state changed.
    **Studio receipts drop `txExecutionResultName`** — `receiptFailure` reads `status_name`
    and, when the execution result is absent, derives the outcome from
    `consensus_data.leader_receipt` (`execution_result === "ERROR"` or a non-empty
    `genvm_result.stderr`), failing closed when the leader receipt is missing.

14. **Campaign ID discovery is commitment-matched.**
    `/create` pages through creator IDs and selects the campaign whose stored `invite_hash`
    matches the unique local commitment; it no longer assumes the last ID belongs to it.

15. **Protocol appeal UI is post-Bradbury.**
    GenLayer's protocol mechanism remains available externally. HORKIOS-native eligibility,
    bond display, submission, and round tracking are intentionally outside the first
    Bradbury submission.

16. **The Studionet creation failure is a deployed-source/runtime mismatch, not bad form data.**
    Transaction `0x1c7d54ebcdf4ddd1170a97015b92111795662881be4055d1d75f2a2297e4bed6`
    sent valid `create_campaign` calldata and 100 GEN to the retired contract. Validators
    agreed on a deterministic execution error at deployed line 221:
    `gl.storage.inmem_allocate(DynArray[Demand])` raised
    `TypeError: _GenericAlias.__init__() missing 1 required positional argument: 'args'`.
    RPC source inspection confirmed that the deployed contract contains that obsolete line
    and the equivalent obsolete wallet-index allocation. It finalized as an execution error;
    this was not insufficient balance, a deadline/weight validation error, X access, or
    validator disagreement. The local storage-hardening changes replace the temporary demand
    collection with `list[Demand]` and initialize wallet indexes with
    `get_or_insert_default(address).append(campaign_id)`.

17. **Failed payable calls on the retired Studionet build left test GEN at the contract.**
    The failed receipt reported `value_credited: true`, no emitted messages, and no created
    campaign state. Public balance checks found 2,120 GEN at the retired contract and 17,880
    GEN at the submitting/faucet wallet, exactly 20,000 GEN combined. The creator campaign
    index was empty. Treat the 2,120 GEN as abandoned test value and do not weaken the no-admin
    invariant to recover it. The new deployment gate must use only a minimal canary amount.

18. **A configuration match is not a release identity check.**
    The retired build returns the expected fee recipient, 100 bps fee, ten-demand limit, and
    48-hour termination window, so the existing `assertContractConfig()` accepts it. Add a
    compiled `release_id` to `get_config()`, require the exact value in the frontend, and make
    deployment verification check it before enabling writes.

19. **Fresh-deployment funded canary is mandatory.**
    Schema compilation alone does not execute storage construction. Before pointing the UI at
    a new Studionet address: deploy from the exact reviewed source; verify finalized deployment
    success and `get_config()` including `release_id`; create a minimal one-demand oath with a
    small test escrow; verify campaign state, creator index, allocation, accounting, and contract
    balance; cancel it; wait for the finalized refund transfer; and verify the creator balance and
    zero locked amount. Then repeat creation with multiple demands to exercise allocation rounding
    and array/index storage. Only after every check passes may `frontend/.env.local` be updated.
    **Passed on 2026-08-15:** campaign `0` used one 1-GEN demand; campaign `1` used three
    1-GEN allocations weighted 3333/3333/3334 bps. Both creation transactions finalized with
    successful execution, both creator index entries were readable, both cancellations finalized,
    both accounting records ended with `locked_amount = 0` and `refunded = 1 GEN`, and the
    contract balance returned to zero. External refund children finalized with Studionet's
    `NO_MAJORITY` label, but recipient and contract balances confirmed both transfers completed.

20. **A hosted RPC rate limit is not a transaction failure.**
    On 2026-08-15, create transaction `0x8f258442c8e5553076e973a2d2d0ff82444…`
    surfaced viem's `Rate limit exceeded: 30 requests per minute`, although Studionet had
    finalized campaign `2` and locked its 100 GEN correctly. The old 3-second acceptance poll,
    5-second finalization poll, config/balance/index reads, and relay retries could exceed the
    shared cap; retrying a 429 amplified it. **Fix:** use one outcome loop at no more than one
    request per 10 seconds, back off 30 seconds after a 429, treat timeout/network/502–504
    failures as monitoring delays, and never describe an unknown status as a failed transaction.
    The relay forwards `Retry-After`, does not retry 429 or deterministic 4xx responses, and only
    retries timeouts/502–504 with a short increasing delay. `get_config()` is memoized after a
    successful validation. Creation stores a versioned pending secret, commitment, network,
    contract, creator, deadline, and transaction hash in browser `sessionStorage`; reloads resume
    the same hash and recover the invitation by commitment. Clear this record only after the
    invitation is copied, or when it is invalid, mismatched, or expired. Never persist the secret
    server-side or on-chain. Campaign `2` should be cancelled by its creator through the normal
    contract method before recreating it; there is deliberately no operator recovery path.

21. **The first browser-funded creation on the hardened release passed.**
    On 2026-08-15, after switching the UI to Studionet contract
    `0x1266EFF0b57163003D5A8F8dfa200c49B229FF06` and applying the rate-limit-safe
    monitor, the creator completed the first successful wallet-signed oath creation through
    the real browser flow. This confirms the deployed storage fix, payable `create_campaign`
    path, configured release identity, same-origin RPC relay, wallet network selection, and
    frontend argument encoding work together. The earlier failures taught us to separate three
    independent layers during diagnosis: wallet submission, on-chain execution/finalization,
    and frontend receipt observation. A monitoring error must never be used as evidence that
    escrow execution failed. Preserve the transaction hash and invitation commitment before
    polling, inspect finalized leader receipts and contract state, and only invite the user to
    resubmit after proving the previous transaction did not alter state.

---

## 9. Commands

```bash
# Frontend / workspace
npm install
npm run dev          # next dev
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run test         # vitest run (frontend unit tests)
npm run build        # next build

# Python contract checks
ruff check .         # lint contracts + tests (line-length 100)
pytest               # direct-mode invariant tests (no node needed)

# Integration tests against a local GenLayer node
gltest tests/integration -v --network localnet

# Deploy (from repo root; needs DEPLOYER_PRIVATE_KEY + funded account)
#   uses deploy/001_deploy_horkios.ts → writes deployments/<network>/HorkiosEscrow.json

# Environment
#   frontend/.env.local:  NEXT_PUBLIC_GENLAYER_NETWORK, NEXT_PUBLIC_HORKIOS_CONTRACT_ADDRESS
#   root .env:            DEPLOYER_PRIVATE_KEY, FEE_RECIPIENT, CREATOR_PRIVATE_KEY, KOL_PRIVATE_KEY, ATTACKER_PRIVATE_KEY
```

---

## 10. Lessons from FactCheck and GenLayer submission strategy

This section documents what we learned from the FactCheck project (240 points) and how
HORKIOS should be positioned for maximum scoring on the GenLayer Builders Program.

**FactCheck repo:** https://github.com/EMMANUEL-SUNMBOLA/FactCheck
**FactCheck bot:** https://t.me/genfactcheckbot
**GenLayer Points portal:** https://points.genlayer.foundation

### 10.1 What FactCheck did right (earned 240 points)

| What | Why it scored |
| --- | --- |
| Contract uses `gl.nondet.web.render()` | Native web access — GenLayer's core differentiator |
| Contract uses `gl.nondet.exec_prompt()` | LLM reasoning on-chain — no oracle needed |
| Contract uses `gl.vm.run_nondet_unsafe()` | Equivalence Principle — validators independently verify |
| Functional equivalence principle | Leader fetches + answers, validators re-fetch + re-answer, LLM judges equivalence |
| Deployed on Studionet | On-chain, verifiable, not just local code |
| Telegram bot as interface | Working end-to-end flow, not a stub |
| GitHub repo with source | Stewards can review the code |
| Updated after steward feedback | Demonstrated iteration and responsiveness |

### 10.2 What capped FactCheck at 240 points (steward feedback, verbatim)

> *"This can receive project credit, but the main limitation is that consensus confirms
> what one requester-selected page says rather than whether the claim is actually true.
> For a stronger version, corroborate independent authoritative sources and preserve
> citations or source-version provenance for the stored answer."*

| Limitation | Why it caps score |
| --- | --- |
| **Single-source verification** | The contract reads exactly one URL the user points it at. It confirms what that page says, not whether a claim is true. Stewards see this as a demo, not a product. |
| **No citation provenance** | The answer has no "where did this come from" trail. No URL timestamp, no raw extracted data, no validator identity. |
| **No multi-source corroboration** | Real fact-checking cross-references multiple independent sources. FactCheck trusts a single page blindly. |
| **Telegram bot, not a dApp** | Bots feel like hackathon demos. Web dApps with wallet connection feel like products. |
| **No test suite** | No evidence of engineering rigor. No invariant tests, no integration tests, no vitest. |
| **240 / 1500 ceiling = 16%** | Used ~16% of the available scoring range for a dApp submission. Left 1260 points on the table. |

**Additional rejection note (earlier submission):**

> *"Thank you for addressing the technical feedback and submitting your updates.
> Regarding the builder process, our program has a standard policy that projects can
> only go through one more-info review cycle. Because this threshold has been exceeded,
> we must officially mark this specific submission as Rejected.
> Please do not file an appeal on this rejection. Instead, simply submit your project
> as a new builder application with your updated repository."*

Lesson: stewards have a review-cycle limit. Each submission must be as complete as
possible. Don't submit drafts and iterate through steward feedback — get it right
before submitting.

### 10.3 Steward scoring criteria

Stewards evaluate contributions on four dimensions:

| Criterion | Definition | What HORKIOS must demonstrate |
| --- | --- | --- |
| **Complexity** | How difficult was the work? | 761-line contract with 4 dataclasses, 11 write methods, 8 views, financial invariants, termination logic, LLM output normalization, URL canonicalization. Multiple GenLayer primitives (`gl.nondet.web.render`, `gl.nondet.exec_prompt`, `gl.vm.run_nondet`, `gl.eq_principle.prompt_non_comparative`, `gl.get_contract_at().emit_transfer`). |
| **Impact** | How valuable is it to the ecosystem? | KOL campaign escrow is a real use case with real demand. GenLayer's own team mentions "agentic commerce" and "dispute resolution" as core use cases (see Internet Court announcement, July 2026). HORKIOS solves a problem people would pay for. |
| **Quality** | How well was it executed? | Full test suite (Python direct + integration, TypeScript vitest), documented bugs (21 problems with root causes in AGENTS.md), deployment pipeline with canary gates, RPC relay with retry logic, session persistence for UX recovery. |
| **Effort** | How much time and skill did it require? | Multiple deployment cycles, storage redesign, rate-limit hardening, LLM output normalization, wallet index engineering, invite secret scheme, termination lifecycle. Not a weekend project. |

### 10.4 GenLayer Builder point ranges

Source: https://mintlify.wiki/genlayer-foundation/points/concepts/categories

| Contribution Type | Min | Max | What HORKIOS should submit |
| --- | --- | --- | --- |
| Smart Contract Deploy | 200 | 1000 | `HorkiosEscrow.py` — 761 lines, 11 writes, 8 views, escrow lifecycle |
| dApps & Tools | 300 | 1500 | Full Next.js 16 frontend + wallet + contract integration + RPC relay |
| GitHub Repository | 50 | 300 | Clean repo with tests, docs, deploy scripts, AGENTS.md |
| Blog Post / Article | 25 | 150 | Technical writeup: "Building a trustless escrow on GenLayer" |
| Documentation / Tutorial | 50 | 300 | "How to build a programmable escrow on GenLayer" step-by-step |
| Code Contribution | 100 | 500 | (if applicable — e.g. contributing to GenLayer SDK or docs) |

**Total possible from one well-submitted project: 625–3250 points** (each type submitted
separately to the portal).

Stewards may also apply multipliers. Points are frozen at time of award — a multiplier
change does not affect past contributions. Check the portal for current multiplier rates
before submitting.

### 10.5 HORKIOS scoring advantages over FactCheck

| Dimension | FactCheck | HORKIOS |
| --- | --- | --- |
| Contract lines | ~80 | 761 |
| Write methods | 1 (`verify`) | 11 (create, review, approve, cancel, expire, submit, verify, finalize, request/respond/adjudicate termination) |
| View methods | 3 | 8 (including wallet indexes and accounting) |
| Dataclasses | 0 | 4 (VerificationDecision, Demand, TerminationCase, Campaign) |
| Financial logic | None | Escrow accounting, 1% fee, bps-weighted allocations, hardship splits, refund invariants |
| GenLayer primitives | 3 (web.render, exec_prompt, run_nondet_unsafe) | 5 (web.render, exec_prompt, run_nondet, eq_principle.prompt_non_comparative, emit_transfer) |
| Frontend | Telegram bot (node-telegram-bot-api) | Next.js 16, React 19, TypeScript, genlayer-js, TanStack Query, Zod validation, 6 pages |
| Test suite | None | Python direct (accounting + normalization), integration (7 gltest scenarios), TypeScript vitest (6 test files, 264+ lines) |
| Documentation | Basic README | AGENTS.md (500+ lines, 21 documented bugs), CONTRACTS-PLAN.md, UI-LAYOUT.md (430 lines), Design-Inspo.md (358 lines) |
| Deployment | Manual Studio deploy | TypeScript deploy script with canary gates, release identity verification, post-deploy config check |
| Real-world utility | "Answer a question about a page" | "Trustlessly settle a funded campaign with evidence verification" |
| On-chain provenance | Answer stored as string | Full audit trail: demands, reviews, evidence URLs, verification decisions, termination cases, accounting |
| Product invariants | None documented | 4 explicit invariants (no admin, 1% fee, past payouts final, everything public) |

### 10.6 Multi-submission strategy

Do NOT submit HORKIOS as one "Projects" blob. Submit 5 separate contributions:

| # | Submission | Portal type | Evidence | Expected range |
| --- | --- | --- | --- | --- |
| 1 | `HorkiosEscrow.py` contract | Smart Contract Deploy | Contract address, source code, `CONTRACTS-PLAN.md`, deployment tx | 500–900 |
| 2 | Full dApp (frontend + contract) | dApps & Tools | Live deployment URL, GitHub repo, demo video, README | 700–1300 |
| 3 | GitHub repository | Code Contribution | Repo URL, commit history, test results, AGENTS.md | 150–300 |
| 4 | Technical blog post | Blog Post / Article | Medium/Dev.to URL, 1000+ words, code examples, architecture diagrams | 75–150 |
| 5 | Tutorial: escrow on GenLayer | Documentation / Tutorial | Step-by-step guide URL, code snippets, screenshots | 100–250 |

**Conservative total: 1525–2900 points** (vs FactCheck's 240).

Each submission gets its own evidence items. Stewards review each independently. If one
is rejected, the others are unaffected (unlike FactCheck where everything was in one bucket).

### 10.7 Key mistakes to avoid

1. **Don't submit as a single blob.** FactCheck was one "Projects" submission — 240 points
   capped. HORKIOS must be 5 separate submissions, each hitting a different contribution
   type with its own scoring range.

2. **Don't skip Bradbury.** Studionet is free testnet with no monetary value. Bradbury is
   the incentivized testnet that stewards take seriously. Deploy there before submitting.

3. **Don't ignore provenance.** The FactCheck steward explicitly asked for "citations or
   source-version provenance for the stored answer." HORKIOS must store what was rendered,
   when, by which validator, and the raw extracted data. This is on-chain provenance that
   no other escrow product offers.

4. **Don't submit without test evidence.** FactCheck had no tests. HORKIOS has Python
   direct tests, integration tests, and vitest unit tests. Link to specific test files
   in submission evidence. Show test output screenshots if possible.

5. **Don't forget the demo video.** A 2-minute screen recording of the full flow
   (create oath → invite KOL → submit evidence → verification → payout) is worth more
   than any README paragraph. Upload to YouTube or Loom and attach as evidence.

6. **Don't leave AGENTS.md stale.** Section 7 ("What's left") and section 6 ("What's done")
   must reflect actual project state. Stewards may inspect the repo — stale status notes
   erode confidence.

7. **Don't repeat the single-source pattern.** FactCheck's fatal flaw was reading one page
   and declaring truth. HORKIOS verifies X posts by cross-checking authorship, content,
   metrics, and timestamps — but should go further: verify the author's profile exists,
   check engagement ratios, corroborate against at least one additional public source.
   This is what the steward asked for.

8. **Don't exceed the review-cycle limit.** Each portal submission gets one more-info
   review cycle before it's either accepted or rejected with no appeal. Make the first
   submission as complete as possible. Don't submit drafts.

### 10.8 Pre-submission checklist

Complete these in order before submitting to the GenLayer Points portal:

- [ ] **Phase 1 evidence gate passed** — `XVerificationSpike` run 3× with 5 validators on
  real X posts; stable retrieval proven; results recorded in `tests/fixtures/`.
- [ ] **Bradbury testnet deployment** — contract deployed, `get_config()` verified, demo
  scenarios run (success, failure, counteroffer, hardship), address recorded.
- [ ] **Multi-source corroboration implemented** — `_verify` cross-checks author profile,
  engagement patterns, at least one additional public source (if feasible within GenLayer
  web rendering constraints).
- [ ] **Citation provenance stored** — every `VerificationDecision` includes rendered URL,
  timestamp, raw extracted fields, validator identity.
- [ ] **Technical blog post published** — 1000+ words on Medium/Dev.to, architecture
  diagrams, contract walkthrough, why GenLayer.
- [ ] **Demo video recorded** — full creator → KOL → evidence → verification → payout flow,
  uploaded to YouTube/Loom.
- [ ] **Tutorial written** — step-by-step "build an escrow on GenLayer" guide.
- [ ] **All tests passing** — `pytest`, `gltest tests/integration`, `npm run test`,
  `npm run typecheck`, `npm run lint`.
- [ ] **README.md current** — reflects Bradbury address, demo video link, blog post link.
- [ ] **5 portal submissions prepared** — each with evidence items, notes, and contract
  address (where applicable). See §10.6 for the breakdown.

---

## 11. Engineering journal

### 2026-08-19 — Hosted RPC outages remain monitoring delays

**Changes since `456ec42`:**

- The same-origin RPC relay now returns JSON-RPC error code `-32603` (Internal Error) for
  upstream timeouts and connection failures, while preserving HTTP 504 and 502 respectively.
- Relay tests now assert the complete timeout/unavailable JSON-RPC envelopes, including the
  request ID, error code, and diagnostic message.
- The transaction outcome monitor now recognizes the relay's exact `RPC is unavailable`
  message as transient, alongside timeouts, network errors, 429 responses, and 502–504 errors.
- A focused frontend regression test proves that exact relay message enters the transient
  monitoring path.

**Why:** the relay deliberately translates a temporary hosted-network outage into a valid
JSON-RPC response. Its unavailable message did not match the monitor's narrower transient
patterns, so a recoverable observation failure could escape the monitoring-delay path and be
shown like a transaction failure. Using the standard internal-error code and matching the
relay's emitted wording keeps transport availability separate from on-chain execution: the UI
continues polling the saved transaction hash and does not invite a duplicate funded write.

**Documentation reconciliation:** the audit also corrected stale status text. Termination,
expire-unaccepted, How It Works, the nested termination type, the release identity guard, and
commitment-matched campaign discovery were already implemented; they are no longer listed as
unfinished. The public README now describes the repository as a working Studionet MVP rather
than a planning-only project.
