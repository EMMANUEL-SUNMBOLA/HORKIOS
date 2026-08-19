import { describe, expect, it, vi } from "vitest";
import {
  hostedRpcUpstream,
  relayGenLayerRpc,
  RPC_MAX_BODY_BYTES,
} from "./rpc-relay";

const url = "http://localhost:3000/api/genlayer-rpc";

function request(body: string, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    headers: { Origin: "http://localhost:3000", "Content-Type": "application/json", ...headers },
    body,
  });
}

const validBody = JSON.stringify({ jsonrpc: "2.0", id: 7, method: "gen_call", params: [] });

describe("hosted RPC routing", () => {
  it("uses fixed official upstreams and rejects arbitrary networks", () => {
    expect(hostedRpcUpstream("studionet")).toBe("https://studio.genlayer.com/api");
    expect(hostedRpcUpstream("testnetBradbury")).toBe("https://rpc-bradbury.genlayer.com");
    expect(hostedRpcUpstream("localnet")).toBeNull();
    expect(hostedRpcUpstream("https://attacker.test")).toBeNull();
  });

  it("forwards valid requests without caching", async () => {
    const fetcher = vi.fn(async () => new Response('{"jsonrpc":"2.0","id":7,"result":"ok"}', {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    const response = await relayGenLayerRpc(request(validBody), "studionet", fetcher as typeof fetch);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ result: "ok" });
    expect(fetcher).toHaveBeenCalledWith("https://studio.genlayer.com/api", expect.objectContaining({ body: validBody, cache: "no-store" }));
  });

  it("preserves upstream status and JSON-RPC errors", async () => {
    const fetcher = vi.fn(async () => new Response('{"jsonrpc":"2.0","id":7,"error":{"code":-1,"message":"failed"}}', { status: 429, headers: { "Retry-After": "30" } }));
    const response = await relayGenLayerRpc(request(validBody), "testnetBradbury", fetcher as typeof fetch);
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ error: { message: "failed" } });
    expect(response.headers.get("retry-after")).toBe("30");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("rejects cross-origin, malformed, and oversized requests", async () => {
    const crossOrigin = request(validBody, { Origin: "https://attacker.test" });
    expect((await relayGenLayerRpc(crossOrigin, "studionet")).status).toBe(403);
    expect((await relayGenLayerRpc(request("{"), "studionet")).status).toBe(400);
    expect((await relayGenLayerRpc(request(JSON.stringify({ hello: "world" })), "studionet")).status).toBe(400);
    const oversized = request(validBody, { "Content-Length": String(RPC_MAX_BODY_BYTES + 1) });
    expect((await relayGenLayerRpc(oversized, "studionet")).status).toBe(413);
  });

  it("returns structured timeout and upstream errors", async () => {
    const timeout = vi.fn(async () => { throw new DOMException("timed out", "TimeoutError"); });
    const timedOut = await relayGenLayerRpc(request(validBody), "studionet", timeout as typeof fetch);
    expect(timedOut.status).toBe(504);
    expect(await timedOut.json()).toMatchObject({ id: 7, error: { code: -32603, message: expect.stringContaining("timed out") } });

    const failed = vi.fn(async () => { throw new TypeError("fetch failed"); });
    const unavailable = await relayGenLayerRpc(request(validBody), "studionet", failed as typeof fetch);
    expect(unavailable.status).toBe(502);
    expect(await unavailable.json()).toMatchObject({ id: 7, error: { code: -32603, message: expect.stringContaining("unavailable") } });
  });

  it("retries transient upstream failures before succeeding", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response("boom", { status: 502 }))
      .mockResolvedValueOnce(new Response("boom", { status: 503 }))
      .mockResolvedValueOnce(new Response('{"jsonrpc":"2.0","id":7,"result":"ok"}', {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }));
    const response = await relayGenLayerRpc(request(validBody), "studionet", fetcher as typeof fetch, async () => {});
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ result: "ok" });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("does not retry client errors", async () => {
    const fetcher = vi.fn(async () => new Response('{"jsonrpc":"2.0","id":7,"error":{"code":-32000,"message":"rejected"}}', {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }));
    const response = await relayGenLayerRpc(request(validBody), "studionet", fetcher as typeof fetch);
    expect(response.status).toBe(400);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
