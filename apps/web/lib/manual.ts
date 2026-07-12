export type ManualStep = {
  title: string;
  body: string;
};

export type ManualSection = {
  id: string;
  title: string;
  summary: string;
  steps: ManualStep[];
};

export type GlossaryTerm = {
  term: string;
  definition: string;
};

export const manualSections: ManualSection[] = [
  {
    id: "workflow",
    title: "How to run a decision analysis",
    summary: "Use this sequence when you want Oracle to turn a topic into a structured decision report.",
    steps: [
      {
        title: "Choose a preset or start blank",
        body: "A preset fills the topic fields with a complete example style. Use it as a template, then replace the details with your real decision."
      },
      {
        title: "State the decision as a clear choice",
        body: "Write the actual commitment being considered, such as whether to launch, buy, hire, invest, delay, or choose between options."
      },
      {
        title: "Add constraints and success metrics",
        body: "Constraints define what cannot be violated. Success metrics define what would make the decision successful after the horizon ends."
      },
      {
        title: "Run Analyze Decision",
        body: "Oracle decomposes the decision, creates scenarios, estimates probabilities, simulates outcome ranges, and produces a recommendation."
      },
      {
        title: "Save the prediction",
        body: "Save predictions that can be checked later. Mark outcomes as true or false in the journal to improve calibration over time."
      }
    ]
  },
  {
    id: "inputs",
    title: "Topic fields",
    summary: "These fields shape the quality and style of the analysis.",
    steps: [
      {
        title: "Decision title",
        body: "A short label for the decision. Keep it specific enough to recognize later in the prediction journal."
      },
      {
        title: "Domain",
        body: "The category of the decision: business, investment, career, purchase, strategy, startup, or personal. This adjusts framing and risks."
      },
      {
        title: "Decision",
        body: "The main question Oracle should analyze. Include options, context, uncertainty, and what would trigger action."
      },
      {
        title: "Time horizon",
        body: "The period over which the decision should be judged. Examples: 30 days, 6 months, 1 year, or 3 years."
      },
      {
        title: "Budget",
        body: "The money, time, attention, or capacity available. If the constraint is not financial, describe the non-financial limit."
      },
      {
        title: "Risk tolerance",
        body: "Conservative favors downside control. Balanced weighs upside and downside. Aggressive allows larger variance for higher potential upside."
      },
      {
        title: "Constraints",
        body: "Hard limits separated by semicolons. Examples: keep spend under $20,000; decide before August 1; avoid irreversible commitments."
      },
      {
        title: "Success metric",
        body: "The measurable result that decides whether the outcome was good. Strong metrics are observable and time-bound."
      }
    ]
  },
  {
    id: "report",
    title: "Reading the report",
    summary: "Use the report as a decision map, not as a guarantee.",
    steps: [
      {
        title: "Recommendation",
        body: "The recommended action based on the current inputs, probabilities, risks, and simulated outcomes."
      },
      {
        title: "Confidence",
        body: "How strongly Oracle supports the recommendation. Low confidence means the decision needs more evidence or a smaller reversible test."
      },
      {
        title: "Evidence strength",
        body: "A quality estimate for the available evidence. Treat weak evidence as a warning that the recommendation may change."
      },
      {
        title: "Forecast scenarios",
        body: "Best, base, worst, and black swan cases. Compare the narratives and leading indicators before acting."
      },
      {
        title: "Risk matrix",
        body: "Each risk is rated by probability, impact, mitigation, and confidence. High-probability/high-impact risks need explicit controls."
      },
      {
        title: "AI debate",
        body: "Specialist perspectives pressure-test the decision from roles such as CEO, CFO, engineer, lawyer, investor, customer, and risk analyst."
      }
    ]
  },
  {
    id: "calibration",
    title: "Tracking accuracy",
    summary: "Calibration turns old predictions into feedback about judgment quality.",
    steps: [
      {
        title: "Save only checkable predictions",
        body: "A useful prediction has a clear statement, probability, and due date. Avoid saving vague claims that cannot be marked true or false."
      },
      {
        title: "Resolve predictions honestly",
        body: "When the due date arrives, mark the prediction outcome true or false based on observable evidence."
      },
      {
        title: "Use Brier Score as feedback",
        body: "Lower Brier Scores are better. A high score means probabilities were overconfident, underconfident, or poorly matched to reality."
      }
    ]
  }
];

export const glossaryTerms: GlossaryTerm[] = [
  {
    term: "Assumption",
    definition: "A belief the analysis depends on. If an assumption fails, the recommendation may change."
  },
  {
    term: "Bayesian reasoning",
    definition: "A method for updating an initial probability when new evidence changes the odds."
  },
  {
    term: "Black swan",
    definition: "A low-probability, high-impact scenario that can dominate the downside or upside."
  },
  {
    term: "Brier Score",
    definition: "A forecast accuracy score for probability predictions. Zero is perfect; lower is better."
  },
  {
    term: "Calibration",
    definition: "How closely stated probabilities match real outcomes over time."
  },
  {
    term: "Confidence score",
    definition: "Oracle's estimate of how reliable the recommendation is based on evidence, uncertainty, and consistency."
  },
  {
    term: "Constraint",
    definition: "A hard limit that the decision should respect, such as time, money, risk, policy, or capacity."
  },
  {
    term: "Evidence strength",
    definition: "A judgment about how credible and useful the available evidence is for this decision."
  },
  {
    term: "Expected value",
    definition: "The average simulated payoff across possible outcomes. It can hide severe downside risk, so read it with p10 and p90."
  },
  {
    term: "Likelihood ratio",
    definition: "How much evidence increases or decreases the odds of the hypothesis being true."
  },
  {
    term: "Monte Carlo simulation",
    definition: "A repeated random simulation that estimates outcome ranges under uncertainty."
  },
  {
    term: "p10, p50, p90",
    definition: "Simulation percentiles. p10 is a downside estimate, p50 is the median case, and p90 is an upside estimate."
  },
  {
    term: "Posterior probability",
    definition: "The updated probability after the evidence has been applied."
  },
  {
    term: "Prior probability",
    definition: "The starting probability before evidence updates the estimate."
  },
  {
    term: "Risk mitigation",
    definition: "A concrete action that reduces a risk's probability, impact, or both."
  },
  {
    term: "Success probability",
    definition: "The share of simulated outcomes that meet or exceed the stated success metric."
  }
];
