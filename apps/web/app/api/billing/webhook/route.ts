import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured for this environment." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(secretKey);
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await persistSubscription(event.data.object as Stripe.Subscription);
  }

  return NextResponse.json({ received: true });
}

async function persistSubscription(subscription: Stripe.Subscription) {
  const clerkUserId = subscription.metadata?.clerkUserId;
  if (!clerkUserId) {
    return;
  }

  const status = subscription.status.toUpperCase() as
    | "INCOMPLETE"
    | "TRIALING"
    | "ACTIVE"
    | "PAST_DUE"
    | "CANCELED"
    | "UNPAID";
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const periodEnd = subscription.items.data[0]?.current_period_end
    ? new Date(subscription.items.data[0].current_period_end * 1000)
    : new Date();

  const db = prisma();
  const user = await db.user.upsert({
    where: { clerkId: clerkUserId },
    update: { stripeCustomerId: customerId },
    create: {
      clerkId: clerkUserId,
      email: `${clerkUserId}@oracle.local`,
      stripeCustomerId: customerId
    }
  });

  await db.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    update: {
      status,
      plan: "PRO",
      currentPeriodEnd: periodEnd
    },
    create: {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      status,
      plan: "PRO",
      currentPeriodEnd: periodEnd
    }
  });
}
