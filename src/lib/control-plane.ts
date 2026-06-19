import { timingSafeEqual } from "node:crypto";

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
