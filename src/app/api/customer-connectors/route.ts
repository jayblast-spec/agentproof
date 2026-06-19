import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeOwnerMutation, authorizeOwnerRequest, controlPlaneRequest } from "@/lib/control-plane";

const updateSchema = z.object({
  connectorId: z.uuid(),
  status: z.enum(["active", "paused", "revoked"]),
}).strict();

export async function GET(request: Request) {
  if (!authorizeOwnerMutation(request)) {
    return NextResponse.json({ error: "Owner authentication required." }, { status: 401 });
  }
  const { response, payload } = await controlPlaneRequest({ action: "list_connectors" })
    .catch(() => ({ response: null, payload: { error: "Control plane unavailable." } }));
  return NextResponse.json(payload, {
    status: response?.status ?? 502,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PATCH(request: Request) {
  if (!authorizeOwnerRequest(request)) {
    return NextResponse.json({ error: "Owner authentication required." }, { status: 401 });
  }
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid connector update." }, { status: 400 });
  const { response, payload } = await controlPlaneRequest({
    action: "update_connector",
    ...parsed.data,
  }).catch(() => ({ response: null, payload: { error: "Control plane unavailable." } }));
  return NextResponse.json(payload, {
    status: response?.status ?? 502,
    headers: { "Cache-Control": "no-store" },
  });
}
