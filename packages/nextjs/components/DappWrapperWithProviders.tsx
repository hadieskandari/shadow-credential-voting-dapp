"use client";

import { useEffect, useState } from "react";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { BlockieAvatar } from "~~/components/helper";
import { InMemoryStorageProvider } from "~~/lib/fhevm/react";
import PageTransition from "./PageTransition";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import Silk from "~~/app/components/silk";

const BACKDROP = {
  color: "#a3a3a3",
  speed: 5.5,
  scale: 1,
  noiseIntensity: 1.2,
  rotation: -0.1,
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const DappWrapperWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          avatar={BlockieAvatar}
          theme={mounted ? (isDarkMode ? darkTheme() : lightTheme()) : lightTheme()}
        >
          <ProgressBar height="4px" color="#ffd208" options={{ showSpinner: false, easing: "ease", speed: 480 }} />
          <div className="relative min-h-screen overflow-hidden text-white">
            <div className="pointer-events-none fixed inset-0 z-0">
              <div className="absolute inset-0">
                <Silk
                  speed={BACKDROP.speed}
                  scale={BACKDROP.scale}
                  color={BACKDROP.color}
                  noiseIntensity={BACKDROP.noiseIntensity}
wh                  rotation={BACKDROP.rotation}
                />
              </div>
            </div>
            <div className="relative z-10 flex min-h-screen flex-col">
              <main className="relative flex flex-1 flex-col">
                <InMemoryStorageProvider>
                  <PageTransition>{children}</PageTransition>
                </InMemoryStorageProvider>
              </main>
            </div>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3200,
              style: {
                background: "rgba(10,10,10,0.92)",
                color: "#f8f8f8",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 18px 42px rgba(255,210,8,0.35)",
                backdropFilter: "blur(12px)",
                borderRadius: "16px",
                padding: "12px 14px",
              },
              success: {
                iconTheme: { primary: "#ffd208", secondary: "#0a0a0a" },
              },
              loading: {
                duration: 8000,
              },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
