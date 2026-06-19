# AgentProof

AgentProof is an agent simulation and production-readiness platform. It executes controlled security, reliability, policy, and cost scenarios before an autonomous agent receives production authority.

## Product surfaces

- `/` - commercial product experience
- `/lab` - configurable test laboratory
- `/reports/sample` - readiness report and failure traces
- `/pricing` - commercial plans
- `/about` - product principles
- `/connectors` - protected customer-runner pairing
- `POST /api/simulate` - validated deterministic simulation API
- `POST /api/live-test` - 100 signed trials against the controlled connector
- `POST /api/connectors/demo-agent` - server-owned test agent with intercepted tools
- `POST /api/customer-connectors/register` - protected runner registration proxy
- `POST /api/customer-connectors/jobs` - protected test-job creation proxy

## Local development

```bash
npm install
$env:AGENTPROOF_DEMO_CONNECTOR_SECRET="replace-with-at-least-32-random-characters"
$env:AGENTPROOF_CONTROL_PLANE_URL="https://PROJECT.supabase.co/functions/v1/agentproof-control-plane"
$env:AGENTPROOF_CONTROL_PLANE_ADMIN_KEY="server-only-admin-key"
$env:AGENTPROOF_PAIRING_KEY="owner-pairing-key"
npm run dev
```

## Verification

```bash
npm run lint
npm run build
npm run test:e2e
npm run test:runner
```

## Evidence modes

- **Synthetic model** generates 10,000 reproducible outcomes from the declared agent configuration. It does not contact the configured endpoint.
- **Live connector** sends 100 signed scenarios to AgentProof's controlled demo agent, scores its returned responses, and intercepts every proposed tool action.

AgentProof's server does not fetch arbitrary customer URLs. Customer-controlled HTTP dry-run endpoints are reached only by the outbound reference runner inside the customer's environment.

## Customer runner

`/connectors` generates a P-256 signing key pair and runner token in the browser. AgentProof receives only the public key and token hash. The downloaded configuration is used by:

```bash
node runner/agentproof-runner.mjs \
  --config ./agentproof-runner.json \
  --once \
  --replay-test
```

The runner pulls jobs outbound from Supabase, executes a demo or HTTP dry-run adapter, signs `jobId.nonce.resultDigest`, and submits evidence. Supabase atomically leases jobs and rejects a completed nonce if it is submitted again.

## Manifest security

AgentProof does not accept agent ZIP files, source code, binaries, plugins, or executables. The browser importer accepts only a declarative `.json` manifest under 64 KB and validates every allowed field with a strict Zod schema. Unknown properties, embedded credentials, non-HTTPS endpoints, malformed identifiers, and non-JSON files are rejected. Imported content is treated as data and is never executed or unpacked.
