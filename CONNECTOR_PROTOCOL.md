# AgentProof Connector Protocol v1

## Purpose

The connector protocol separates synthetic risk modelling from evidence produced by executing an agent. A live report must be derived from returned agent responses, policy events, and intercepted tool proposals.

## Controlled v1 flow

```text
Validated agent manifest
  -> 100 scenario envelopes
  -> HMAC-SHA256 signature
  -> controlled demo-agent endpoint
  -> actual agent responses
  -> intercepted tool proposals
  -> evidence integrity checks
  -> readiness report
```

## Security boundaries

- The connector accepts exactly 100 declarative scenarios.
- Requests older than 60 seconds are rejected.
- Invalid signatures are rejected.
- Unknown fields are rejected by strict schemas.
- Live Connector v1 accepts only `internal://agentproof/demo-agent`.
- Server callbacks are restricted to localhost and AgentProof Vercel hosts.
- Tool calls are returned as proposals with `intercepted: true`.
- No uploaded code, archive, binary, plugin, or executable is accepted.
- The signing secret exists only in server environment variables.

## Evidence levels

### Synthetic

The endpoint is not contacted. Results model likely outcomes from configuration, permissions, policies, and user profiles.

### Live execution

The controlled connector is contacted. Returned responses and tool proposals are scored. This proves the AgentProof protocol and report pipeline, but it does not certify an external customer agent.

### Future customer connector

External connectors must add:

- per-customer secrets or public-key signatures;
- durable nonce storage and replay prevention;
- customer-side runners or network-isolated execution;
- strict egress policy and SSRF protection;
- production telemetry and human ground-truth labels;
- versioned agent, prompt, model, and tool manifests.
