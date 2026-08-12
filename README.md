# HORKIOS

> Programmable oaths. Verifiable work. Trustless settlement.

HORKIOS is a Web3 escrow SaaS built around GenLayer Intelligent Contracts. Its name comes from **Zeus Horkios**, the aspect of Zeus associated with guarding oaths and punishing broken promises.

HORKIOS turns a working agreement into a public, wallet-signed oath. A campaign creator defines what must be delivered, funds the agreement, and shares a private invitation link. The recipient reviews every demand, signs the terms with their wallet, submits public evidence, and receives payment as GenLayer verifies each milestone.

The project is currently in the **research and planning phase**. This repository contains the agreed MVP specification; application and contract implementation will follow.

## Why HORKIOS?

Traditional escrow can hold money, but it usually cannot determine whether a natural-language promise was fulfilled. A centralized marketplace can make that decision, but both parties must trust the marketplace.

GenLayer Intelligent Contracts can read public web evidence, interpret written requirements, and reach validator consensus on outcomes. HORKIOS uses that capability to connect an independently verifiable decision directly to an on-chain payment.

The initial product focuses on KOL campaigns because they provide a clear and repeatable proof case:

- The agreement is understandable in plain language.
- Evidence is available through public post URLs.
- Authorship, content, timestamps, views, likes, and reposts can be evaluated.
- Work can be divided into weighted, independently payable milestones.
- The escrow has a real on-chain consequence when validators reach a decision.

## MVP

The first HORKIOS release will support public X/Twitter campaigns funded with native GEN on GenLayer Testnet Bradbury.

### Creator journey

1. Connect a wallet on the supported GenLayer network.
2. Create a campaign and identify the X account expected to perform the work.
3. Add between 1 and 10 demands, with instructions, payment weights, metrics, and deadlines.
4. Deposit the complete campaign budget in native GEN.
5. Receive a secret invitation link and share it with the intended KOL.
6. Follow submissions, GenLayer decisions, payouts, refunds, or termination proceedings from the campaign page.

### KOL journey

1. Open the secret invitation and connect a wallet.
2. Review every demand individually.
3. Accept a demand or decline it with a proposed replacement deadline and an optional reason.
4. Activate the campaign immediately if all original terms are accepted, or wait for the creator to approve the countered deadlines.
5. Submit canonical X/Twitter post URLs as evidence.
6. Receive automatic milestone payments after successful GenLayer verification.

### Settlement rules

- Demand weights total 100% of the escrow and become immutable when the campaign activates.
- Every completed demand releases its allocated amount automatically.
- HORKIOS deducts a 1% platform fee only from amounts paid to the KOL.
- Refunds are not charged a platform fee.
- Completed payouts are final and cannot be reversed by a later dispute.
- A check that fails before its deadline may be retried because public engagement can increase.
- An expired demand receives one final verification before its allocation is refunded.
- Validator output is parsed strictly: malformed shapes, string booleans, invalid numbers,
  or a status ID that does not match the canonical evidence URL cannot authorize a payout.
- Neither party can unilaterally withdraw after activation.

## Exceptional termination

Either party may request termination and submit public evidence. The other party receives a response window before GenLayer rules on the request.

- If a genuine external hardship occurs after at least one demand passed, 20% of the remaining locked funds is paid to the KOL and 80% is refunded to the creator.
- If hardship occurs before any demand passed, all remaining funds return to the creator.
- If GenLayer verifies KOL breach, abandonment, fraud, or deliberate deletion, all remaining funds return to the creator.
- If the termination request is unsupported, the campaign resumes.
- Ordinary dissatisfaction cannot block a demand that passed its agreed criteria.

GenLayer's protocol-level appeal mechanism remains available for contested validator decisions. HORKIOS will not include an administrator wallet capable of overriding outcomes or redirecting escrow.

## Architecture

The MVP will use three layers:

1. **Intelligent Contract** — Python contract holding campaign state and native GEN, running verification, and settling funds.
2. **Web application** — Next.js and TypeScript interface using GenLayerJS and an injected wallet such as MetaMask.
3. **GenLayer network** — RPC, Optimistic Democracy consensus, Equivalence Principle validation, web access, and final settlement.

The frontend will communicate directly with the Intelligent Contract. The MVP will not require a database, centralized adjudication service, or public application API. A future read-only indexer may provide search, notifications, analytics, and webhooks, but it must never determine outcomes or control funds.

## Planned repository structure

```text
HORKIOS/
├── contracts/               # GenLayer Python Intelligent Contracts
├── deploy/                  # Repeatable TypeScript deployment scripts
├── frontend/                # Next.js web application
├── tests/
│   ├── direct/              # Fast contract tests with mocked web/LLM data
│   └── integration/         # Studio and testnet consensus tests
├── CONTRACTS-PLAN.md        # Contract model, interfaces, and invariants
├── UI-LAYOUT.md             # Product UX and responsive layouts
└── README.md
```

## Development phases

### Phase 1 — Evidence feasibility

- Prove that multiple validators can independently retrieve stable X post authorship, content, timestamps, and public metrics.
- Define source-grounded Equivalence Principle prompts and structured results.
- Test inaccessible, deleted, suspended, malformed, and changing post data.

### Phase 2 — Contract MVP

- Implement campaign creation, escrow accounting, secret invitations, granular acceptance, counter-deadlines, verification, settlement, refunds, and termination.
- Establish direct-mode contract tests and financial invariant tests.

### Phase 3 — Product MVP

- Build the responsive creator, invitation, campaign, dashboard, and evidence flows.
- Integrate wallet connection, network switching, transaction feedback, and contract reads/writes.
- Validate the complete journey in local GenLayer Studio.

### Phase 4 — Submission and testnet

- Deploy to Testnet Bradbury.
- Publish reproducible setup and deployment documentation.
- Record successful, failed, counteroffer, and hardship demo scenarios.
- Submit the contract, repository, architecture, test results, deployment address, and demonstration through the GenLayer contribution portal.

## MVP success criteria

- Two independent wallets can complete the creator and KOL journey without a HORKIOS operator.
- The KOL explicitly accepts every demand or proposes replacement deadlines before activation.
- GenLayer independently verifies a real public X post.
- A successful milestone pays the correct recipient and exact 1% platform fee.
- A failed or expired milestone refunds the correct allocation without a fee.
- A termination ruling preserves past payouts and correctly distributes only the remaining escrow.
- Contract accounting always reconciles deposited, locked, paid, refunded, and fee amounts.
- The deployed project demonstrates both Optimistic Democracy and the Equivalence Principle.

## Deferred beyond MVP

- Stablecoin and ERC-20 escrow.
- YouTube, TikTok, GitHub, deployed software, design, and general freelance work.
- Private evidence or confidential agreements.
- Public indexing API, notifications, webhooks, and analytics.
- Full negotiation chat and arbitrary term editing.
- On-chain reputation and reusable profiles.
- Team accounts, organizations, and multi-approver campaigns.
- Mobile applications and fiat on/off ramps.

## Documentation

- [Contract plan](./CONTRACTS-PLAN.md)
- [UI and layout plan](./UI-LAYOUT.md)

## Status

Research and specification. No production contract has been deployed, and testnet GEN has no monetary value.
