# Contributing

AgentProof welcomes focused contributions that improve agent safety testing, simulation fidelity, reporting, or operational reliability.

## Development

```bash
npm install
npm run lint
npm run build
npm run dev
```

Run the browser workflow against the local server:

```bash
npm run test:e2e
```

## Contribution requirements

- preserve deterministic, reproducible simulation behavior
- add test coverage for new scenario classes
- do not introduce executable upload formats
- keep customer secrets out of fixtures and logs
- maintain mobile and desktop usability
- describe scoring or calibration changes explicitly

Submissions that weaken the manifest boundary or imply unsupported certification claims will not be accepted.
