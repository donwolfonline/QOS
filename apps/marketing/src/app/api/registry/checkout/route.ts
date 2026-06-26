import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { generateLicensePayload, signLicense } from '@/lib/license';

// Initialize Stripe (uses a default or provided secret key)
// Notice we use the latest apiVersion, but cast it to any to avoid typescript mismatch with older stripe SDKs if applicable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2025-01-27.acacia' as any,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, nodeId, moduleHash } = body;

    if (!sessionId || !nodeId || !moduleHash) {
      return NextResponse.json(
        { error: 'Missing required parameters: sessionId, nodeId, or moduleHash.' },
        { status: 400 }
      );
    }

    // Verify the session with Stripe if a real secret key is configured
    // For local testing without Stripe, you can pass sessionId = "local_simulated_session"
    if (process.env.STRIPE_SECRET_KEY && sessionId !== 'local_simulated_session') {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid') {
        return NextResponse.json({ error: 'Payment has not been completed.' }, { status: 400 });
      }
    }

    // Generate Payload
    const expiresAt = null; // Perpetual license
    const payload = generateLicensePayload(nodeId, moduleHash, expiresAt);

    // Get Private Key from environment variables
    const privateKeyRaw = process.env.QOS_MASTER_PRIVATE_KEY;
    if (!privateKeyRaw) {
      console.error("Missing QOS_MASTER_PRIVATE_KEY environment variable.");
      return NextResponse.json({ error: 'Server configuration error: Missing master private key.' }, { status: 500 });
    }

    // Handle multiline secrets in vercel
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    // Sign the payload (Assumes Ed25519 PEM formatted key)
    let base64License;
    try {
      base64License = signLicense(payload, privateKey);
    } catch (signError) {
      console.error("Error signing license. Ensure QOS_MASTER_PRIVATE_KEY is a valid Ed25519 PEM:", signError);
      return NextResponse.json({ error: 'Failed to generate cryptographic signature.' }, { status: 500 });
    }

    // Generate secure CLI command
    const cliCommand = `qos license add ${base64License}`;

    return NextResponse.json({
      success: true,
      cliCommand,
      message: "License generated successfully. Run the command to inject it into your local node.",
    });
  } catch (error: any) {
    console.error("Checkout processing error:", error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during checkout processing.' },
      { status: 500 }
    );
  }
}
