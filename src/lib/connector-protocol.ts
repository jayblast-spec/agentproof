import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { PolicyDefinition, SimulationInput, SyntheticProfile, ToolDefinition } from "./types";

function connectorSecret() {
  const secret = process.env.AGENTPROOF_DEMO_CONNECTOR_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AGENTPROOF_DEMO_CONNECTOR_SECRET must contain at least 32 characters.");
  }
  return secret;
}

export type ConnectorScenario = {
  trialId: string;
  scenarioId: string;
  title: string;
  description: string;
  attack: string;
  profile: SyntheticProfile;
};

export type ConnectorEnvelope = {
  version: "agentproof.connector.v1";
  runId: string;
  issuedAt: string;
  nonce: string;
  agent: Pick<
    SimulationInput,
    "agentName" | "purpose" | "industry" | "model" | "promptVersion" | "autonomy" | "maxActionSpend"
  >;
  tools: ToolDefinition[];
  policies: PolicyDefinition[];
  privateContext: string;
  scenarios: ConnectorScenario[];
};

export type InterceptedAction = {
  toolId: string;
  operation: string;
  reason: string;
  amount?: number;
  approvalRequired: boolean;
  intercepted: true;
};

export type ConnectorTrialResult = {
  trialId: string;
  scenarioId: string;
  status: "completed" | "blocked" | "escalated" | "failed";
  answer: string;
  proposedActions: InterceptedAction[];
  policyEvents: string[];
  citations: string[];
  hallucinated: boolean;
  unsafeProposal: boolean;
  modelCalls: number;
  latencyMs: number;
  costUsd: number;
};

export type ConnectorResponse = {
  version: "agentproof.connector.v1";
  runId: string;
  connector: "AgentProof controlled demo agent";
  signatureVerified: true;
  sideEffects: "intercepted";
  results: ConnectorTrialResult[];
};

function serialize(payload: ConnectorEnvelope) {
  return JSON.stringify(payload);
}

export function createConnectorEnvelope(
  input: SimulationInput,
  scenarios: ConnectorScenario[],
): ConnectorEnvelope {
  return {
    version: "agentproof.connector.v1",
    runId: `live_${randomUUID()}`,
    issuedAt: new Date().toISOString(),
    nonce: randomUUID(),
    agent: {
      agentName: input.agentName,
      purpose: input.purpose,
      industry: input.industry,
      model: input.model,
      promptVersion: input.promptVersion,
      autonomy: input.autonomy,
      maxActionSpend: input.maxActionSpend,
    },
    tools: input.tools,
    policies: input.policies,
    privateContext: input.privateContext,
    scenarios,
  };
}

export function signConnectorEnvelope(payload: ConnectorEnvelope) {
  return createHmac("sha256", connectorSecret()).update(serialize(payload)).digest("hex");
}

export function verifyConnectorEnvelope(payload: ConnectorEnvelope, signature: string) {
  const expected = Buffer.from(signConnectorEnvelope(payload), "hex");
  const supplied = Buffer.from(signature, "hex");
  if (expected.length !== supplied.length) return false;
  return timingSafeEqual(expected, supplied);
}
