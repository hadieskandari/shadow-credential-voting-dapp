import { SDK_CDN_URL } from "./constants";
import type { FhevmRelayerSDKType, FhevmWindowType } from "./fhevmTypes";

type Trace = (message?: unknown, ...optionalParams: unknown[]) => void;

export class RelayerSDKLoader {
  private trace?: Trace;

  constructor(options: { trace?: Trace }) {
    this.trace = options.trace;
  }

  isLoaded() {
    if (typeof window === "undefined") {
      throw new Error("RelayerSDKLoader: can only be used in the browser.");
    }
    return isFhevmWindowType(window, this.trace);
  }

  load(): Promise<void> {
    if (typeof window === "undefined") {
      return Promise.reject(new Error("RelayerSDKLoader: can only be used in the browser."));
    }

    if ("relayerSDK" in window) {
      if (!isFhevmRelayerSDKType(window.relayerSDK, this.trace)) {
        throw new Error("RelayerSDKLoader: Unable to load FHEVM Relayer SDK");
      }
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${SDK_CDN_URL}"]`);
      if (existingScript) {
        if (!isFhevmWindowType(window, this.trace)) {
          reject(new Error("RelayerSDKLoader: window object does not contain a valid relayerSDK object."));
        }
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = SDK_CDN_URL;
      script.type = "text/javascript";
      script.async = true;

      script.onload = () => {
        if (!isFhevmWindowType(window, this.trace)) {
          reject(
            new Error(
              `RelayerSDKLoader: Relayer SDK script has been successfully loaded from ${SDK_CDN_URL}, however, the window.relayerSDK object is invalid.`,
            ),
          );
        }
        resolve();
      };

      script.onerror = () => {
        reject(new Error(`RelayerSDKLoader: Failed to load Relayer SDK from ${SDK_CDN_URL}`));
      };

      document.head.appendChild(script);
    });
  }
}

function isFhevmRelayerSDKType(o: unknown, trace?: Trace): o is FhevmRelayerSDKType {
  if (typeof o === "undefined") {
    trace?.("RelayerSDKLoader: relayerSDK is undefined");
    return false;
  }
  if (o === null) {
    trace?.("RelayerSDKLoader: relayerSDK is null");
    return false;
  }
  if (typeof o !== "object") {
    trace?.("RelayerSDKLoader: relayerSDK is not an object");
    return false;
  }
  if (!hasProperty(o, "initSDK", "function", trace)) return false;
  if (!hasProperty(o, "createInstance", "function", trace)) return false;
  if (!hasProperty(o, "SepoliaConfig", "object", trace)) return false;
  if ("__initialized__" in o) {
    if ((o as any).__initialized__ !== true && (o as any).__initialized__ !== false) {
      trace?.("RelayerSDKLoader: relayerSDK.__initialized__ is invalid");
      return false;
    }
  }
  return true;
}

export function isFhevmWindowType(win: unknown, trace?: Trace): win is FhevmWindowType {
  if (typeof win === "undefined") {
    trace?.("RelayerSDKLoader: window object is undefined");
    return false;
  }
  if (win === null) {
    trace?.("RelayerSDKLoader: window object is null");
    return false;
  }
  if (typeof win !== "object") {
    trace?.("RelayerSDKLoader: window is not an object");
    return false;
  }
  if (!("relayerSDK" in win)) {
    trace?.("RelayerSDKLoader: window does not contain 'relayerSDK' property");
    return false;
  }
  return isFhevmRelayerSDKType((win as FhevmWindowType).relayerSDK, trace);
}

function hasProperty<T extends object, K extends PropertyKey, V extends string>(
  obj: T,
  propertyName: K,
  propertyType: V,
  trace?: Trace,
): obj is T &
  Record<
    K,
    V extends "string"
      ? string
      : V extends "number"
        ? number
        : V extends "object"
          ? object
          : V extends "boolean"
            ? boolean
            : V extends "function"
              ? (...args: any[]) => any
              : unknown
  > {
  if (!obj || typeof obj !== "object") {
    return false;
  }

  if (!(propertyName in obj)) {
    trace?.(`RelayerSDKLoader: missing ${String(propertyName)}.`);
    return false;
  }

  const value = (obj as Record<K, unknown>)[propertyName];

  if (value === null || value === undefined) {
    trace?.(`RelayerSDKLoader: ${String(propertyName)} is null or undefined.`);
    return false;
  }

  if (typeof value !== propertyType) {
    trace?.(`RelayerSDKLoader: ${String(propertyName)} is not a ${propertyType}.`);
    return false;
  }

  return true;
}
