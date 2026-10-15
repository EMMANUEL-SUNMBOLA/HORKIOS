# HORKIOS UI and Layout Plan

## 1. Product experience

HORKIOS should feel like a serious agreement and settlement product, not a generic crypto dashboard or mythology game. The interface should make four things immediately understandable:

1. What has been promised.
2. Who accepted the promise.
3. What evidence GenLayer is evaluating.
4. Where every unit of escrow currently sits.

The oath concept supplies language and atmosphere, while familiar SaaS patterns keep the product usable.

### Suggested product language

| Technical concept | User-facing language |
| --- | --- |
| Campaign creation | Create an oath |
| Campaign | Oath / campaign |
| Campaign creator | Creator |
| Recipient | KOL |
| Milestone | Demand |
| Accept transaction | Swear to these terms |
| Evidence submission | Submit proof |
| Verification | Under GenLayer review |
| Passed demand | Oath fulfilled |
| Termination | Request termination |

Use “oath” in headings and brand moments, but retain precise words such as campaign, demand, evidence, payout, and refund wherever money or state could be misunderstood.

## 2. Visual direction

### Tone

- Trustworthy, solemn, modern, and transparent.
- Restrained references to carved stone, seals, bronze, lightning, and Greek geometry.
- Avoid cartoon gods, casino styling, excessive glow, or faux-ancient type for body copy.

### Palette

- Near-black charcoal background or ink text.
- Warm limestone surfaces.
- Bronze/gold accent for primary actions and accepted terms.
- Electric blue-violet used sparingly for GenLayer consensus activity.
- Green only for finalized payouts and verified demands.
- Amber for waiting/countered states.
- Red for expiry, rejection, breach, and destructive actions.

All semantic colors must meet WCAG AA contrast and must be paired with text or icons rather than used as the only signal.

### Typography

- A restrained display serif may be used for the HORKIOS wordmark and major marketing headings.
- Interface text, figures, addresses, forms, and status labels use a highly legible sans-serif.
- Wallet addresses, transaction hashes, campaign IDs, and GEN amounts use tabular or monospace numerals.

## 3. Global application shell

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────┐
│ HORKIOS          Explore     How it works       [Connect wallet]    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                         Page content                                 │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ Network · Contract · Documentation · Public testnet warning          │
└──────────────────────────────────────────────────────────────────────┘
```

### Authenticated navigation

- HORKIOS logo links to the landing page.
- Dashboard.
- Create oath.
- Network badge with wrong-network correction.
- Compact connected-wallet control.

### Mobile

- Logo and wallet status remain in the top bar.
- Navigation moves into an accessible menu or bottom navigation.
- Primary page actions may use a sticky bottom action area, but must not hide content or wallet prompts.

## 4. Landing page

### Purpose

Explain HORKIOS in under ten seconds and lead a connected or new user into campaign creation.

### Desktop layout

```text
┌──────────────────────────────────────────────────────────────────────┐
│                         Zeus Horkios                                 │
│                                                                      │
│       Turn promises into programmable, verifiable oaths.             │
│                                                                      │
│  Fund clear demands. Let GenLayer verify public proof.               │
│  Release payment without trusting a marketplace operator.            │
│                                                                      │
│  [Create an oath]      [See how settlement works]                    │
├──────────────────────────────────────────────────────────────────────┤
│ CREATE & FUND  ───  ACCEPT EACH DEMAND  ───  VERIFY  ───  SETTLE    │
├───────────────────────────────┬──────────────────────────────────────┤
│ Why ordinary escrow fails     │ Live sample oath / accounting card  │
├───────────────────────────────┴──────────────────────────────────────┤
│ Built on GenLayer · Public evidence · No admin adjudicator           │
└──────────────────────────────────────────────────────────────────────┘
```

### Required content

- One-sentence product proposition.
- Four-step process.
- Explanation of the Zeus Horkios name.
- Example KOL campaign with visible demands and weighted payment.
- Explanation of GenLayer's role and expected decision timing.
- Clear warning that the current release operates with testnet GEN.

## 5. Create-oath wizard

Use a four-step wizard with a persistent escrow summary on desktop.

```text
┌─────────────────────────────────────────┬────────────────────────────┐
│ 1 Basics  2 Demands  3 Deadlines  4 Fund│ Escrow summary             │
│                                         │                            │
│ Current step form                       │ Total: 100 GEN             │
│                                         │ Demands: 3                 │
│                                         │ Fee: charged on payouts    │
│                                         │ Refund fee: 0              │
│                                         │ Network: Bradbury          │
│ [Back]                    [Continue]     │                            │
└─────────────────────────────────────────┴────────────────────────────┘
```

### Step 1 — Basics

- Campaign title.
- Public description.
- Exact X account handle expected to post.
- Acceptance deadline.
- Persistent notice that all fields are public.

### Step 2 — Demands

Each demand card contains:

- Plain-language content instructions.
- Weight percentage.
- Optional minimum views, likes, and reposts.
- Add, duplicate, reorder, and remove controls.
- Live total-weight validation requiring exactly 100%.

Use no more than 10 demands. Numeric metric inputs clearly state that zero or blank disables that check.

### Step 3 — Deadlines

- A deadline control for every demand.
- Timeline preview ordered by date.
- Warning when dates are not realistically spaced or precede invitation expiry.
- Explanation that the KOL may propose later dates but cannot change content or payment weights.

### Step 4 — Review and fund

- Immutable-term preview.
- Exact gross allocation per demand.
- Expected KOL net payout and 1% fee per successful demand.
- Refund behavior.
- Connected account and network.
- Native GEN balance and required deposit.
- Required acknowledgement that terms and evidence are public.
- Primary action: `Fund and create oath`.

Transaction progress should show wallet signature, submission, consensus, and finalization separately.

### Invitation success state

After creation, display the secret invitation exactly once in a prominent copy panel:

```text
Your oath is funded.

[ https://horkios…/campaign/42#invite=•••••••• ] [Copy link]

Anyone with this secret can bind the KOL wallet before the deadline.
HORKIOS does not store the secret and cannot recover it for you.
```

## 6. KOL invitation and review

### Header

- `You have been invited to swear an oath`.
- Creator address with copy/explorer control.
- Expected X account.
- Total gross compensation.
- Acceptance countdown.
- Public-data warning.

### Demand review

The KOL must interact with every demand; there is no global checkbox that silently accepts all terms.

```text
Demand 2 of 3                                      40 GEN gross
──────────────────────────────────────────────────────────────
Publish a thread explaining the product's three core benefits.

Views ≥ 100,000      Likes ≥ 1,000      Deadline: 18 Sep

(•) Accept this demand
( ) Propose a later deadline: [ date/time ]
    Optional reason: [                                      ]
```

The final action is disabled until every demand has a response.

- All accepted: `Swear to these terms`.
- Any countered: `Sign and send deadline proposal`.
- A secondary `Decline campaign` action explains that the creator must cancel to recover escrow; it does not activate partial work.

## 7. Counteroffer creator view

- Show original and proposed dates side by side.
- Highlight which demands were accepted unchanged.
- Show the KOL's public reason where provided.
- Primary action: approve all proposed dates and activate.
- Destructive action: cancel campaign and refund full escrow.
- Do not provide partial approvals, weight editing, or an alternative creator counter in MVP.

## 8. Public campaign page

This is the canonical shareable record of an oath.

### Desktop layout

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Oath #42     [ACTIVE]                      GenLayer Bradbury          │
│ Product launch campaign · @expected_account                          │
│ Creator 0x12…90  ↔  KOL 0xab…34                                    │
├───────────────────────────────────────────┬──────────────────────────┤
│ Demands and evidence                      │ Escrow                    │
│                                           │ Original       100 GEN   │
│ [✓] Demand 1 — Paid                       │ Locked          60 GEN   │
│ [●] Demand 2 — Under review               │ Gross paid      40 GEN   │
│ [ ] Demand 3 — Awaiting proof             │ KOL received    39.6 GEN │
│                                           │ Platform fee     0.4 GEN │
│                                           │ Refunded          0 GEN  │
├───────────────────────────────────────────┴──────────────────────────┤
│ Activity and GenLayer decisions                                    │
└──────────────────────────────────────────────────────────────────────┘
```

### Demand card

- Status, allocation, instructions, targets, and agreed deadline.
- Submitted evidence as a safely rendered external link.
- Observed author and public metrics.
- GenLayer pass/fail checks.
- Short validator-consensus reason.
- Attempt count and finalized transaction link.
- Contextual KOL action to submit/replace evidence.
- Contextual party action to verify or perform the final expired check.

### Status vocabulary

| State | Display |
| --- | --- |
| `OFFERED` | Awaiting KOL review |
| `COUNTERED` | Deadline proposal pending |
| `ACTIVE` | Oath active |
| `TERMINATION_PENDING` | Termination under review |
| `COMPLETED` | Oath settled |
| `CANCELLED` | Cancelled and refunded |
| Demand `PENDING` | Awaiting proof |
| Demand `SUBMITTED` | Proof submitted |
| Demand `PASSED` | Verified and paid |
| Demand `REFUNDED` | Expired and refunded |

## 9. Evidence submission

- Show the selected demand and all enabled requirements above the form.
- Accept one canonical X/Twitter status URL.
- Parse and preview the post identifier before submitting.
- Warn that screenshots and private analytics are not accepted.
- Explain that a failed pre-deadline check can be retried as metrics grow.
- Show possible costs and the non-instant GenLayer decision lifecycle.

```text
Submit public proof

Post URL [ https://x.com/account/status/…                   ]

HORKIOS will ask GenLayer validators to verify:
✓ posted by @expected_account
✓ matches the content instructions
✓ published by the deadline
✓ meets enabled public metric targets

[Submit proof for verification]
```

## 10. Consensus and transaction feedback

Never collapse the process into a generic loading spinner. Use a reusable progress component:

```text
[✓] Wallet signed
[✓] Transaction submitted
[●] Validators evaluating public evidence
[ ] Optimistically accepted
[ ] Finalized and settled
```

Supported outcomes:

- Wallet rejected.
- Wrong network.
- RPC unavailable.
- Transaction pending.
- Validators evaluating.
- Optimistically accepted.
- Appealed.
- Finalized.
- Reverted.
- Undetermined because validators could not agree.

An undetermined result must explain that no contract state or funds changed and that the user may retry when the evidence source is stable.

## 11. Termination and dispute flow

### Opening a case

- Explain that past payouts cannot be reversed.
- Select a claimed category: external hardship, breach/abandonment, or other.
- Add a bounded public statement and public evidence URLs.
- Preview the currently locked balance and possible settlement rules.
- Require confirmation that evidence is permanently public.

### Response view

- Side-by-side statements on desktop and chronological cards on mobile.
- Visible 48-hour response countdown.
- The respondent can submit one statement and evidence set.
- No editing or deletion after transaction submission.

### Ruling view

- Structured outcome and concise reason.
- Original locked balance.
- KOL hardship gross payment, fee, net payment, and creator refund where applicable.
- Clear statement that previous milestone payments were preserved.
- Protocol appeal state and transaction links.

## 12. Dashboard

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Your oaths                                      [Create new oath]    │
│ [All] [As creator] [As KOL]       [Status filter] [Search by ID]    │
├──────────────────────────────────────────────────────────────────────┤
│ #42  Product launch       ACTIVE       60 GEN locked     Action →   │
│ #39  Thread campaign      COUNTERED    25 GEN locked     Review →   │
│ #31  Feature announcement COMPLETED     0 GEN locked     View →     │
└──────────────────────────────────────────────────────────────────────┘
```

- Data comes directly from bounded contract index views.
- Summary cards show active commitments, locked GEN, earned/refunded GEN, and outstanding actions.
- Empty states direct creators to create an oath and KOLs to open an invitation link.
- MVP search supports campaign ID; broader discovery requires a future indexer.

## 13. Mobile behavior

- Collapse secondary campaign metadata behind accessible disclosure controls.
- Stack escrow accounting below the campaign header but above demands.
- Keep demand status, allocation, deadline, and primary action visible without expanding the card.
- Use full-width transaction and signing buttons.
- Avoid horizontal tables; convert accounting and comparisons into labeled rows.
- Keep addresses truncated visually while copy actions retain the complete value.

## 14. Component inventory

- Wallet connect and network switcher.
- GEN amount input and formatter.
- Address and transaction link.
- Campaign and demand status badges.
- Demand editor and weight-total meter.
- Deadline picker and countdown.
- Per-demand acceptance control.
- Original/proposed deadline comparison.
- Escrow accounting card.
- Evidence URL input and post preview.
- Verification result checklist.
- Consensus progress timeline.
- Activity feed.
- Public-data warning.
- Destructive-action confirmation dialog.
- Empty, loading, error, wrong-network, appealed, and undetermined states.

## 15. Accessibility and safety

- Meet WCAG 2.2 AA contrast, focus visibility, keyboard operation, and semantic labeling.
- Do not rely on color alone for financial or verification status.
- Respect reduced-motion preferences; lightning or seal animations are decorative and optional.
- Announce transaction-state changes through an appropriate live region.
- Show full precision for final confirmation and accounting even when cards use compact display values.
- Require explicit confirmation for funding, cancellation, counteroffer approval, final expiration checks, and termination requests.
- Never render evidence-page HTML inside HORKIOS.
- Warn before leaving for external evidence and explorer links.
- Never request, transmit, or persist private keys.

## 16. Post-MVP UI surfaces

- Public campaign discovery and creator/KOL profiles.
- Notifications and action inbox.
- Stablecoin selection.
- Platform-specific evidence adapters.
- Full negotiation and revision history.
- Private agreement commitments and permissioned evidence.
- Organizations, teams, and approval policies.
- Analytics, exports, API keys, and webhooks.

