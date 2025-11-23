"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ethers } from "ethers";
import type { FhevmInstance } from "../fhevmTypes";
import { createFhevmInstance } from "../internal/fhevm";

type FhevmStatus = "idle" | "loading" | "ready" | "error";

export function useFhevm(parameters: {
  provider: string | ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  enabled?: boolean;
  initialMockChains?: Readonly<Record<number, string>>;
}): {
  instance: FhevmInstance | undefined;
  refresh: () => void;
  error: Error | undefined;
  status: FhevmStatus;
} {
  const { provider, chainId, initialMockChains, enabled = true } = parameters;

  const [instance, setInstance] = useState<FhevmInstance | undefined>(undefined);
  const [status, setStatus] = useState<FhevmStatus>("idle");
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isRunning, setIsRunning] = useState<boolean>(enabled);
  const [providerChanged, setProviderChanged] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const providerRef = useRef<string | ethers.Eip1193Provider | undefined>(provider);
  const mockChainsRef = useRef<Record<number, string> | undefined>(initialMockChains as any);

  const refresh = useCallback(() => {
    if (abortControllerRef.current) {
      providerRef.current = undefined;
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    providerRef.current = provider;

    setInstance(undefined);
    setError(undefined);
    setStatus("idle");

    if (provider !== undefined) {
      setProviderChanged(prev => prev + 1);
    }
  }, [provider]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setIsRunning(enabled);
  }, [enabled]);

  useEffect(() => {
    if (!isRunning) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setInstance(undefined);
      setError(undefined);
      setStatus("idle");
      return;
    }

    if (providerRef.current === undefined) {
      setInstance(undefined);
      setError(undefined);
      setStatus("idle");
      return;
    }

    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController();
    }

    setStatus("loading");
    setError(undefined);

    const thisSignal = abortControllerRef.current.signal;
    const thisProvider = providerRef.current;
    const thisMockChains = mockChainsRef.current as any;

    createFhevmInstance({
      signal: thisSignal,
      provider: thisProvider as any,
      mockChains: thisMockChains as any,
      onStatusChange: s => console.log(`[useFhevm] createFhevmInstance status changed: ${s}`),
    })
      .then(i => {
        if (thisSignal.aborted) return;
        if (thisProvider !== providerRef.current) return;

        setInstance(i);
        setError(undefined);
        setStatus("ready");
      })
      .catch(e => {
        if (thisSignal.aborted) return;
        if (thisProvider !== providerRef.current) return;

        setInstance(undefined);
        setError(e as any);
        setStatus("error");
      });
  }, [isRunning, providerChanged]);

  return { instance, refresh, error, status };
}
