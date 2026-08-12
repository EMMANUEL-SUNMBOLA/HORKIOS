import { relayGenLayerRpc } from "@/lib/rpc-relay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return relayGenLayerRpc(
    request,
    process.env.NEXT_PUBLIC_GENLAYER_NETWORK || "studionet",
  );
}
