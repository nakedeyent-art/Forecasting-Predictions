import type { DecisionRequest } from "./types";

export function validateDecisionRequest(request: DecisionRequest): string[] {
  const errors: string[] = [];
  if (request.title.trim().length < 3) {
    errors.push("Decision title must be at least 3 characters.");
  }
  if (request.decision.trim().length < 20) {
    errors.push("Decision must be at least 20 characters.");
  }
  if (request.decision.length > 5000) {
    errors.push("Decision must stay under 5,000 characters.");
  }
  if (request.constraints.length > 12) {
    errors.push("Use 12 constraints or fewer.");
  }
  if (request.constraints.some((constraint) => constraint.length > 240)) {
    errors.push("Each constraint must stay under 240 characters.");
  }
  if (request.time_horizon.trim().length === 0) {
    errors.push("Time horizon is required.");
  }
  if (request.success_metric.trim().length === 0) {
    errors.push("Success metric is required.");
  }
  return errors;
}
