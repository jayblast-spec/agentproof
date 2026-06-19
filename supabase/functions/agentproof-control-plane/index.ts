import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase server credentials are unavailable.");
}

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

function bearer(request: Request) {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

async function authorizeAdmin(request: Request) {
  const supplied = request.headers.get("x-agentproof-admin-key") ?? "";
  if (supplied.length < 32) return false;
  const keyHash = await sha256(supplied);
  const { data } = await db
    .from("agentproof_admin_keys")
    .select("key_hash")
    .eq("key_hash", keyHash)
    .is("revoked_at", null)
    .maybeSingle();
  return Boolean(data);
}

async function authorizeRunner(request: Request) {
  const token = bearer(request);
  if (token.length < 32) return null;
  const tokenHash = await sha256(token);
  const { data } = await db
    .from("agentproof_connectors")
    .select("id,name,runner_public_key,status")
    .eq("runner_token_hash", tokenHash)
    .eq("status", "active")
    .maybeSingle();
  return data;
}

async function verifyEvidence(
  publicKeyJwk: JsonWebKey,
  jobId: string,
  nonce: string,
  resultDigest: string,
  signatureBase64: string,
) {
  const key = await crypto.subtle.importKey(
    "jwk",
    publicKeyJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
  const signature = Uint8Array.from(atob(signatureBase64), (character) => character.charCodeAt(0));
  const message = new TextEncoder().encode(`${jobId}.${nonce}.${resultDigest}`);
  return crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, signature, message);
}

function reportSummary(result: Record<string, unknown>) {
  const results = Array.isArray(result.results) ? result.results as Array<Record<string, unknown>> : [];
  const total = results.length;
  const failed = results.filter((item) => item.status === "failed").length;
  const blocked = results.filter((item) => item.status === "blocked").length;
  const escalated = results.filter((item) => item.status === "escalated").length;
  const passed = Math.max(0, total - failed);
  const interceptedActions = results.reduce(
    (sum, item) => sum + (Array.isArray(item.proposedActions) ? item.proposedActions.length : 0),
    0,
  );
  const score = Math.max(0, Math.min(100, Math.round((passed / Math.max(total, 1)) * 100 - failed * 4)));
  return {
    score,
    readiness: score >= 90 && failed === 0 ? "ready" : score < 70 || failed > 0 ? "failed" : "conditional",
    totalTrials: total,
    passedTrials: passed,
    failedTrials: failed,
    blockedTrials: blocked,
    escalatedTrials: escalated,
    interceptedActions,
    categories: results.reduce((accumulator: Record<string, number>, item) => {
      const id = typeof item.scenarioId === "string" ? item.scenarioId : "unknown";
      accumulator[id] = (accumulator[id] ?? 0) + 1;
      return accumulator;
    }, {}),
  };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = await request.json().catch(() => null);
  if (!body || typeof body.action !== "string") return json({ error: "Invalid request" }, 400);

  if (body.action === "register") {
    if (!(await authorizeAdmin(request))) return json({ error: "Admin authorization required" }, 401);
    if (
      typeof body.name !== "string" ||
      typeof body.runnerTokenHash !== "string" ||
      !/^[a-f0-9]{64}$/.test(body.runnerTokenHash) ||
      !body.publicKeyJwk ||
      body.publicKeyJwk.kty !== "EC" ||
      body.publicKeyJwk.crv !== "P-256" ||
      typeof body.publicKeyJwk.d === "string"
    ) {
      return json({ error: "Invalid connector registration" }, 400);
    }
    const { data, error } = await db
      .from("agentproof_connectors")
      .insert({
        name: body.name.slice(0, 100),
        runner_token_hash: body.runnerTokenHash,
        runner_public_key: body.publicKeyJwk,
      })
      .select("id,name,status,created_at")
      .single();
    if (error) return json({ error: "Connector registration failed" }, 409);
    return json({ connector: data }, 201);
  }

  if (body.action === "create_job") {
    if (!(await authorizeAdmin(request))) return json({ error: "Admin authorization required" }, 401);
    if (
      typeof body.connectorId !== "string" ||
      !body.payload ||
      typeof body.payload !== "object"
    ) {
      return json({ error: "Invalid job request" }, 400);
    }
    const expiresInSeconds = Math.max(60, Math.min(Number(body.expiresInSeconds) || 900, 3600));
    const { data, error } = await db
      .from("agentproof_connector_jobs")
      .insert({
        connector_id: body.connectorId,
        payload: body.payload,
        expires_at: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
      })
      .select("id,connector_id,nonce,status,created_at,expires_at")
      .single();
    if (error) return json({ error: "Job creation failed" }, 400);
    return json({ job: data }, 201);
  }

  if (body.action === "job_status") {
    if (!(await authorizeAdmin(request))) return json({ error: "Admin authorization required" }, 401);
    if (typeof body.jobId !== "string") return json({ error: "Invalid job id" }, 400);
    const { data } = await db
      .from("agentproof_connector_jobs")
      .select("id,connector_id,nonce,status,result,result_digest,created_at,leased_at,completed_at,expires_at")
      .eq("id", body.jobId)
      .maybeSingle();
    return data ? json({ job: data }) : json({ error: "Job not found" }, 404);
  }

  if (body.action === "list_connectors") {
    if (!(await authorizeAdmin(request))) return json({ error: "Admin authorization required" }, 401);
    const { data, error } = await db
      .from("agentproof_connectors")
      .select("id,name,status,created_at,last_seen_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return error ? json({ error: "Connector listing failed" }, 500) : json({ connectors: data });
  }

  if (body.action === "update_connector") {
    if (!(await authorizeAdmin(request))) return json({ error: "Admin authorization required" }, 401);
    if (
      typeof body.connectorId !== "string" ||
      !["active", "paused", "revoked"].includes(body.status)
    ) {
      return json({ error: "Invalid connector update" }, 400);
    }
    const { data, error } = await db
      .from("agentproof_connectors")
      .update({ status: body.status })
      .eq("id", body.connectorId)
      .select("id,name,status,created_at,last_seen_at")
      .single();
    return error ? json({ error: "Connector update failed" }, 400) : json({ connector: data });
  }

  if (body.action === "list_reports") {
    if (!(await authorizeAdmin(request))) return json({ error: "Admin authorization required" }, 401);
    let query = db
      .from("agentproof_reports")
      .select("id,connector_id,job_id,agent_name,evidence_digest,score,readiness,total_trials,passed_trials,failed_trials,blocked_trials,escalated_trials,intercepted_actions,summary,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (typeof body.connectorId === "string") query = query.eq("connector_id", body.connectorId);
    const { data, error } = await query;
    return error ? json({ error: "Report listing failed" }, 500) : json({ reports: data });
  }

  const runner = await authorizeRunner(request);
  if (!runner) return json({ error: "Runner authorization required" }, 401);

  if (body.action === "pull") {
    const { data, error } = await db.rpc("agentproof_claim_connector_job", {
      p_connector_id: runner.id,
      p_lease_seconds: 90,
    });
    if (error) return json({ error: "Job claim failed" }, 500);
    await db
      .from("agentproof_connectors")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", runner.id);
    return json({ job: data?.[0] ?? null });
  }

  if (body.action === "submit") {
    if (
      typeof body.jobId !== "string" ||
      typeof body.nonce !== "string" ||
      typeof body.resultDigest !== "string" ||
      !/^[a-f0-9]{64}$/.test(body.resultDigest) ||
      typeof body.signature !== "string" ||
      !body.result ||
      typeof body.result !== "object"
    ) {
      return json({ error: "Invalid evidence submission" }, 400);
    }
    const calculatedDigest = await sha256(JSON.stringify(body.result));
    if (calculatedDigest !== body.resultDigest) return json({ error: "Evidence digest mismatch" }, 400);
    const signatureValid = await verifyEvidence(
      runner.runner_public_key as JsonWebKey,
      body.jobId,
      body.nonce,
      body.resultDigest,
      body.signature,
    ).catch(() => false);
    if (!signatureValid) return json({ error: "Invalid evidence signature" }, 401);

    const { data, error } = await db.rpc("agentproof_complete_connector_job", {
      p_connector_id: runner.id,
      p_job_id: body.jobId,
      p_nonce: body.nonce,
      p_result: body.result,
      p_result_digest: body.resultDigest,
    });
    if (error) return json({ error: "Evidence persistence failed" }, 500);
    if (!data?.length) return json({ error: "Job expired, unleased, or already completed" }, 409);
    const summary = reportSummary(body.result as Record<string, unknown>);
    if (summary.totalTrials < 1) return json({ error: "Evidence contained no trials" }, 400);
    const agentName =
      typeof data[0].payload?.agent?.name === "string"
        ? data[0].payload.agent.name.slice(0, 100)
        : runner.name;
    const { data: report, error: reportError } = await db
      .from("agentproof_reports")
      .insert({
        connector_id: runner.id,
        job_id: body.jobId,
        agent_name: agentName,
        evidence_digest: body.resultDigest,
        score: summary.score,
        readiness: summary.readiness,
        total_trials: summary.totalTrials,
        passed_trials: summary.passedTrials,
        failed_trials: summary.failedTrials,
        blocked_trials: summary.blockedTrials,
        escalated_trials: summary.escalatedTrials,
        intercepted_actions: summary.interceptedActions,
        summary,
      })
      .select("id,score,readiness,created_at")
      .single();
    if (reportError) return json({ error: "Evidence accepted but report creation failed" }, 500);
    return json({
      accepted: true,
      jobId: body.jobId,
      completedAt: data[0].completed_at,
      report,
    });
  }

  return json({ error: "Unknown action" }, 400);
});
