import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizePairingKey, controlPlaneRequest } from "@/lib/control-plane";

const createSchema = z.object({
  connectorId: z.uuid(),
  payload: z.record(z.string(), z.unknown()),
  expiresInSeconds: z.number().int().min(60).max(3600).default(900),
}).strict();

const statusSchema = z.object({ jobId: z.uuid() }).strict();

export async function POST(request: Request) {
  if (!authorizePairingKey(request.headers.get("x-agentproof-pairing-key") ?? "")) {
    return NextResponse.json({ error: "Invalid pairing key." }, { status: 401 });
  }
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid job request." }, { status: 400 });
  const { response, payload } = await controlPlaneRequest({
    action: "create_job",
    ...parsed.data,
  }).catch(() => ({ response: null, payload: { error: "Control plane unavailable." } }));
  return NextResponse.json(payload, {
    status: response?.status ?? 502,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  if (!authorizePairingKey(request.headers.get("x-agentproof-pairing-key") ?? "")) {
    return NextResponse.json({ error: "Invalid pairing key." }, { status: 401 });
  }
  const parsed = statusSchema.safeParse({
    jobId: new URL(request.url).searchParams.get("jobId"),
  });
  if (!parsed.success) return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
  const { response, payload } = await controlPlaneRequest({
    action: "job_status",
    ...parsed.data,
  }).catch(() => ({ response: null, payload: { error: "Control plane unavailable." } }));
  return NextResponse.json(payload, {
    status: response?.status ?? 502,
    headers: { "Cache-Control": "no-store" },
  });
}
