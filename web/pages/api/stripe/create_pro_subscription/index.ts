// /api/start-subscription.js

import Stripe from "stripe";
import { dbExecute } from "../../../../lib/api/db/dbExecute";
import { logger } from "@/lib/telemetry/logger";
import { resultMap } from "@/packages/common/result";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../lib/api/handlerWrappers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

type CheckoutResponse = { sessionId: string } | { error: string };

async function handler({
  req,
  res,
  userData,
}: HandlerWrapperOptions<CheckoutResponse>) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const orgId = userData.orgId;
  const userEmail = userData.user.email;

  try {
    const { data: org, error: orgError } = resultMap(
      await dbExecute<{
        stripe_customer_id: string;
      }>("SELECT stripe_customer_id FROM organization WHERE id = $1", [orgId]),
      (d) => d?.[0],
    );

    if (orgError !== null) {
      logger.error(
        {
          orgError,
        },
        "Unable to find org",
      );
      res.status(400).json({ error: "Unable to find organization" });
      return;
    }

    let customerId = org?.stripe_customer_id;

    // If the organization isn't already associated with a Stripe customer, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
      });

      customerId = customer.id;

      const { error: updateError } = await dbExecute(
        "UPDATE organization SET stripe_customer_id = $1 WHERE id = $2",
        [customerId, orgId],
      );

      if (updateError !== null) {
        logger.error(
          {
            updateError,
          },
          "Unable to update org",
        );
        res.status(500).json({ error: "Unable to update organization" });
        return;
      }
    }
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    const origin = `${protocol}://${host}`;

    // Create a Checkout Session instead of creating a subscription directly
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard`, // Replace with your success URL
      cancel_url: `${origin}/dashboard`, // Replace with your cancel/failure URL
      metadata: {
        orgId: orgId, // Assuming `orgId` is the variable containing the organization's ID
        tier: "pro",
      },
      allow_promotion_codes: true,
    });

    // Respond with the session ID
    res.status(200).json({ sessionId: session.id });
  } catch (e) {
    logger.error({ error: e }, "Failed to create checkout session");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
}

export default withAuth(handler);
