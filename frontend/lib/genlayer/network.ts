import { localnet, studionet, studioDevnet, testnetBradbury } from "genlayer-js/chains";
import { hostedRpcUpstream, RPC_RELAY_PATH } from "../rpc-relay";

/**
 * Chain resolution for the Consensus v0.6 release family.
 *
 * `studioDevnet` is Studio Next (`studio-next.genlayer.com`), the v0.6 release
 * candidate environment. Its canonical RPC is `studio-dev.genlayer.com/api`
 * (chain id 61997) and it is distinct from stable Studionet (61999). Browser
 * traffic is routed through the same-origin `/api/genlayer-rpc` relay because
 * the hosted endpoint does not allow localhost CORS; the wallet still registers
 * the canonical upstream when adding the chain.
 */
export const chains = { localnet, studionet, studioDevnet, testnetBradbury } as const;
export type NetworkName = keyof typeof chains;

export const DEFAULT_NETWORK: NetworkName = "studioDevnet";

const requestedNetwork = process.env.NEXT_PUBLIC_GENLAYER_NETWORK as NetworkName | undefined;

export const networkName: NetworkName =
  requestedNetwork && requestedNetwork in chains ? requestedNetwork : DEFAULT_NETWORK;

export const officialChain = chains[networkName];
export const expectedChainId = officialChain.id;

const browserRpc = hostedRpcUpstream(networkName)
  ? RPC_RELAY_PATH
  : officialChain.rpcUrls.default.http[0];

export const chain = {
  ...officialChain,
  rpcUrls: {
    ...officialChain.rpcUrls,
    default: { ...officialChain.rpcUrls.default, http: [browserRpc] },
  },
};
