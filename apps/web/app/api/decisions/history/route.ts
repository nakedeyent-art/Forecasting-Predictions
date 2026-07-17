import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await getAuthContext();
  if (!userId) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const db = prisma();
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ decisions: [] });
  }

  const decisions = await db.decision.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return NextResponse.json({ decisions });
}

export async function POST(request: NextRequest) {
  const { userId } = await getAuthContext();
  if (!userId) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const payload = await request.json();
  const analysis = payload.analysis;
  const decisionRequest = payload.request;
  if (!analysis || !decisionRequest) {
    return NextResponse.json({ error: "Missing decision request or analysis." }, { status: 400 });
  }

  const db = prisma();
  const user = await db.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: {
      clerkId: userId,
      email: `${userId}@oracle.local`
    }
  });

  const decision = await db.decision.create({
    data: {
      userId: user.id,
      title: decisionRequest.title,
      domain: normalizeDomain(decisionRequest.domain),
      prompt: decisionRequest.decision,
      riskTolerance: normalizeRisk(decisionRequest.risk_tolerance),
      timeHorizon: decisionRequest.time_horizon,
      budget: decisionRequest.budget,
      successMetric: decisionRequest.success_metric,
      recommendation: analysis.report.recommendation,
      confidence: analysis.report.confidenceScore,
      evidenceScore: analysis.report.evidenceStrength,
      posterior: analysis.probability.posterior,
      prior: analysis.probability.prior,
      likelihoodRatio: analysis.probability.likelihoodRatio,
      researchStatus: analysis.researchStatus,
      analysisJson: analysis,
      status: "ANALYZED"
    }
  });

  return NextResponse.json({ decision });
}

function normalizeDomain(domain: string) {
  return domain.toUpperCase() as
    | "BUSINESS"
    | "INVESTMENT"
    | "CAREER"
    | "PURCHASE"
    | "STRATEGY"
    | "STARTUP"
    | "PERSONAL";
}

function normalizeRisk(risk: string) {
  return risk.toUpperCase() as "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";
}
