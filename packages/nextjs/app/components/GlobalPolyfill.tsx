"use client";

import { useEffect } from "react";

export const GlobalPolyfill = () => {
  useEffect(() => {
    if (typeof global === "undefined") {
      (window as any).global = globalThis;
    }

    if (typeof window !== "undefined" && typeof window.fetch === "function") {
      const blockedHosts = ["analytics.typeform.com", "cca-lite.coinbase.com"];
      const originalFetch = window.fetch.bind(window);

      window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input instanceof Request
                ? input.url
                : "";

        if (url && blockedHosts.some(host => url.includes(host))) {
          return Promise.resolve(
            new Response(JSON.stringify({}), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
            }),
          );
        }

        return originalFetch(input, init);
      };

      return () => {
        window.fetch = originalFetch;
      };
    }
  }, []);

  return null;
};
