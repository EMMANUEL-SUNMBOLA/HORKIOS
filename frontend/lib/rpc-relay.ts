export const HOSTED_RPC_UPSTREAMS = {
  studionet: "https://studio.genlayer.com/api",
  testnetBradbury: "https://rpc-bradbury.genlayer.com",
} as const;

export type HostedNetwork = keyof typeof HOSTED_RPC_UPSTREAMS;

export const RPC_RELAY_PATH = "/api/genlayer-rpc";
export const RPC_MAX_BODY_BYTES = 256 * 1024;
export const RPC_TIMEOUT_MS = 30_000;
export const RPC_RETRIES = 2;

function isRetryableStatus(status: number): boolean {
  return status >= 502 && status <= 504;
}

const delay = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: unknown;
};

function rpcError(id: JsonRpcRequest["id"], code: number, message: string, status: number) {
  return Response.json(
    { jsonrpc: "2.0", id: id ?? null, error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function hostedRpcUpstream(network: string): string | null {
  return network in HOSTED_RPC_UPSTREAMS
    ? HOSTED_RPC_UPSTREAMS[network as HostedNetwork]
    : null;
}

function isJsonRpcRequest(value: unknown): value is JsonRpcRequest {
  return Boolean(
    value
    && typeof value === "object"
    && (value as { jsonrpc?: unknown }).jsonrpc === "2.0"
    && typeof (value as { method?: unknown }).method === "string"
    && (value as { method: string }).method.length > 0,
  );
}

export async function relayGenLayerRpc(
  request: Request,
  network: string,
  fetcher: typeof fetch = fetch,
  sleeper: (milliseconds: number) => Promise<unknown> = delay,
): Promise<Response> {
  const upstream = hostedRpcUpstream(network);
  if (!upstream) return rpcError(null, -32600, "RPC relay is only available for hosted GenLayer networks", 400);

  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin || requestOrigin !== new URL(request.url).origin) {
    return rpcError(null, -32001, "Cross-origin RPC relay requests are not allowed", 403);
  }
  if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
    return rpcError(null, -32600, "Content-Type must be application/json", 415);
  }
  const declaredSize = Number(request.headers.get("content-length") || 0);
  if (declaredSize > RPC_MAX_BODY_BYTES) return rpcError(null, -32600, "JSON-RPC request is too large", 413);

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > RPC_MAX_BODY_BYTES) {
    return rpcError(null, -32600, "JSON-RPC request is too large", 413);
  }
  let payload: unknown;
  try { payload = JSON.parse(body); } catch { return rpcError(null, -32700, "Invalid JSON", 400); }
  const requests = Array.isArray(payload) ? payload : [payload];
  if (requests.length === 0 || !requests.every(isJsonRpcRequest)) {
    return rpcError(null, -32600, "Invalid JSON-RPC request", 400);
  }

  let lastError: unknown;
  let lastResponse: Response | undefined;
  for (let attempt = 0; attempt <= RPC_RETRIES; attempt += 1) {
    try {
      const response = await fetcher(upstream, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
      });
      if (attempt === RPC_RETRIES || !isRetryableStatus(response.status)) {
        const retryAfter = response.headers.get("retry-after");
        return new Response(await response.text(), {
          status: response.status,
          headers: {
            "Content-Type": response.headers.get("content-type") || "application/json",
            "Cache-Control": "no-store",
            ...(retryAfter ? { "Retry-After": retryAfter } : {}),
          },
        });
      }
      lastResponse = response;
      await sleeper(250 * (2 ** attempt));
    } catch (error) {
      lastError = error;
      if (attempt === RPC_RETRIES) break;
      await sleeper(250 * (2 ** attempt));
    }
  }
  if (lastResponse) {
    return new Response(await lastResponse.text(), {
      status: lastResponse.status,
      headers: {
        "Content-Type": lastResponse.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
  const timedOut = Boolean(
    lastError
    && typeof lastError === "object"
    && "name" in lastError
    && lastError.name === "TimeoutError",
  );
  return rpcError(
    requests[0].id,
    -32000,
    timedOut ? `GenLayer ${network} RPC timed out` : `GenLayer ${network} RPC is unavailable`,
    timedOut ? 504 : 502,
  );
}
