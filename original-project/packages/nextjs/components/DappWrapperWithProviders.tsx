"use client";

import { useEffect, useState } from "react";
import { InMemoryStorageProvider } from "@fhevm-sdk/next";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { BlockieAvatar } from "~~/components/helper";
import PageTransition from "./PageTransition";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

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
          <div className={`flex flex-col min-h-screen`}>
            <main className="relative flex flex-col flex-1">
              <InMemoryStorageProvider>
                <PageTransition>{children}</PageTransition>
              </InMemoryStorageProvider>
            </main>
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
