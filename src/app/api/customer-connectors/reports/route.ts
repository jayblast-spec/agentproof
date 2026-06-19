import { NextResponse } from "next/server";
import { authorizeOwnerRequest, controlPlaneRequest } from "@/lib/control-plane";

export async function GET(request: Request) {
  if (!authorizeOwnerRequest(request)) {
    return NextResponse.json({ error: "Owner authentication required." }, { status: 401 });
  }
  const connectorId = new URL(request.url).searchParams.get("connectorId");
  const { response, payload } = await controlPlaneRequest({
    action: "list_reports",
    ...(connectorId ? { connectorId } : {}),
  }).catch(() => ({ response: null, payload: { error: "Control plane unavailable." } }));
  return NextResponse.json(payload, {
    status: response?.status ?? 502,
    headers: { "Cache-Control": "no-store" },
  });
}
