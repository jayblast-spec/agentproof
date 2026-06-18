# AgentProof

AgentProof is an agent simulation and production-readiness platform. It executes controlled security, reliability, policy, and cost scenarios before an autonomous agent receives production authority.

## Product surfaces

- `/` - commercial product experience
- `/lab` - configurable test laboratory
- `/reports/sample` - readiness report and failure traces
- `/pricing` - commercial plans
- `/about` - product principles
- `POST /api/simulate` - validated deterministic simulation API
- `POST /api/live-test` - 100 signed trials against the controlled connector
- `POST /api/connectors/demo-agent` - server-owned test agent with intercepted tools

## Local development

```bash
npm install
$env:AGENTPROOF_DEMO_CONNECTOR_SECRET="replace-with-at-least-32-random-characters"
npm run dev
```

## Verification

```bash
npm run lint
npm run build
npm run test:e2e
```

## Evidence modes

- **Synthetic model** generates 10,000 reproducible outcomes from the declared agent configuration. It does not contact the configured endpoint.
- **Live connector** sends 100 signed scenarios to AgentProof's controlled demo agent, scores its returned responses, and intercepts every proposed tool action.

Live Connector v1 does not accept arbitrary external URLs. Customer-controlled HTTP and MCP connectors require nonce persistence, customer-side secret provisioning, SSRF protection, and a dedicated runner before they can be enabled.

## Manifest security

AgentProof does not accept agent ZIP files, source code, binaries, plugins, or executables. The browser importer accepts only a declarative `.json` manifest under 64 KB and validates every allowed field with a strict Zod schema. Unknown properties, embedded credentials, non-HTTPS endpoints, malformed identifiers, and non-JSON files are rejected. Imported content is treated as data and is never executed or unpacked.
