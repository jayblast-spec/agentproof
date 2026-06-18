import { NextResponse } from "next/server";
import {
  createConnectorEnvelope,
  signConnectorEnvelope,
  type ConnectorResponse,
  type ConnectorScenario,
} from "@/lib/connector-protocol";
import { buildLiveReport } from "@/lib/live-report";
import { scenarioMap } from "@/lib/scenarios";
import { simulationSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 30;

function isTrustedConnectorHost(url: URL) {
  return (
    url.hostname === "127.0.0.1" ||
    url.hostname === "localhost" ||
    url.hostname === "agentproof-ten.vercel.app" ||
    url.hostname.endsWith(".vercel.app")
  );
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = simulationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid live-test configuration", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.endpoint !== "internal://agentproof/demo-agent") {
    return NextResponse.json(
      { error: "Live Connector v1 permits only the controlled AgentProof demo agent." },
      { status: 403 },
    );
  }

  const selected = parsed.data.scenarioIds
    .map((id) => scenarioMap.get(id))
    .filter((scenario) => Boolean(scenario));
  if (selected.length !== parsed.data.scenarioIds.length) {
    return NextResponse.json({ error: "Unknown scenario requested." }, { status: 400 });
  }

  const connectorScenarios: ConnectorScenario[] = Array.from({ length: 100 }, (_, index) => {
    const scenario = selected[index % selected.length]!;
    const profile = parsed.data.syntheticProfiles[index % parsed.data.syntheticProfiles.length];
    return {
      trialId: `live_trial_${String(index + 1).padStart(3, "0")}`,
      scenarioId: scenario.id,
      title: scenario.title,
      description: scenario.description,
      attack: scenario.attack,
      profile,
    };
  });
  const target = new URL("/api/connectors/demo-agent", request.url);
  if (!isTrustedConnectorHost(target)) {
    return NextResponse.json({ error: "Untrusted connector host." }, { status: 403 });
  }
  const envelope = createConnectorEnvelope(parsed.data, connectorScenarios);
  let signature: string;
  try {
    signature = signConnectorEnvelope(envelope);
  } catch {
    return NextResponse.json({ error: "Connector signing is not configured." }, { status: 503 });
  }
  const startedAt = performance.now();
  const response = await fetch(target, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-agentproof-signature": signature,
    },
    body: JSON.stringify(envelope),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);

  if (!response?.ok) {
    return NextResponse.json(
      { error: "The controlled connector did not return verified evidence." },
      { status: 502 },
    );
  }

  const connectorResponse = (await response.json()) as ConnectorResponse;
  if (
    connectorResponse.runId !== envelope.runId ||
    connectorResponse.results.length !== 100 ||
    !connectorResponse.signatureVerified ||
    connectorResponse.sideEffects !== "intercepted"
  ) {
    return NextResponse.json({ error: "Connector evidence integrity check failed." }, { status: 502 });
  }

  return NextResponse.json(
    buildLiveReport(parsed.data, connectorResponse, Math.round(performance.now() - startedAt)),
    { headers: { "Cache-Control": "no-store" } },
  );
}
