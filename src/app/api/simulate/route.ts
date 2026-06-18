import { NextResponse } from "next/server";
import { runSimulation } from "@/lib/simulation";
import { simulationSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = simulationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid simulation configuration", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  return NextResponse.json(runSimulation(parsed.data));
}
