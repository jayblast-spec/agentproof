import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  CircleGauge,
  Eye,
  FlaskConical,
  LockKeyhole,
  Play,
  Repeat2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { sampleResult } from "@/lib/simulation";

const features = [
  [LockKeyhole, "Authority testing", "Attempt tool calls beyond declared permissions and verify that deterministic controls stop them."],
  [TriangleAlert, "Adversarial scenarios", "Run prompt injection, sensitive-data, outage, impersonation, and retry-loop attacks."],
  [Repeat2, "Failure replay", "Inspect the exact decision, tool call, policy result, and system response behind every failure."],
  [CircleGauge, "Operational economics", "Measure task success, p95 latency, model usage, retries, and projected monthly cost."],
];

export default function Home() {
  return (
    <main>
      <section className="sky-bg grid-bg relative flex min-h-[calc(100svh-64px)] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center">
        <div className="relative z-10 flex max-w-3xl flex-col items-center gap-6">
          <div className="flex items-center gap-2 rounded-full border border-[var(--signal)]/30 px-4 py-1.5 text-xs font-semibold text-[var(--signal-2)]" style={{ background: "color-mix(in srgb, var(--signal) 14%, transparent)" }}>
            <span className="status-dot" /> Agent reliability infrastructure
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Test agents
            <br />
            <span className="bg-gradient-to-r from-[var(--signal)] to-[var(--signal-2)] bg-clip-text text-transparent">
              before they touch reality.
            </span>
          </h1>

          <p className="max-w-xl text-base text-[var(--muted)] sm:text-lg">
            Execute thousands of controlled scenarios against your AI agent. Find unsafe tool calls,
            brittle reasoning, cost loops, and policy failures before production does.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link href="/lab" className="btn-primary">
              Run a readiness test <ArrowRight size={17} />
            </Link>
            <Link href="/reports/sample" className="btn-secondary">
              <Play size={16} /> Inspect sample report
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-6 border-t border-[var(--line)] pt-6 sm:grid-cols-4">
            {[
              ["10K+", "simulated runs"],
              ["8", "attack classes"],
              ["100%", "replayable"],
              ["0", "production access"],
            ].map(([value, label]) => (
              <div key={label}>
                <strong className="font-mono text-xl">{value}</strong>
                <span className="mt-1 block text-xs text-[var(--muted)]">{label}</span>
              </div>
            ))}
          </div>

          {/* Live simulation preview card */}
          <div className="mt-4 w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 text-left shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
              <div>
                <p className="eyebrow">Simulation 04 / running</p>
                <h2 className="mt-1.5 text-lg font-semibold">Atlas Support Agent</h2>
              </div>
              <span className="flex items-center gap-2 text-xs text-[var(--signal)]">
                <span className="status-dot" /> Live
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["Indirect injection", "Blocked", "security"],
                ["Refund authority", "Review", "policy"],
              ].map(([title, status, category], index) => (
                <div key={title} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase text-[var(--muted)]">{category}</span>
                    <span className={index === 1 ? "text-xs text-[var(--amber)]" : "text-xs text-[var(--signal)]"}>{status}</span>
                  </div>
                  <strong className="mt-4 block text-sm">{title}</strong>
                  <div className="mt-3 h-1 rounded-full bg-[var(--surface)]">
                    <div className="h-full rounded-full bg-[var(--signal)]" style={{ width: `${58 + index * 11}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="border-b hairline py-24">
        <div className="shell">
          <div className="mb-12 text-center">
            <p className="eyebrow justify-center">Not another agent dashboard</p>
            <h2 className="mt-5 text-2xl font-bold sm:text-3xl">
              Evidence, not{" "}
              <span className="bg-gradient-to-r from-[var(--signal)] to-[var(--signal-2)] bg-clip-text text-transparent">
                confidence theatre.
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--muted)]">
              Chat interfaces can explain what might fail. AgentProof executes the failure conditions,
              measures the result, and preserves the trace so your team can reproduce it.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map(([Icon, title, description]) => (
              <article
                key={title as string}
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--signal)]/40"
              >
                <span className="icon-3d">
                  <Icon size={20} strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title as string}</h3>
                <p className="copy mt-2 text-sm leading-relaxed">{description as string}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="method" className="grid-bg border-b hairline py-24">
        <div className="shell">
          <p className="eyebrow">The release method</p>
          <h2 className="section-title mt-5 max-w-4xl">Every agent earns authority through observed behavior.</h2>
          <div className="mt-16 grid gap-px bg-[var(--line)] lg:grid-cols-4">
            {[
              [Eye, "01", "Declare", "Define purpose, tools, sensitive data, financial limits, and approval boundaries."],
              [FlaskConical, "02", "Simulate", "Execute normal, edge, adversarial, outage, and high-volume conditions."],
              [Blocks, "03", "Repair", "Turn every failure into a reproducible regression scenario and control change."],
              [ShieldCheck, "04", "Release", "Ship only when readiness thresholds pass and critical actions remain governed."],
            ].map(([Icon, number, title, description]) => (
              <article key={title as string} className="bg-[var(--ink)] p-7 sm:p-9">
                <div className="flex items-center justify-between">
                  <Icon size={24} className="text-[var(--signal)]" />
                  <span className="font-mono text-xs text-[#687166]">{number as string}</span>
                </div>
                <h3 className="mt-16 text-2xl font-semibold">{title as string}</h3>
                <p className="copy mt-4 text-sm">{description as string}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b hairline py-24">
        <div className="shell grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <p className="eyebrow">A real report</p>
            <h2 className="section-title mt-5">One score is never enough.</h2>
            <p className="copy mt-6 max-w-md">
              AgentProof separates security, reliability, policy, and cost so a strong average cannot hide a critical failure.
            </p>
            <Link href="/reports/sample" className="btn-secondary mt-8">
              Open full report <ArrowRight size={16} />
            </Link>
          </div>
          <div className="panel p-6 sm:p-8">
            <div className="flex items-end justify-between border-b hairline pb-6">
              <div><span className="eyebrow">Sample readiness</span><h3 className="mt-2 text-2xl font-semibold">Atlas Support Agent</h3></div>
              <strong className="font-mono text-5xl">{sampleResult.score}</strong>
            </div>
            <div className="mt-7 space-y-5">
              {Object.entries(sampleResult.categoryScores).map(([category, score]) => (
                <div key={category} className="grid grid-cols-[100px_1fr_44px] items-center gap-4">
                  <span className="text-sm capitalize text-[#aab2a8]">{category}</span>
                  <div className="h-1.5 bg-[#292e29]"><div className="h-full bg-[var(--signal)]" style={{ width: `${score}%` }} /></div>
                  <span className="font-mono text-sm">{score}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {sampleResult.findings.slice(0, 4).map((finding) => (
                <div key={finding.id} className="border hairline p-4">
                  <span className="text-[10px] uppercase text-[#858e83]">{finding.severity}</span>
                  <strong className="mt-3 block text-sm">{finding.title}</strong>
                  <span className={`mt-2 block text-xs ${finding.status === "failed" ? "text-[var(--red)]" : "text-[var(--signal)]"}`}>
                    {finding.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--signal)] py-20 text-[#0b0d0b]">
        <div className="shell flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[.16em]">No production access required</p>
            <h2 className="mt-5 max-w-4xl text-4xl font-semibold leading-none sm:text-6xl">
              Make the first failure happen here.
            </h2>
          </div>
          <Link href="/lab" className="inline-flex min-h-52 w-full flex-col justify-between bg-[#0b0d0b] p-6 sm:w-72" style={{ color: "#ffffff" }}>
            <ArrowRight className="self-end" />
            <span className="text-xl font-semibold">Open AgentProof lab</span>
          </Link>
        </div>
      </section>

      <footer className="py-10">
        <div className="shell flex flex-col justify-between gap-5 text-sm text-[#7f887d] sm:flex-row">
          <span>AgentProof — autonomous agent reliability infrastructure.</span>
          <div className="flex gap-6"><Link href="/about">About</Link><Link href="/pricing">Pricing</Link><Link href="/reports/sample">Sample report</Link></div>
        </div>
      </footer>
    </main>
  );
}
