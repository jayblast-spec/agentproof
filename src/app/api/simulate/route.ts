import { NextResponse } from "next/server";
import { z } from "zod";
import { runSimulation } from "@/lib/simulation";

const simulationSchema = z.object({
  agentName: z.string().trim().min(2).max(80),
  endpoint: z.string().trim().min(3).max(300),
  purpose: z.string().trim().min(20).max(800),
  industry: z.string().trim().min(2).max(100),
  model: z.string().trim().min(2).max(100),
  promptVersion: z.string().trim().min(1).max(40),
  autonomy: z.enum(["observe", "recommend", "approval", "bounded"]),
  scenarioIds: z.array(z.string()).min(1).max(8),
  runsPerScenario: z.number().int().min(10).max(1250),
  monthlyVolume: z.number().int().min(1).max(10_000_000),
  maxActionSpend: z.number().min(0).max(10_000_000),
  tools: z.array(z.object({
    id: z.string(),
    name: z.string().min(1),
    permission: z.enum(["read", "write", "financial", "destructive"]),
    approvalRequired: z.boolean(),
    spendLimit: z.number().optional(),
  })).max(20),
  policies: z.array(z.object({
    id: z.string(),
    name: z.string().min(1),
    rule: z.string().min(3),
    enforcement: z.enum(["block", "approve", "log"]),
  })).max(30),
  syntheticProfiles: z.array(z.object({
    id: z.string(),
    name: z.string().min(1),
    behavior: z.enum(["cooperative", "ambiguous", "hostile", "impatient"]),
    objective: z.string().min(3),
  })).min(1).max(20),
  privateContext: z.string().max(50_000),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = simulationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid simulation configuration", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  return NextResponse.json(runSimulation(parsed.data));
}
