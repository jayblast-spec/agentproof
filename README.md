# AgentProof

AgentProof is an agent simulation and production-readiness platform. It executes controlled security, reliability, policy, and cost scenarios before an autonomous agent receives production authority.

## Product surfaces

- `/` — commercial product experience
- `/lab` — configurable simulation laboratory
- `/reports/sample` — full readiness report and failure traces
- `/pricing` — commercial plans
- `/about` — product principles
- `POST /api/simulate` — validated deterministic simulation API

## Local development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run build
```

The current v1 uses a deterministic local simulation engine. Production connectors for HTTP/MCP agents can replace the emulated agent-response boundary without changing the scoring and report contracts.

## Manifest security

AgentProof does not accept agent ZIP files, source code, binaries, plugins, or executables. The browser importer accepts only a declarative `.json` manifest under 64 KB and validates every allowed field with a strict Zod schema. Unknown properties, embedded credentials, non-HTTPS endpoints, malformed identifiers, and non-JSON files are rejected. Imported content is treated as data and is never executed or unpacked.
