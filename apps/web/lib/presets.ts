import type { DecisionRequest } from "./types";

export type DecisionPreset = {
  id: string;
  label: string;
  request: DecisionRequest;
};

export const decisionPresets: DecisionPreset[] = [
  {
    id: "startup-launch",
    label: "Startup Launch",
    request: {
      title: "Launch a paid beta",
      domain: "Startup",
      decision:
        "Decide whether to launch a paid beta for a new software product. Demand looks promising, but the team needs to validate willingness to pay before committing to a larger buildout.",
      constraints: [
        "Ship a usable beta within 30 days",
        "Keep initial spend under $20,000",
        "Avoid irreversible infrastructure commitments"
      ],
      time_horizon: "6 months",
      budget: "$20,000",
      risk_tolerance: "Balanced",
      success_metric: "15 active paid beta teams"
    }
  },
  {
    id: "investment-thesis",
    label: "Investment Thesis",
    request: {
      title: "Evaluate an investment position",
      domain: "Investment",
      decision:
        "Decide whether to enter or increase an investment position after reviewing catalysts, valuation, downside risk, liquidity, and the probability of the thesis playing out.",
      constraints: [
        "Position size must fit portfolio risk limits",
        "Downside must be capped before entry",
        "Thesis needs at least three independent evidence sources"
      ],
      time_horizon: "12 months",
      budget: "5% maximum portfolio allocation",
      risk_tolerance: "Conservative",
      success_metric: "Risk-adjusted return beats the benchmark"
    }
  },
  {
    id: "career-move",
    label: "Career Move",
    request: {
      title: "Choose the next career move",
      domain: "Career",
      decision:
        "Decide whether to accept a new role, stay in the current position, or pursue another path based on upside, stability, skill growth, compensation, and long-term positioning.",
      constraints: [
        "Protect income stability",
        "Maintain room for skill growth",
        "Decision needed before the offer deadline"
      ],
      time_horizon: "18 months",
      budget: "No more than 2 months income disruption",
      risk_tolerance: "Balanced",
      success_metric: "Higher earnings, stronger network, and better long-term options"
    }
  },
  {
    id: "major-purchase",
    label: "Major Purchase",
    request: {
      title: "Compare a major purchase",
      domain: "Purchase",
      decision:
        "Decide whether to buy, lease, delay, or choose a lower-cost alternative after comparing total cost, reliability, resale value, financing terms, and opportunity cost.",
      constraints: [
        "Stay within monthly cash-flow limits",
        "Compare at least three alternatives",
        "Include maintenance and switching costs"
      ],
      time_horizon: "3 years",
      budget: "$50,000 maximum total cost",
      risk_tolerance: "Conservative",
      success_metric: "Best total value with manageable downside"
    }
  },
  {
    id: "market-strategy",
    label: "Market Strategy",
    request: {
      title: "Choose a market strategy",
      domain: "Strategy",
      decision:
        "Decide which market, segment, or channel to prioritize by comparing demand signals, competitor pressure, execution complexity, timing, and expected return.",
      constraints: [
        "Use existing team capacity",
        "Prioritize measurable demand",
        "Avoid channels with unclear attribution"
      ],
      time_horizon: "2 quarters",
      budget: "$35,000 test budget",
      risk_tolerance: "Balanced",
      success_metric: "Pipeline growth and repeatable acquisition signal"
    }
  },
  {
    id: "business-operations",
    label: "Operations Decision",
    request: {
      title: "Improve an operational workflow",
      domain: "Business",
      decision:
        "Decide whether to change an operational process, adopt new tooling, or keep the current workflow after evaluating cost, reliability, staff adoption, and measurable efficiency gains.",
      constraints: [
        "Do not interrupt current customer delivery",
        "Training must fit inside existing schedules",
        "Pilot must show measurable cycle-time improvement"
      ],
      time_horizon: "90 days",
      budget: "$10,000 pilot budget",
      risk_tolerance: "Balanced",
      success_metric: "20% reduction in cycle time without quality loss"
    }
  },
  {
    id: "personal-decision",
    label: "Personal Decision",
    request: {
      title: "Evaluate a personal life decision",
      domain: "Personal",
      decision:
        "Decide whether to make a meaningful personal change after weighing quality of life, financial impact, relationship effects, reversibility, and emotional cost.",
      constraints: [
        "Protect core financial stability",
        "Consider family and close stakeholder impact",
        "Prefer reversible first steps"
      ],
      time_horizon: "1 year",
      budget: "Keep emergency fund intact",
      risk_tolerance: "Conservative",
      success_metric: "Better quality of life with controlled downside"
    }
  },
  {
    id: "risk-review",
    label: "Risk Review",
    request: {
      title: "Stress-test a high-risk plan",
      domain: "Strategy",
      decision:
        "Decide whether a high-risk plan is worth pursuing by pressure-testing assumptions, identifying failure modes, estimating downside exposure, and defining stop-loss criteria.",
      constraints: [
        "List the top irreversible risks",
        "Require explicit stop-loss triggers",
        "Find disconfirming evidence before commitment"
      ],
      time_horizon: "60 days",
      budget: "Small test budget only",
      risk_tolerance: "Conservative",
      success_metric: "Clear go/no-go decision with bounded downside"
    }
  }
];

export function getPresetById(id: string): DecisionPreset | undefined {
  return decisionPresets.find((preset) => preset.id === id);
}
