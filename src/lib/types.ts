export type Severity = "critical" | "high" | "medium" | "low";
export type ScenarioCategory = "security" | "reliability" | "policy" | "cost";

export type Scenario = {
  id: string;
  title: string;
  category: ScenarioCategory;
  severity: Severity;
  description: string;
  attack: string;
};

export type ToolDefinition = {
  id: string;
  name: string;
  permission: "read" | "write" | "financial" | "destructive";
  approvalRequired: boolean;
  spendLimit?: number;
};

export type PolicyDefinition = {
  id: string;
  name: string;
  rule: string;
  enforcement: "block" | "approve" | "log";
};

export type SyntheticProfile = {
  id: string;
  name: string;
  behavior: "cooperative" | "ambiguous" | "hostile" | "impatient";
  objective: string;
};

export type SimulationInput = {
  agentName: string;
  endpoint: string;
  purpose: string;
  industry: string;
  model: string;
  promptVersion: string;
  autonomy: "observe" | "recommend" | "approval" | "bounded";
  scenarioIds: string[];
  runsPerScenario: number;
  monthlyVolume: number;
  maxActionSpend: number;
  tools: ToolDefinition[];
  policies: PolicyDefinition[];
  syntheticProfiles: SyntheticProfile[];
  privateContext: string;
};

export type ExecutionMode = "synthetic" | "live_demo";

export type Finding = {
  id: string;
  scenarioId: string;
  title: string;
  severity: Severity;
  status: "failed" | "passed" | "warning";
  evidence: string;
  recommendation: string;
};

export type TraceStep = {
  at: number;
  actor: string;
  action: string;
  detail: string;
  status: "ok" | "blocked" | "warning";
};

export type TrialOutcome = {
  trialId: string;
  scenarioId: string;
  profileId: string;
  passed: boolean;
  unsafeAction: boolean;
  escalated: boolean;
  hallucinated: boolean;
  policyBlocked: boolean;
  toolCalls: number;
  cost: number;
  latencyMs: number;
};

export type SimulationResult = {
  id: string;
  createdAt: string;
  evidence: {
    mode: "synthetic" | "connector_verified" | "live_execution";
    endpointCalled: boolean;
    statement: string;
    inputs: string[];
    connector?: string;
    signatureVerified?: boolean;
    toolSideEffects?: "intercepted" | "enabled";
  };
  input: SimulationInput;
  score: number;
  readiness: "ready" | "conditional" | "failed";
  totalRuns: number;
  passRate: number;
  unsafeActions: number;
  estimatedMonthlyCost: number;
  p95LatencyMs: number;
  findings: Finding[];
  traces: TraceStep[];
  outcomes: TrialOutcome[];
  categoryScores: Record<ScenarioCategory, number>;
  calibration: {
    expectedPassRate: number;
    observedPassRate: number;
    calibrationError: number;
    sampleSize: number;
  };
};
