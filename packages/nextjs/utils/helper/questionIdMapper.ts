/**
 * Generate a cryptographically random alphanumeric ID (8+ characters)
 * Mix of uppercase, lowercase, and numbers
 */
export const generateRandomId = (length: number = 12): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
};

/**
 * Map between numeric question IDs and random alphanumeric IDs
 * Uses localStorage to persist the mapping
 */
class QuestionIdMapper {
  private readonly STORAGE_KEY = "shadow_question_id_mapping";
  private mapping: Map<number, string> = new Map();
  private reverseMapping: Map<string, number> = new Map();

  constructor() {
    this.loadMapping();
  }

  private loadMapping(): void {
    try {
      if (typeof window === "undefined") return;

      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.mapping = new Map(Object.entries(data).map(([k, v]) => [Number(k), v as string]));
        this.reverseMapping = new Map(
          Array.from(this.mapping.entries()).map(([k, v]) => [v, k])
        );
      }
    } catch (error) {
      console.warn("Failed to load question ID mapping:", error);
    }
  }

  private saveMapping(): void {
    try {
      if (typeof window === "undefined") return;

      const data = Object.fromEntries(this.mapping);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save question ID mapping:", error);
    }
  }

  /**
   * Get or create random ID for a numeric question ID
   */
  getRandomId(numericId: number): string {
    if (this.mapping.has(numericId)) {
      return this.mapping.get(numericId)!;
    }

    // Generate new random ID ensuring it doesn't exist
    let randomId: string;
    do {
      randomId = generateRandomId(12);
    } while (this.reverseMapping.has(randomId));

    this.mapping.set(numericId, randomId);
    this.reverseMapping.set(randomId, numericId);
    this.saveMapping();

    return randomId;
  }

  /**
   * Get numeric ID from random ID
   */
  getNumericId(randomId: string): number | null {
    return this.reverseMapping.get(randomId) ?? null;
  }

  /**
   * Check if a random ID exists
   */
  hasRandomId(randomId: string): boolean {
    return this.reverseMapping.has(randomId);
  }

  /**
   * Clear all mappings
   */
  clearMapping(): void {
    this.mapping.clear();
    this.reverseMapping.clear();
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}

export const questionIdMapper = new QuestionIdMapper();
