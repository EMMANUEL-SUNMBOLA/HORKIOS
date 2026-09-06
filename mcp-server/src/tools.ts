import { z } from "zod";
import {
  readClient, readCampaign, readConfig, writeClient, waitForOutcome,
  CONTRACT_ADDRESS, DEPLOYER_KEY,
} from "./contract.js";

const DEMAND_STATUS: Record<number, string> = { 0: "PROPOSED", 1: "PENDING", 2: "SUBMITTED", 3: "PASSED", 4: "REFUNDED" };
const CAMPAIGN_STATUS: Record<number, string> = { 0: "OFFERED", 1: "COUNTERED", 2: "ACTIVE", 3: "TERMINATION_PENDING", 4: "COMPLETED", 5: "CANCELLED" };
const TERMINATION_STATUS: Record<number, string> = { 0: "NONE", 1: "OPEN", 2: "READY", 3: "RULED" };
const RULING: Record<number, string> = { 0: "NONE", 1: "HARDSHIP", 2: "KOL_BREACH", 3: "UNSUPPORTED" };
const REVIEW: Record<number, string> = { 0: "UNSET", 1: "ACCEPTED", 2: "COUNTERED" };

function formatGen(wei: bigint | number | string): string {
  const w = BigInt(String(wei));
  const whole = w / 10n ** 18n;
  const frac = (w % 10n ** 18n).toString().padStart(18, "0").slice(0, 4);
  return `${whole}.${frac} GEN`;
}

function formatTs(ts: bigint | number | string): string {
  const n = Number(String(ts));
  return n === 0 ? "N/A" : new Date(n * 1000).toISOString();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatCampaign(c: any) {
  return {
    id: Number(c.id ?? 0),
    creator: c.creator,
    kol: c.kol === "0x0000000000000000000000000000000000000000" ? "none" : c.kol,
    title: c.title,
    description: c.description,
    x_account: c.x_account,
    status: CAMPAIGN_STATUS[Number(c.status)] ?? String(c.status),
    acceptance_deadline: formatTs(c.acceptance_deadline),
    created_at: formatTs(c.created_at),
    activated_at: formatTs(c.activated_at),
    original_escrow: formatGen(c.original_escrow),
    locked_amount: formatGen(c.locked_amount),
    gross_paid: formatGen(c.gross_paid),
    net_paid: formatGen(c.net_paid),
    fees_paid: formatGen(c.fees_paid),
    refunded: formatGen(c.refunded),
    passed_count: Number(c.passed_count),
    demands: (c.demands ?? []).map((d: any, i: number) => ({
      id: i,
      instructions: d.instructions,
      weight_bps: Number(d.weight_bps),
      allocation: formatGen(d.allocation),
      original_deadline: formatTs(d.original_deadline),
      active_deadline: formatTs(d.active_deadline),
      review: REVIEW[Number(d.review)] ?? String(d.review),
      status: DEMAND_STATUS[Number(d.status)] ?? String(d.status),
      min_views: Number(d.min_views),
      min_likes: Number(d.min_likes),
      min_reposts: Number(d.min_reposts),
      evidence_url: d.evidence_url || "none",
      attempt_count: Number(d.attempt_count),
      passed: Boolean(d.decision?.passed),
      reason: d.decision?.reason || "",
    })),
    termination: c.termination ? {
      requester: c.termination.requester,
      category: c.termination.category,
      status: TERMINATION_STATUS[Number(c.termination.status)] ?? String(c.termination.status),
      ruling: RULING[Number(c.termination.ruling)] ?? String(c.termination.ruling),
      reason: c.termination.reason,
    } : null,
  };
}

export type ToolDef = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
};

function requireSigner(): string {
  if (!DEPLOYER_KEY) throw new Error("DEPLOYER_PRIVATE_KEY not configured. Set it in .env or environment.");
  return DEPLOYER_KEY;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readContract(fn: string, args: any[]): Promise<any> {
  return await readClient.readContract({ address: CONTRACT_ADDRESS, functionName: fn, args: args as any });
}

async function writeContract0(fn: string, args: unknown[]): Promise<string> {
  const signer = requireSigner();
  const client = writeClient(signer);
  const hash: string = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: fn,
    args: args as any,
    value: 0n,
  });
  await waitForOutcome(hash as `0x${string}` & { length: 66 });
  return hash;
}

export function getTools(): ToolDef[] {
  return [
    {
      name: "get_config",
      description: "Get HORKIOS platform configuration: fee recipient, fee bps, max demands, termination window, release ID.",
      inputSchema: {},
      handler: async () => {
        const config = await readConfig() as Record<string, unknown>;
        return {
          release_id: config.release_id,
          fee_recipient: config.fee_recipient,
          fee_bps: Number(config.fee_bps),
          max_demands: Number(config.max_demands),
          termination_window: Number(config.termination_window),
        };
      },
    },
    {
      name: "get_campaign",
      description: "Get full details of an escrow campaign including all demands, accounting, and termination status.",
      inputSchema: {
        campaign_id: z.number().describe("The campaign ID to fetch"),
      },
      handler: async ({ campaign_id }) => {
        const c = await readCampaign(Number(campaign_id));
        return formatCampaign(c);
      },
    },
    {
      name: "get_demands",
      description: "Get all demands for a campaign with their verification status.",
      inputSchema: {
        campaign_id: z.number().describe("The campaign ID"),
      },
      handler: async ({ campaign_id }) => {
        const demands = await readContract("get_demands", [Number(campaign_id)]) as any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return demands.map((d: any, i: number) => ({
          id: i,
          instructions: d.instructions,
          weight_bps: Number(d.weight_bps),
          allocation: formatGen(d.allocation),
          original_deadline: formatTs(d.original_deadline),
          active_deadline: formatTs(d.active_deadline),
          review: REVIEW[Number(d.review)] ?? String(d.review),
          status: DEMAND_STATUS[Number(d.status)] ?? String(d.status),
          min_views: Number(d.min_views),
          min_likes: Number(d.min_likes),
          min_reposts: Number(d.min_reposts),
          evidence_url: d.evidence_url || "none",
          passed: Boolean(d.decision?.passed),
          reason: d.decision?.reason || "",
        }));
      },
    },
    {
      name: "get_campaign_accounting",
      description: "Get financial breakdown of a campaign: original escrow, locked, paid, fees, refunded.",
      inputSchema: {
        campaign_id: z.number().describe("The campaign ID"),
      },
      handler: async ({ campaign_id }) => {
        const a = await readContract("get_campaign_accounting", [Number(campaign_id)]) as Record<string, unknown>;
        return {
          original_escrow: formatGen(String(a.original_escrow)),
          locked_amount: formatGen(String(a.locked_amount)),
          gross_paid: formatGen(String(a.gross_paid)),
          net_paid: formatGen(String(a.net_paid)),
          fees_paid: formatGen(String(a.fees_paid)),
          refunded: formatGen(String(a.refunded)),
        };
      },
    },
    {
      name: "get_termination",
      description: "Get termination case details for a campaign.",
      inputSchema: {
        campaign_id: z.number().describe("The campaign ID"),
      },
      handler: async ({ campaign_id }) => {
        const t = await readContract("get_termination", [Number(campaign_id)]) as any;
        return {
          requester: t.requester,
          category: t.category,
          statement: t.statement,
          status: TERMINATION_STATUS[Number(t.status)] ?? String(t.status),
          ruling: RULING[Number(t.ruling)] ?? String(t.ruling),
          reason: t.reason,
          opened_at: formatTs(t.opened_at),
          response_deadline: formatTs(t.response_deadline),
        };
      },
    },
    {
      name: "get_creator_campaigns",
      description: "List campaign IDs created by a wallet address.",
      inputSchema: {
        address: z.string().describe("Creator wallet address"),
        cursor: z.number().default(0).describe("Pagination cursor"),
        limit: z.number().default(50).describe("Max results"),
      },
      handler: async ({ address, cursor, limit }) => {
        const ids = await readContract("get_creator_campaign_ids", [address, Number(cursor), Number(limit)]) as (number | bigint)[];
        return { campaign_ids: ids.map(Number), count: ids.length };
      },
    },
    {
      name: "get_kol_campaigns",
      description: "List campaign IDs where a wallet address is the KOL.",
      inputSchema: {
        address: z.string().describe("KOL wallet address"),
        cursor: z.number().default(0).describe("Pagination cursor"),
        limit: z.number().default(50).describe("Max results"),
      },
      handler: async ({ address, cursor, limit }) => {
        const ids = await readContract("get_kol_campaign_ids", [address, Number(cursor), Number(limit)]) as (number | bigint)[];
        return { campaign_ids: ids.map(Number), count: ids.length };
      },
    },
    {
      name: "create_campaign",
      description: "Create a new funded escrow campaign. Sends GEN as escrow. Returns the campaign ID after finalization.",
      inputSchema: {
        title: z.string().describe("Campaign title (max 120 chars)"),
        description: z.string().describe("Campaign description"),
        x_account: z.string().describe("KOL's X/Twitter handle (without @)"),
        acceptance_deadline: z.number().describe("Unix timestamp for KOL to accept"),
        invite_hash: z.string().describe("SHA-256 hex of the invite secret (64 hex chars)"),
        instructions: z.array(z.string()).describe("Instructions for each demand"),
        weights_bps: z.array(z.number()).describe("Weight in basis points for each demand (must total 10000)"),
        deadlines: z.array(z.number()).describe("Unix timestamp deadlines for each demand"),
        min_views: z.array(z.number()).describe("Minimum views per demand"),
        min_likes: z.array(z.number()).describe("Minimum likes per demand"),
        min_reposts: z.array(z.number()).describe("Minimum reposts per demand"),
        escrow_gen: z.string().describe("Amount of GEN to escrow (e.g. '10')"),
      },
      handler: async (args) => {
        const signer = requireSigner();
        const wei = BigInt(Math.round(parseFloat(args.escrow_gen as string) * 10 ** 18));
        const client = writeClient(signer);
        const hash: string = await client.writeContract({
          address: CONTRACT_ADDRESS,
          functionName: "create_campaign",
          args: [
            args.title, args.description, args.x_account,
            args.acceptance_deadline, args.invite_hash,
            args.instructions, args.weights_bps, args.deadlines,
            args.min_views, args.min_likes, args.min_reposts,
          ] as any,
          value: wei,
        });
        await waitForOutcome(hash as `0x${string}` & { length: 66 });
        return { status: "finalized", tx_hash: hash };
      },
    },
    {
      name: "review_campaign",
      description: "KOL reviews a campaign: accepts demands or proposes later deadlines. Requires the invite secret.",
      inputSchema: {
        campaign_id: z.number().describe("Campaign to review"),
        invite_secret: z.string().describe("64 hex char invite secret"),
        accepted: z.array(z.boolean()).describe("True to accept each demand, false to counter"),
        proposed_deadlines: z.array(z.number()).describe("Proposed deadlines for countered demands (0 for accepted)"),
      },
      handler: async (args) => {
        const hash = await writeContract0("review_campaign", [
          Number(args.campaign_id), args.invite_secret,
          args.accepted, args.proposed_deadlines,
        ]);
        return { status: "finalized", tx_hash: hash };
      },
    },
    {
      name: "approve_counteroffer",
      description: "Creator approves a KOL's counteroffer, activating the campaign.",
      inputSchema: {
        campaign_id: z.number().describe("Campaign with counteroffer"),
      },
      handler: async ({ campaign_id }) => {
        const hash = await writeContract0("approve_counteroffer", [Number(campaign_id)]);
        return { status: "finalized", tx_hash: hash };
      },
    },
    {
      name: "cancel_unaccepted_campaign",
      description: "Creator cancels a campaign before KOL acceptance. Full refund.",
      inputSchema: {
        campaign_id: z.number().describe("Campaign to cancel"),
      },
      handler: async ({ campaign_id }) => {
        const hash = await writeContract0("cancel_unaccepted_campaign", [Number(campaign_id)]);
        return { status: "finalized", tx_hash: hash };
      },
    },
    {
      name: "submit_evidence",
      description: "KOL submits a canonical X/Twitter status URL as evidence for a demand.",
      inputSchema: {
        campaign_id: z.number().describe("Campaign ID"),
        demand_id: z.number().describe("Demand index"),
        evidence_url: z.string().describe("Canonical X URL: https://x.com/{handle}/status/{id}"),
      },
      handler: async ({ campaign_id, demand_id, evidence_url }) => {
        const hash = await writeContract0("submit_evidence", [
          Number(campaign_id), Number(demand_id), evidence_url,
        ]);
        return { status: "finalized", tx_hash: hash };
      },
    },
    {
      name: "verify_demand",
      description: "Trigger AI verification of submitted evidence. Any party can call. Uses GenLayer consensus with web rendering + LLM analysis.",
      inputSchema: {
        campaign_id: z.number().describe("Campaign ID"),
        demand_id: z.number().describe("Demand index"),
      },
      handler: async ({ campaign_id, demand_id }) => {
        const hash = await writeContract0("verify_demand", [
          Number(campaign_id), Number(demand_id),
        ]);
        return { status: "finalized", tx_hash: hash };
      },
    },
    {
      name: "finalize_expired_demand",
      description: "After deadline: run final verification or refund. If evidence exists, re-verifies; otherwise refunds.",
      inputSchema: {
        campaign_id: z.number().describe("Campaign ID"),
        demand_id: z.number().describe("Demand index"),
      },
      handler: async ({ campaign_id, demand_id }) => {
        const hash = await writeContract0("finalize_expired_demand", [
          Number(campaign_id), Number(demand_id),
        ]);
        return { status: "finalized", tx_hash: hash };
      },
    },
    {
      name: "request_termination",
      description: "Either party requests campaign termination. Freezes campaign for 48h. Categories: external_hardship, kol_breach, other.",
      inputSchema: {
        campaign_id: z.number().describe("Campaign ID"),
        category: z.enum(["external_hardship", "kol_breach", "other"]).describe("Termination category"),
        statement: z.string().describe("Statement explaining the termination request"),
        evidence_urls: z.array(z.string()).describe("Supporting evidence URLs (max 5)"),
      },
      handler: async ({ campaign_id, category, statement, evidence_urls }) => {
        const hash = await writeContract0("request_termination", [
          Number(campaign_id), category, statement, evidence_urls,
        ]);
        return { status: "finalized", tx_hash: hash };
      },
    },
    {
      name: "respond_to_termination",
      description: "Other party responds to a termination request once. Within 48h window.",
      inputSchema: {
        campaign_id: z.number().describe("Campaign ID"),
        statement: z.string().describe("Response statement"),
        evidence_urls: z.array(z.string()).describe("Supporting evidence URLs"),
      },
      handler: async ({ campaign_id, statement, evidence_urls }) => {
        const hash = await writeContract0("respond_to_termination", [
          Number(campaign_id), statement, evidence_urls,
        ]);
        return { status: "finalized", tx_hash: hash };
      },
    },
    {
      name: "adjudicate_termination",
      description: "After 48h window, either party triggers AI adjudication. GenLayer validators rule: hardship, breach, or unsupported.",
      inputSchema: {
        campaign_id: z.number().describe("Campaign ID"),
      },
      handler: async ({ campaign_id }) => {
        const hash = await writeContract0("adjudicate_termination", [Number(campaign_id)]);
        return { status: "finalized", tx_hash: hash };
      },
    },
    {
      name: "expire_unaccepted_campaign",
      description: "Anyone can expire a campaign after its acceptance deadline passes without KOL acceptance. Full refund.",
      inputSchema: {
        campaign_id: z.number().describe("Campaign to expire"),
      },
      handler: async ({ campaign_id }) => {
        const hash = await writeContract0("expire_unaccepted_campaign", [Number(campaign_id)]);
        return { status: "finalized", tx_hash: hash };
      },
    },
    {
      name: "get_balance",
      description: "Get GEN balance of any address on the current network.",
      inputSchema: {
        address: z.string().describe("Wallet address to check"),
      },
      handler: async ({ address }) => {
        const bal = await readClient.getBalance({ address: address as `0x${string}` });
        return { address, balance: formatGen(bal), wei: bal.toString() };
      },
    },
  ];
}
