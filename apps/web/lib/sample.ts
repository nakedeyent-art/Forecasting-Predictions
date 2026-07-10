import type { DecisionRequest } from "./types";

export const sampleDecision: DecisionRequest = {
  title: "Launch Oracle for paid beta teams",
  domain: "Startup",
  decision:
    "Decide whether to launch Oracle as a paid beta for operations, investing, and strategy teams. Demand is promising but uncertain, the first version must ship quickly, and the product should improve user judgment over time.",
  constraints: [
    "Ship a usable MVP in 30 days",
    "Avoid irreversible infrastructure commitments",
    "Use real calibration metrics"
  ],
  time_horizon: "6 months",
  budget: "$20,000",
  risk_tolerance: "Balanced",
  success_metric: "15 active paid beta teams"
};
