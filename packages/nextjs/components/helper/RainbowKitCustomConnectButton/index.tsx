"use client";

// @refresh reset
import { Balance } from "../Balance";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet2 } from "lucide-react";
import { Address } from "viem";
import { useTargetNetwork } from "~~/hooks/helper/useTargetNetwork";

/**
 * Custom Wagmi Connect Button (watch balance + custom design)
 */
export const RainbowKitCustomConnectButton = ({ compact = false }: { compact?: boolean } = {}) => {
  const { targetNetwork } = useTargetNetwork();

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openAccountModal, openChainModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <>
            {(() => {
              if (!connected) {
                if (compact) {
                  return (
                    <button
                      className="inline-flex h-12 w-12 items-center justify-center text-white"
                      onClick={openConnectModal}
                      type="button"
                      aria-label="Connect wallet"
                    >
                      <Wallet2 className="h-6 w-6" />
                    </button>
                  );
                }
                return (
                  <button
                    className="btn btn-md rounded-full border border-white/20 bg-transparent px-5 py-2 text-white font-semibold cursor-pointer"
                    onClick={openConnectModal}
                    type="button"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported || chain.id !== targetNetwork.id) {
                return <WrongNetworkDropdown />;
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openChainModal}
                    className={
                      compact
                        ? "inline-flex h-12 w-12 items-center justify-center text-white"
                        : "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white"
                    }
                    aria-label="Select network"
                  >
                    <svg viewBox="0 0 256 417" className="h-5 w-5 fill-white" role="img" aria-hidden="true">
                      <path d="M127.9 0L124 13.9v270.6l3.9 3.9 127.9-75.4L127.9 0z" />
                      <path d="M127.9 0L0 212.9l127.9 75.4v-288.3z" />
                      <path d="M127.9 324.4l-2.2 2.7v86.9l2.2 6 128-180.1-128 84.5z" />
                      <path d="M127.9 419.9v-95.5L0 240.1l127.9 179.8z" />
                      <path d="M127.9 288.3l127.9-75.4-127.9-58.3v133.7z" />
                      <path d="M0 212.9l127.9 75.4v-133.7L0 212.9z" />
                    </svg>
                    {!compact && <span>{chain?.name ?? "Select chain"}</span>}
                  </button>
                  <button
                    type="button"
                    onClick={openAccountModal}
                    className={
                      compact
                        ? "inline-flex h-12 w-12 items-center justify-center text-white"
                        : "inline-flex items-center gap-3 rounded-full border border-white/20 bg-transparent text-white px-4 py-2"
                    }
                    aria-label="View wallet options"
                  >
                    {compact ? (
                      <Wallet2 className="h-6 w-6" />
                    ) : (
                      <>
                        <Balance address={account.address as Address} className="min-h-0 h-auto text-sm" />
                        <span>{account.displayName}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })()}
          </>
        );
      }}
    </ConnectButton.Custom>
  );
};
