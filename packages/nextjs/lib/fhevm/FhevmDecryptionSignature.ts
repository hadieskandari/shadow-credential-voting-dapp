import { ethers } from "ethers";
import type { GenericStringStorage } from "./storage";
import type { EIP712Type, FhevmDecryptionSignatureType, FhevmInstance } from "./fhevmTypes";

function now(): number {
  return Math.floor(Date.now() / 1000);
}

class SignatureStorageKey {
  #key: string;
  constructor(instance: FhevmInstance, contractAddresses: string[], userAddress: string, publicKey?: string) {
    if (!ethers.isAddress(userAddress)) {
      throw new TypeError(`Invalid address ${userAddress}`);
    }

    const sortedContractAddresses = (contractAddresses as `0x${string}`[]).sort();
    const emptyEIP712 = (instance as any).createEIP712(
      publicKey ?? (ethers as any).ZeroAddress,
      sortedContractAddresses,
      0,
      0,
    );
    const hash = (ethers as any).TypedDataEncoder.hash(
      emptyEIP712.domain,
      { UserDecryptRequestVerification: emptyEIP712.types.UserDecryptRequestVerification },
      emptyEIP712.message,
    );
    this.#key = `${userAddress}:${hash}`;
  }

  get key() {
    return this.#key;
  }
}

export class FhevmDecryptionSignature {
  #publicKey: string;
  #privateKey: string;
  #signature: string;
  #startTimestamp: number;
  #durationDays: number;
  #userAddress: `0x${string}`;
  #contractAddresses: `0x${string}`[];
  #eip712: EIP712Type;

  private constructor(parameters: FhevmDecryptionSignatureType) {
    if (!FhevmDecryptionSignature.checkIs(parameters)) {
      throw new TypeError("Invalid FhevmDecryptionSignatureType");
    }
    this.#publicKey = parameters.publicKey;
    this.#privateKey = parameters.privateKey;
    this.#signature = parameters.signature;
    this.#startTimestamp = parameters.startTimestamp;
    this.#durationDays = parameters.durationDays;
    this.#userAddress = parameters.userAddress;
    this.#contractAddresses = parameters.contractAddresses;
    this.#eip712 = parameters.eip712;
  }

  get privateKey() {
    return this.#privateKey;
  }
  get publicKey() {
    return this.#publicKey;
  }
  get signature() {
    return this.#signature;
  }
  get contractAddresses() {
    return this.#contractAddresses;
  }
  get startTimestamp() {
    return this.#startTimestamp;
  }
  get durationDays() {
    return this.#durationDays;
  }
  get userAddress() {
    return this.#userAddress;
  }

  static checkIs(s: unknown): s is FhevmDecryptionSignatureType {
    if (!s || typeof s !== "object") return false;
    const obj = s as Record<string, unknown>;
    return (
      typeof obj.publicKey === "string" &&
      typeof obj.privateKey === "string" &&
      typeof obj.signature === "string" &&
      typeof obj.startTimestamp === "number" &&
      typeof obj.durationDays === "number" &&
      Array.isArray(obj.contractAddresses) &&
      typeof obj.userAddress === "string" &&
      obj.userAddress.startsWith("0x") &&
      typeof obj.eip712 === "object"
    );
  }

  toJSON() {
    return {
      publicKey: this.#publicKey,
      privateKey: this.#privateKey,
      signature: this.#signature,
      startTimestamp: this.#startTimestamp,
      durationDays: this.#durationDays,
      userAddress: this.#userAddress,
      contractAddresses: this.#contractAddresses,
      eip712: this.#eip712,
    };
  }

  static fromJSON(json: unknown) {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    return new FhevmDecryptionSignature(data as any);
  }

  isValid(): boolean {
    return now() < this.#startTimestamp + this.#durationDays * 24 * 60 * 60;
  }

  async save(storage: GenericStringStorage, instance: FhevmInstance, withPublicKey: boolean) {
    try {
      const value = JSON.stringify(this);
      const storageKey = new SignatureStorageKey(
        instance,
        this.#contractAddresses,
        this.#userAddress,
        withPublicKey ? this.#publicKey : undefined,
      );
      await storage.setItem(storageKey.key, value);
    } catch {
      // ignore
    }
  }

  static async load(
    storage: GenericStringStorage,
    instance: FhevmInstance,
    contractAddresses: string[],
    userAddress: string,
    publicKey?: string,
  ) {
    try {
      const storageKey = new SignatureStorageKey(instance, contractAddresses, userAddress, publicKey);
      const result = await storage.getItem(storageKey.key);
      if (!result) {
        return null;
      }
      const parsed = FhevmDecryptionSignature.fromJSON(result);
      return parsed.isValid() ? parsed : null;
    } catch {
      return null;
    }
  }

  static async create(
    instance: FhevmInstance,
    contractAddresses: string[],
    publicKey: string,
    privateKey: string,
    signer: ethers.JsonRpcSigner,
  ) {
    try {
      const userAddress = (await signer.getAddress()) as `0x${string}`;
      const startTimestamp = now();
      const durationDays = 365;
      const eip712 = (instance as any).createEIP712(publicKey, contractAddresses, startTimestamp, durationDays);
      const signature = await (signer as any).signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message,
      );
      return new FhevmDecryptionSignature({
        publicKey,
        privateKey,
        contractAddresses: contractAddresses as `0x${string}`[],
        startTimestamp,
        durationDays,
        signature,
        eip712: eip712 as EIP712Type,
        userAddress,
      });
    } catch {
      return null;
    }
  }

  static async loadOrSign(
    instance: FhevmInstance,
    contractAddresses: string[],
    signer: ethers.JsonRpcSigner,
    storage: GenericStringStorage,
    keyPair?: { publicKey: string; privateKey: string },
  ) {
    const userAddress = (await signer.getAddress()) as `0x${string}`;

    const cached = await FhevmDecryptionSignature.load(
      storage,
      instance,
      contractAddresses,
      userAddress,
      keyPair?.publicKey,
    );
    if (cached) {
      return cached;
    }

    const { publicKey, privateKey } = keyPair ?? (instance as any).generateKeypair();
    const sig = await FhevmDecryptionSignature.create(instance, contractAddresses, publicKey, privateKey, signer);
    if (!sig) {
      return null;
    }
    await sig.save(storage, instance, Boolean(keyPair?.publicKey));
    return sig;
  }
}
