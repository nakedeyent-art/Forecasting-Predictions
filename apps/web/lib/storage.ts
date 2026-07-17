import type { ActionItem, DecisionRequest, JournalPrediction, SavedDecision, UserPreset } from "./types";

export const storageKeys = {
  predictions: "oracle.predictionJournal",
  decisions: "oracle.decisionHistory",
  actions: "oracle.actionItems",
  presets: "oracle.userPresets",
  theme: "oracle.theme"
} as const;

export function readStoredArray<T>(
  storage: Storage,
  key: string,
  validator: (value: unknown) => value is T
): T[] {
  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      storage.removeItem(key);
      return [];
    }
    return parsed.filter(validator);
  } catch {
    storage.removeItem(key);
    return [];
  }
}

export function writeStoredArray<T>(storage: Storage, key: string, values: T[]) {
  storage.setItem(key, JSON.stringify(values));
}

export function isJournalPrediction(value: unknown): value is JournalPrediction {
  const item = value as JournalPrediction;
  return Boolean(
    item &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.statement === "string" &&
      typeof item.probability === "number" &&
      typeof item.dueDate === "string" &&
      typeof item.createdAt === "string"
  );
}

export function isSavedDecision(value: unknown): value is SavedDecision {
  const item = value as SavedDecision;
  return Boolean(
    item &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.createdAt === "string" &&
      item.request &&
      item.analysis
  );
}

export function isActionItem(value: unknown): value is ActionItem {
  const item = value as ActionItem;
  return Boolean(
    item &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.owner === "string" &&
      typeof item.dueDate === "string" &&
      ["open", "done", "void"].includes(item.status)
  );
}

export function isUserPreset(value: unknown): value is UserPreset {
  const item = value as UserPreset;
  return Boolean(
    item &&
      typeof item.id === "string" &&
      typeof item.label === "string" &&
      typeof item.createdAt === "string" &&
      isDecisionRequest(item.request)
  );
}

function isDecisionRequest(value: unknown): value is DecisionRequest {
  const item = value as DecisionRequest;
  return Boolean(
    item &&
      typeof item.title === "string" &&
      typeof item.decision === "string" &&
      typeof item.domain === "string" &&
      Array.isArray(item.constraints) &&
      typeof item.time_horizon === "string" &&
      typeof item.risk_tolerance === "string" &&
      typeof item.success_metric === "string"
  );
}
