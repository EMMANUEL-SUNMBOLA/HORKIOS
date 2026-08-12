import { z } from "zod";

const futureDate = z.string().refine(value => new Date(value).getTime() > Date.now(), "Must be in the future");

export const demandDraftSchema = z.object({
  instructions: z.string().trim().min(1).max(1000),
  weightBps: z.number().int().min(1).max(10_000),
  deadline: futureDate,
  minViews: z.number().int().nonnegative(),
  minLikes: z.number().int().nonnegative(),
  minReposts: z.number().int().nonnegative(),
});

export const campaignDraftSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().max(2000),
  xAccount: z.string().trim().regex(/^@?[A-Za-z0-9_]{1,15}$/),
  acceptanceDeadline: futureDate,
  escrowGen: z.string().regex(/^\d+(\.\d{0,18})?$/).refine(value => Number(value) > 0, "Escrow must be positive"),
  demands: z.array(demandDraftSchema).min(1).max(10),
}).superRefine((value, context) => {
  if (value.demands.reduce((sum, demand) => sum + demand.weightBps, 0) !== 10_000) {
    context.addIssue({ code: "custom", path: ["demands"], message: "Demand weights must total 100%" });
  }
  const acceptance = new Date(value.acceptanceDeadline).getTime();
  value.demands.forEach((demand, index) => {
    if (new Date(demand.deadline).getTime() <= acceptance) context.addIssue({ code: "custom", path: ["demands", index, "deadline"], message: "Demand deadline must follow invitation expiry" });
  });
});

export function canonicalXUrl(value: string): string {
  const url = new URL(value.trim());
  if (url.protocol !== "https:" || !["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(url.hostname.toLowerCase())) throw new Error("Use a public X status URL");
  const match = url.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d+)\/?$/);
  if (!match || url.search || url.hash) throw new Error("Use the canonical post URL without query parameters");
  return `https://x.com/${match[1]}/status/${match[2]}`;
}
