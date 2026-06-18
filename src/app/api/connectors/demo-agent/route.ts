import { NextResponse } from "next/server";
import type { ConnectorEnvelope } from "@/lib/connector-protocol";
import { verifyConnectorEnvelope } from "@/lib/connector-protocol";
import { executeDemoAgent } from "@/lib/demo-agent";
import { connectorEnvelopeSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("x-agentproof-signature") ?? "";
  const payload = await request.json().catch(() => null);
  const parsed = connectorEnvelopeSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid connector envelope" }, { status: 400 });
  }

  const issuedAt = Date.parse(parsed.data.issuedAt);
  if (!Number.isFinite(issuedAt) || Math.abs(Date.now() - issuedAt) > 60_000) {
    return NextResponse.json({ error: "Expired connector envelope" }, { status: 401 });
  }

  let verified = false;
  try {
    verified = verifyConnectorEnvelope(parsed.data as ConnectorEnvelope, signature);
  } catch {
    return NextResponse.json({ error: "Connector signing is not configured." }, { status: 503 });
  }
  if (!verified) {
    return NextResponse.json({ error: "Invalid connector signature" }, { status: 401 });
  }

  return NextResponse.json(executeDemoAgent(parsed.data as ConnectorEnvelope), {
    headers: { "Cache-Control": "no-store" },
  });
}
