import { networkName, type NetworkName } from "./genlayer/network";

export type Faucet = {
  label: string;
  url: string;
  note: string;
};

/**
 * Where each network's test GEN comes from. Studio networks expose the faucet
 * inside the Studio app (the 💧 button in the account selector); Bradbury has a
 * standalone faucet. Localnet has no faucet.
 */
export const FAUCETS: Partial<Record<NetworkName, Faucet>> = {
  studioDevnet: {
    label: "Open Studio Next faucet",
    url: "https://studio-next.genlayer.com",
    note: "Use the 💧 button in the Studio account selector to top up this address.",
  },
  studionet: {
    label: "Open Studionet faucet",
    url: "https://studio.genlayer.com",
    note: "Use the 💧 button in the Studio account selector to top up this address.",
  },
  testnetBradbury: {
    label: "Open Bradbury faucet",
    url: "https://testnet-faucet.genlayer.foundation/",
    note: "Paste your wallet address to receive testnet GEN.",
  },
};

export const faucetFor = (network: NetworkName = networkName): Faucet | undefined => FAUCETS[network];
