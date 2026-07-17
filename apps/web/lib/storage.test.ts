import { describe, expect, it } from "vitest";
import { isJournalPrediction, readStoredArray } from "./storage";

function storageWith(value: string): Storage {
  const values = new Map<string, string>([["key", value]]);
  return {
    length: values.size,
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: () => null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, item) => {
      values.set(key, item);
    }
  };
}

describe("storage helpers", () => {
  it("drops corrupted localStorage arrays without throwing", () => {
    const storage = storageWith("{bad json");

    expect(readStoredArray(storage, "key", isJournalPrediction)).toEqual([]);
    expect(storage.getItem("key")).toBeNull();
  });
});
