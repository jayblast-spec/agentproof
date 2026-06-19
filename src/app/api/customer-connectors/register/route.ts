import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizePairingKey, controlPlaneRequest } from "@/lib/control-plane";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  runnerTokenHash: z.string().regex(/^[a-f0-9]{64}$/),
  publicKeyJwk: z.object({
    kty: z.literal("EC"),
    crv: z.literal("P-256"),
    x: z.string().min(20),
    y: z.string().min(20),
    ext: z.boolean().optional(),
    key_ops: z.array(z.string()).optional(),
  }).passthrough(),
}).strict();

export async function POST(request: Request) {
  if (!authorizePairingKey(request.headers.get("x-agentproof-pairing-key") ?? "")) {
    return NextResponse.json({ error: "Invalid pairing key." }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid runner registration." }, { status: 400 });
  }
  const { response, payload } = await controlPlaneRequest({
    action: "register",
    ...parsed.data,
  }).catch(() => ({ response: null, payload: { error: "Control plane unavailable." } }));
  return NextResponse.json(payload, {
    status: response?.status ?? 502,
    headers: { "Cache-Control": "no-store" },
  });
}
