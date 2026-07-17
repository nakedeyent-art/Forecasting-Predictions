import { NextResponse } from "next/server";
import Stripe from "stripe";
import { authRequired, getAuthContext } from "@/lib/auth";

export async function POST() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRICE_PRO_MONTHLY;
  const { userId } = await getAuthContext();

  if (authRequired() && !userId) {
    return NextResponse.json({ error: "Authentication is required for checkout." }, { status: 401 });
  }

  if (!secretKey || !price) {
    return NextResponse.json(
      { error: "Stripe is not configured for this environment." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(secretKey);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      client_reference_id: userId ?? "anonymous",
      metadata: {
        clerkUserId: userId ?? ""
      },
      subscription_data: {
        metadata: {
          clerkUserId: userId ?? ""
        }
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}?checkout=cancelled`
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json(
      { error: "Stripe checkout could not be created. Check Stripe keys and price configuration." },
      { status: 502 }
    );
  }
}
