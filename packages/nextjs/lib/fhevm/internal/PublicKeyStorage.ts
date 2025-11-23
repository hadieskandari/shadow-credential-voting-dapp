import { type DBSchema, type IDBPDatabase, openDB } from "idb";

type StoredPublicKey = {
  publicKeyId: string;
  publicKey: Uint8Array;
};

type StoredPublicParams = {
  publicParamsId: string;
  publicParams: Uint8Array;
};

interface PublicParamsDB extends DBSchema {
  publicKeyStore: {
    key: string;
    value: {
      acl: `0x${string}`;
      value: StoredPublicKey;
    };
  };
  paramsStore: {
    key: string;
    value: {
      acl: `0x${string}`;
      value: StoredPublicParams;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<PublicParamsDB>> | undefined;

async function getDB(): Promise<IDBPDatabase<PublicParamsDB> | undefined> {
  if (dbPromise) return dbPromise;
  if (typeof window === "undefined") {
    return undefined;
  }
  dbPromise = openDB<PublicParamsDB>("fhevm", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("paramsStore")) {
        db.createObjectStore("paramsStore", { keyPath: "acl" });
      }
      if (!db.objectStoreNames.contains("publicKeyStore")) {
        db.createObjectStore("publicKeyStore", { keyPath: "acl" });
      }
    },
  });
  return dbPromise;
}

type ConfigPublicKey = {
  data: Uint8Array | null;
  id: string | null;
};

type ConfigPublicParams = {
  2048: {
    publicParamsId: string;
    publicParams: Uint8Array;
  };
};

function assertStoredPublicKey(value: unknown): asserts value is StoredPublicKey | null {
  if (typeof value !== "object") throw new Error("Invalid public key record");
  if (value === null) return;
  if (!("publicKeyId" in value) || typeof (value as any).publicKeyId !== "string") {
    throw new Error("publicKeyId missing");
  }
  if (!("publicKey" in value) || !((value as any).publicKey instanceof Uint8Array)) {
    throw new Error("publicKey missing");
  }
}

function assertStoredPublicParams(value: unknown): asserts value is StoredPublicParams | null {
  if (typeof value !== "object") throw new Error("Invalid public params record");
  if (value === null) return;
  if (!("publicParamsId" in value) || typeof (value as any).publicParamsId !== "string") {
    throw new Error("publicParamsId missing");
  }
  if (!("publicParams" in value) || !((value as any).publicParams instanceof Uint8Array)) {
    throw new Error("publicParams missing");
  }
}

export async function publicKeyStorageGet(aclAddress: `0x${string}`): Promise<{
  publicKey?: ConfigPublicKey;
  publicParams: ConfigPublicParams | null;
}> {
  const db = await getDB();
  if (!db) return { publicParams: null };

  let storedPublicKey: StoredPublicKey | null = null;
  let storedPublicParams: StoredPublicParams | null = null;

  try {
    const pk = await db.get("publicKeyStore", aclAddress);
    if (pk?.value) {
      assertStoredPublicKey(pk.value);
      storedPublicKey = pk.value;
    }
  } catch {
    // ignore
  }

  try {
    const pp = await db.get("paramsStore", aclAddress);
    if (pp?.value) {
      assertStoredPublicParams(pp.value);
      storedPublicParams = pp.value;
    }
  } catch {
    // ignore
  }

  const publicKey = storedPublicKey
    ? {
        id: storedPublicKey.publicKeyId,
        data: storedPublicKey.publicKey,
      }
    : undefined;

  const publicParams = storedPublicParams ? { 2048: storedPublicParams } : null;

  return { ...(publicKey && { publicKey }), publicParams };
}

export async function publicKeyStorageSet(
  aclAddress: `0x${string}`,
  publicKey: StoredPublicKey | null,
  publicParams: StoredPublicParams | null,
) {
  assertStoredPublicKey(publicKey);
  assertStoredPublicParams(publicParams);

  const db = await getDB();
  if (!db) {
    return;
  }

  if (publicKey) {
    await db.put("publicKeyStore", { acl: aclAddress, value: publicKey });
  }

  if (publicParams) {
    await db.put("paramsStore", { acl: aclAddress, value: publicParams });
  }
}
