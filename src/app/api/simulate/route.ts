import { NextResponse } from "next/server";
import { runSimulation } from "@/lib/simulation";
import { simulationSchema } from "@/lib/validation";
import { persistReport } from "@/lib/db";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = simulationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid simulation configuration", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const result = runSimulation(parsed.data);
  persistReport(result, "demo_execution").catch((err) =>
    console.error("agentproof_reports insert failed:", err instanceof Error ? err.message : err),
  );
  return NextResponse.json(result);
}
