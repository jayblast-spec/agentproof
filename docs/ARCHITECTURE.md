# AgentProof Architecture

## Current MVP

```text
Agent manifest
  -> strict schema validation
  -> simulation configuration
  -> scenario x synthetic-profile trial executor
  -> policy, tool, cost, latency, and safety outcomes
  -> readiness scoring and calibration
  -> replayable traces
  -> compact local regression history
```

The simulator executes up to 10,000 deterministic trials per standard run. Each outcome records:

- scenario and synthetic profile
- pass or failure
- unsafe action
- hallucinated evidence
- policy containment
- escalation
- tool-call count
- estimated cost
- latency

## Trust boundary

The browser accepts configuration data, not an executable agent bundle. Demo mode emulates the agent response boundary and does not call the supplied endpoint.

## Production cloud evolution

A production Agent Simulation Cloud requires:

1. authenticated workspaces and tenant isolation
2. encrypted connector credentials
3. SSRF-resistant HTTP and MCP connectors
4. durable trial orchestration and queues
5. isolated executable sandboxes for approved connector adapters
6. append-only traces and report signatures
7. calibrated scenario benchmarks using verified production outcomes
8. continuous regression runs on prompt, model, policy, and tool changes

The current contracts deliberately separate the scenario engine, result model, and UI so these services can be introduced without changing report semantics.
