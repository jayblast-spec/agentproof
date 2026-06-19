# AgentProof Reference Runner

The reference runner pulls signed test jobs outbound from AgentProof, executes them in the customer's environment, signs the resulting evidence, and submits it to the control plane.

## Run

```bash
node runner/agentproof-runner.mjs \
  --config ./agentproof-runner.json \
  --once
```

Verify replay protection:

```bash
node runner/agentproof-runner.mjs \
  --config ./agentproof-runner.json \
  --once \
  --replay-test
```

## Adapters

### Demo

The downloaded configuration defaults to:

```json
{
  "adapter": { "type": "demo" }
}
```

This proves pairing, pulling, signing, persistence, and replay rejection without contacting an external agent.

### HTTP dry-run

To test a customer-controlled agent:

```json
{
  "adapter": {
    "type": "http",
    "endpoint": "https://internal-runner.example/agentproof"
  }
}
```

The endpoint receives `x-agentproof-dry-run: true` and `toolMode: "intercept"`. It must return proposed tool actions without executing them. AgentProof cannot prevent side effects inside an endpoint that ignores this contract, so production credentials should never be attached to the dry-run adapter.

## Security

- Runner tokens are stored only as SHA-256 hashes by AgentProof.
- Private ECDSA signing keys stay inside the downloaded runner configuration.
- Every evidence submission signs `jobId.nonce.resultDigest`.
- Jobs are atomically leased.
- Completed nonces cannot be submitted twice.
- Tool actions are evidence only and carry `intercepted: true`.
