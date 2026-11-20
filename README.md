<div align="center">

# AgentProof

### Agent Reliability Infrastructure

AgentProof runs controlled simulations against autonomous AI agents before they touch production — authority testing, adversarial scenarios, failure replay, and operational-cost measurement, scored into a readiness report your team can act on.

<p>
  <a href="https://github.com/jayblast-spec/agentproof"><img alt="GitHub Repo" src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white"></a>
</p>

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React%2019-149ECA?style=flat-square&logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white">
  <img alt="Framer Motion" src="https://img.shields.io/badge/Framer%20Motion-1D4ED8?style=flat-square&logo=framer&logoColor=white">
  <img alt="Zod" src="https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white">
  <img alt="Playwright" src="https://img.shields.io/badge/Playwright-2EAD33?style=flat-square&logo=playwright&logoColor=white">
</p>

<p>
  <img alt="Animated AgentProof headline" src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=18&duration=2600&pause=650&color=1D4ED8&center=true&vCenter=true&width=760&lines=Declare+%E2%86%92+Simulate+%E2%86%92+Repair+%E2%86%92+Release;Test+agents+before+they+touch+reality;Authority%2C+injection%2C+outage%2C+cost+scenarios;Every+failure+becomes+a+reproducible+trace">
</p>

</div>

## What It Does

AgentProof executes thousands of controlled scenarios against an AI agent instead of describing what might go wrong. It runs authority tests (tool calls beyond declared permissions), adversarial scenarios (prompt injection, sensitive-data exposure, outage, impersonation, retry loops), and operational-economics checks (task success rate, p95 latency, model usage, retries, projected monthly cost). Every failure is captured with the exact decision, tool call, policy result, and system response so it can be replayed and turned into a regression test. Results are split into separate security, reliability, policy, and cost scores so a strong average cannot hide a critical failure.

## How It Works

Built on Next.js 16 (App Router) with React 19 and TypeScript. The `/lab` route runs simulations against a declared agent contract; `/reports/sample` renders a full readiness report with category scores and findings. Server logic lives under `src/app/api/` (`simulate`, `live-test`, `connectors`, `customer-connectors`, `owner`), with `runner/agentproof-runner.mjs` available for scheduled or CI-triggered runs (`npm run runner:once`). Zod validates scenario and result contracts; Framer Motion drives the readiness UI; Tailwind v4 (via `@tailwindcss/postcss`) handles styling; Playwright (`playwright-core`) powers end-to-end and runner integration tests (`npm run test:e2e`, `npm run test:runner`).

## Engineering Notes

**The real problem:** you can't tell if an agent config is safe by reading it — a "financial, write-permission, unbounded-autonomy" agent and a "read-only, approval-gated" one look similar on paper but carry very different real-world risk.

**The approach:** `simulation.ts` runs a seeded, deterministic risk model — a `sin`-based hash seeds reproducible pseudo-randomness so the same input always produces the same simulation, and risk is built from named weighted factors rather than one opaque score: autonomy level (`observe: -10` to `bounded: +10`), tool permission tier (`read: 0` to `destructive: +11`), policy enforcement strength (`+3` per block rule), and endpoint/context signals.

**One real number:** base risk is bounded to a 4–62 range before behavioral trials run — a `destructive`, unbounded-autonomy agent with no block policies starts near the ceiling regardless of what the simulation trials find afterward.

**Not handled yet:** the weights are an engineered rubric, not learned from real incident data — it hasn't been validated against actual production agent failures yet, so treat scores as relative risk ranking, not calibrated probability.

## Live

*(demo temporarily offline)*

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Motion | Framer Motion |
| Validation | Zod |
| Icons | Lucide React |
| Testing | Playwright (E2E + runner integration) |
| Deployment | Vercel |

<p align="center">
  <img alt="ArkNet Digital footer" src="https://capsule-render.vercel.app/api?type=waving&height=120&color=0:1D4ED8,55:0B1E3D,100:020617&section=footer&text=ArkNet%20Digital&fontColor=FFFFFF&fontSize=24&fontAlign=50&fontAlignY=65&desc=michael@arknet.digital&descAlign=50&descAlignY=85">
</p>
