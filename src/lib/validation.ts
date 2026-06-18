import { z } from "zod";

const toolSchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(120),
  permission: z.enum(["read", "write", "financial", "destructive"]),
  approvalRequired: z.boolean(),
  spendLimit: z.number().min(0).max(10_000_000).optional(),
}).strict();

const policySchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(120),
  rule: z.string().trim().min(3).max(1000),
  enforcement: z.enum(["block", "approve", "log"]),
}).strict();

const profileSchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(120),
  behavior: z.enum(["cooperative", "ambiguous", "hostile", "impatient"]),
  objective: z.string().trim().min(3).max(500),
}).strict();

export const simulationSchema = z.object({
  agentName: z.string().trim().min(2).max(80),
  endpoint: z.string().trim().min(3).max(300),
  purpose: z.string().trim().min(20).max(800),
  industry: z.string().trim().min(2).max(100),
  model: z.string().trim().min(2).max(100),
  promptVersion: z.string().trim().min(1).max(40),
  autonomy: z.enum(["observe", "recommend", "approval", "bounded"]),
  scenarioIds: z.array(z.string().trim().min(1).max(80)).min(1).max(8),
  runsPerScenario: z.number().int().min(10).max(1250),
  monthlyVolume: z.number().int().min(1).max(10_000_000),
  maxActionSpend: z.number().min(0).max(10_000_000),
  tools: z.array(toolSchema).max(20),
  policies: z.array(policySchema).max(30),
  syntheticProfiles: z.array(profileSchema).min(1).max(20),
  privateContext: z.string().max(50_000),
}).strict();

export const connectorEnvelopeSchema = z.object({
  version: z.literal("agentproof.connector.v1"),
  runId: z.string().uuid().or(z.string().startsWith("live_")),
  issuedAt: z.iso.datetime(),
  nonce: z.string().uuid(),
  agent: z.object({
    agentName: z.string().min(2).max(80),
    purpose: z.string().min(20).max(800),
    industry: z.string().min(2).max(100),
    model: z.string().min(2).max(100),
    promptVersion: z.string().min(1).max(40),
    autonomy: z.enum(["observe", "recommend", "approval", "bounded"]),
    maxActionSpend: z.number().min(0).max(10_000_000),
  }).strict(),
  tools: z.array(toolSchema).max(20),
  policies: z.array(policySchema).max(30),
  privateContext: z.string().max(50_000),
  scenarios: z.array(z.object({
    trialId: z.string().min(3).max(120),
    scenarioId: z.string().min(1).max(80),
    title: z.string().min(1).max(160),
    description: z.string().min(3).max(1000),
    attack: z.string().min(3).max(500),
    profile: profileSchema,
  }).strict()).length(100),
}).strict();
