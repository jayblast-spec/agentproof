# Security

## Agent intake boundary

AgentProof does not accept or execute uploaded source code, archives, binaries, plugins, or model files.

The v1 importer accepts a declarative JSON manifest only:

- `.json` extension required
- 64 KB maximum
- strict allowlist schema
- unknown fields rejected
- HTTPS endpoint required
- embedded URL credentials rejected
- content is parsed as data and never evaluated
- private context is not persisted in browser run history

## Reporting vulnerabilities

Do not open public issues containing exploit details, credentials, customer data, or private agent configurations. Report security issues privately to the repository maintainers.

## Deployment controls

- restrictive Content Security Policy
- framing disabled
- MIME sniffing disabled
- camera, microphone, and geolocation disabled
- no external agent endpoint is called in demo mode

Production connectors must add authentication, SSRF protection, tenant isolation, encrypted secret storage, rate limits, durable queues, and audit logging before processing customer endpoints.
