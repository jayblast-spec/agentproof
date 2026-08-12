import { Pool } from "pg";
import { createHash } from "node:crypto";
import type { SimulationResult } from "./types";

let pool: Pool | null = null;

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

function canonicalStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${canonicalStringify((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function canonicalHash(report: unknown) {
  return createHash("sha256").update(canonicalStringify(report)).digest("hex");
}

export async function persistReport(report: SimulationResult, mode: "demo_execution" | "live_execution") {
  const db = getPool();
  if (!db) return { persisted: false as const, reason: "DATABASE_URL not configured" };
  const sha256 = canonicalHash(report);
  await db.query(
    `INSERT INTO agentproof_reports (id, mode, agent_name, score, readiness, report, sha256)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO NOTHING`,
    [report.id, mode, report.input.agentName, report.score, report.readiness, JSON.stringify(report), sha256],
  );
  return { persisted: true as const, sha256 };
}

export function hashReport(report: unknown) {
  return canonicalHash(report);
}

export async function getReportById(id: string) {
  const db = getPool();
  if (!db) return null;
  const res = await db.query(
    `SELECT id, created_at, mode, agent_name, score, readiness, report, sha256 FROM agentproof_reports WHERE id = $1`,
    [id],
  );
  return res.rows[0] ?? null;
}
