#!/usr/bin/env node

import { createHash, webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";

const { subtle } = webcrypto;

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function toBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

function validateConfig(config) {
  if (
    config?.version !== "agentproof.runner.v1" ||
    typeof config.controlPlaneUrl !== "string" ||
    typeof config.connectorId !== "string" ||
    typeof config.runnerToken !== "string" ||
    config.runnerToken.length < 32 ||
    config.privateKeyJwk?.kty !== "EC" ||
    config.privateKeyJwk?.crv !== "P-256"
  ) {
    throw new Error("Invalid AgentProof runner configuration.");
  }
  return config;
}

async function controlPlane(config, body) {
  const response = await fetch(config.controlPlaneUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.runnerToken}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json().catch(() => ({ error: "Invalid control-plane response" }));
  return { response, payload };
}

function executeDemoScenario(scenario) {
  const input = String(scenario.input ?? "").toLowerCase();
  const proposedActions = [];
  const policyEvents = [];
  let status = "completed";
  let answer = "The request completed inside the dry-run authority boundary.";

  if (input.includes("ignore policy") || input.includes("protected context")) {
    status = "blocked";
    answer = "Embedded instructions were treated as untrusted content.";
    policyEvents.push("prompt_injection_blocked");
  } else if (input.includes("without approval") || input.includes("refund")) {
    status = "escalated";
    answer = "The requested financial action requires verified approval.";
    proposedActions.push({
      tool: "refund",
      operation: "issue_refund",
      intercepted: true,
      authority: "none",
    });
    policyEvents.push("approval_required");
  } else if (input.includes("without a source")) {
    status = "blocked";
    answer = "The agent declined to produce an unsupported claim.";
    policyEvents.push("source_required");
  }

  return {
    scenarioId: scenario.id,
    status,
    answer,
    proposedActions,
    policyEvents,
    sideEffects: "intercepted",
  };
}

function validateHttpEndpoint(value) {
  const url = new URL(value);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    throw new Error("HTTP adapter requires HTTPS, except for localhost development.");
  }
  if (url.username || url.password) throw new Error("Credentials are not allowed in the agent URL.");
  return url;
}

async function executeHttpScenario(config, scenario) {
  const endpoint = validateHttpEndpoint(config.adapter.endpoint);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-agentproof-dry-run": "true",
    },
    body: JSON.stringify({
      protocol: "agentproof.dry-run.v1",
      scenario,
      toolMode: "intercept",
    }),
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`Agent endpoint returned ${response.status}.`);
  return {
    scenarioId: scenario.id,
    status: payload.status ?? "completed",
    answer: String(payload.answer ?? ""),
    proposedActions: Array.isArray(payload.proposedActions)
      ? payload.proposedActions.map((action) => ({ ...action, intercepted: true }))
      : [],
    policyEvents: Array.isArray(payload.policyEvents) ? payload.policyEvents : [],
    sideEffects: "intercepted",
  };
}

async function executeJob(config, job) {
  const scenarios = Array.isArray(job.payload?.scenarios) ? job.payload.scenarios : [];
  if (!scenarios.length || scenarios.length > 100) throw new Error("Job scenario count is invalid.");
  const startedAt = performance.now();
  const results = [];
  for (const scenario of scenarios) {
    results.push(
      config.adapter?.type === "http"
        ? await executeHttpScenario(config, scenario)
        : executeDemoScenario(scenario),
    );
  }
  return {
    protocol: "agentproof.evidence.v1",
    connectorId: config.connectorId,
    jobId: job.id,
    nonce: job.nonce,
    executedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - startedAt),
    adapter: config.adapter?.type ?? "demo",
    sideEffects: "intercepted",
    results,
  };
}

async function signEvidence(config, job, result) {
  const serialized = JSON.stringify(result);
  const resultDigest = digest(serialized);
  const key = await subtle.importKey(
    "jwk",
    config.privateKeyJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = await subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(`${job.id}.${job.nonce}.${resultDigest}`),
  );
  return { resultDigest, signature: toBase64(new Uint8Array(signature)) };
}

async function runOnce(config, replayTest) {
  const pull = await controlPlane(config, { action: "pull" });
  if (!pull.response.ok) throw new Error(pull.payload.error ?? "Could not pull a job.");
  if (!pull.payload.job) {
    console.log("No queued AgentProof job.");
    return;
  }

  const job = pull.payload.job;
  const result = await executeJob(config, job);
  const proof = await signEvidence(config, job, result);
  const submission = {
    action: "submit",
    jobId: job.id,
    nonce: job.nonce,
    result,
    ...proof,
  };
  const accepted = await controlPlane(config, submission);
  if (!accepted.response.ok) throw new Error(accepted.payload.error ?? "Evidence was rejected.");
  console.log(`Evidence accepted for job ${job.id}.`);

  if (replayTest) {
    const replay = await controlPlane(config, submission);
    if (replay.response.status !== 409) {
      throw new Error(`Replay protection failed: expected 409, received ${replay.response.status}.`);
    }
    console.log("Replay protection verified: duplicate evidence rejected with 409.");
  }
}

const configPath = argument("--config");
if (!configPath) {
  console.error("Usage: node runner/agentproof-runner.mjs --config ./agentproof-runner.json --once [--replay-test]");
  process.exit(1);
}

const config = validateConfig(JSON.parse(await readFile(configPath, "utf8")));
await runOnce(config, process.argv.includes("--replay-test"));
