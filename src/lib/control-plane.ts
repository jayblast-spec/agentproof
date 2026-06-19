import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function safeEqual(left: string, right: string) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

export function authorizePairingKey(supplied: string) {
  const expected = process.env.AGENTPROOF_PAIRING_KEY;
  return Boolean(expected && supplied.length >= 16 && safeEqual(supplied, expected));
}

function sessionSecret() {
  return required("AGENTPROOF_SESSION_SECRET");
}

function sessionSignature(expiresAt: string) {
  return createHmac("sha256", sessionSecret()).update(`owner.${expiresAt}`).digest("base64url");
}

export function createOwnerSession() {
  const expiresAt = String(Date.now() + 8 * 60 * 60 * 1000);
  return `${expiresAt}.${sessionSignature(expiresAt)}`;
}

export function authorizeOwnerRequest(request: NextRequest | Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const value = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("agentproof_owner="))
    ?.slice("agentproof_owner=".length);
  if (!value) return false;
  const [expiresAt, signature] = value.split(".");
  if (!expiresAt || !signature || Number(expiresAt) <= Date.now()) return false;
  return safeEqual(signature, sessionSignature(expiresAt));
}

export function authorizeOwnerMutation(request: NextRequest | Request) {
  if (!authorizeOwnerRequest(request)) return false;
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function controlPlaneRequest(body: Record<string, unknown>) {
  const response = await fetch(required("AGENTPROOF_CONTROL_PLANE_URL"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-agentproof-admin-key": required("AGENTPROOF_CONTROL_PLANE_ADMIN_KEY"),
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  const payload = await response.json().catch(() => ({ error: "Invalid control-plane response" }));
  return { response, payload };
}
