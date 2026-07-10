import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRICE_PRO_MONTHLY;

  if (!secretKey || !price) {
    return NextResponse.json(
      { error: "Stripe is not configured for this environment." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(secretKey);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}?checkout=cancelled`
  });

  return NextResponse.json({ url: session.url });
}
