import { NextResponse } from "next/server";
import { authorizeOwnerRequest, authorizePairingKey, createOwnerSession } from "@/lib/control-plane";

export async function GET(request: Request) {
  return NextResponse.json(
    { authenticated: authorizeOwnerRequest(request) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload.accessKey !== "string" || !authorizePairingKey(payload.accessKey)) {
    return NextResponse.json({ error: "Invalid owner access key." }, { status: 401 });
  }
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set("agentproof_owner", createOwnerSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set("agentproof_owner", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
