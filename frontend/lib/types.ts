export type Address = `0x${string}`;

export type DemandDraft = {
  instructions: string;
  weightBps: number;
  deadline: string;
  minViews: number;
  minLikes: number;
  minReposts: number;
};

export type CampaignDraft = {
  title: string;
  description: string;
  xAccount: string;
  acceptanceDeadline: string;
  escrowGen: string;
  demands: DemandDraft[];
};

export type VerificationDecision = {
  passed: boolean;
  post_exists: boolean;
  author_matches: boolean;
  content_matches: boolean;
  published_on_time: boolean;
  observed_views: bigint | number | string;
  observed_likes: bigint | number | string;
  observed_reposts: bigint | number | string;
  metrics_match: boolean;
  reason: string;
  checked_url: string;
  checked_at: bigint | number | string;
};

export type Demand = {
  instructions: string;
  weight_bps: bigint | number | string;
  allocation: bigint | number | string;
  original_deadline: bigint | number | string;
  proposed_deadline: bigint | number | string;
  active_deadline: bigint | number | string;
  review: number;
  status: number;
  min_views: bigint | number | string;
  min_likes: bigint | number | string;
  min_reposts: bigint | number | string;
  evidence_url: string;
  attempt_count: bigint | number | string;
  decision: VerificationDecision;
  settled_at: bigint | number | string;
};

export type TerminationCase = {
  requester: Address;
  category: string;
  statement: string;
  requester_evidence_json: string;
  respondent_statement: string;
  respondent_evidence_json: string;
  opened_at: bigint | number | string;
  response_deadline: bigint | number | string;
  status: number;
  ruling: number;
  reason: string;
};

export type Campaign = {
  creator: Address;
  kol: Address;
  invite_hash: string;
  title: string;
  description: string;
  x_account: string;
  status: number;
  acceptance_deadline: bigint | number | string;
  created_at: bigint | number | string;
  activated_at: bigint | number | string;
  original_escrow: bigint | number | string;
  locked_amount: bigint | number | string;
  gross_paid: bigint | number | string;
  net_paid: bigint | number | string;
  fees_paid: bigint | number | string;
  refunded: bigint | number | string;
  passed_count: number;
  demands: Demand[];
  termination: TerminationCase;
};

export type TxStage = "idle" | "signing" | "submitted" | "accepted" | "evaluating" | "finalized" | "undetermined" | "error";
