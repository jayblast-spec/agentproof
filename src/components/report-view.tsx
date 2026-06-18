import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FlaskConical,
  ShieldAlert,
} from "lucide-react";
import type { SimulationResult } from "@/lib/types";
import { ScoreRing } from "./score-ring";

const tone = {
  critical: "text-[#ff8f87]",
  high: "text-[#ffbd55]",
  medium: "text-[#d7ff9e]",
  low: "text-[#9aa398]",
};

export function ReportView({ result }: { result: SimulationResult }) {
  const evidenceLabel = result.evidence.mode.replaceAll("_", " ");

  return (
    <div className="space-y-6">
      <section className="panel border-[#b8ff58]/25 bg-[#111711] p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="grid size-10 shrink-0 place-items-center border border-[#b8ff58]/30 bg-[#b8ff58]/5 text-[var(--signal)]">
            <FlaskConical size={19} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="eyebrow" data-testid="evidence-mode">{evidenceLabel} evidence</p>
              <span
                className="border border-[#ffbd55]/35 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[#ffbd55]"
                data-testid="endpoint-status"
              >
                Endpoint {result.evidence.endpointCalled ? "contacted" : "not contacted"}
              </span>
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-[#c5ccc2]">
              {result.evidence.statement}
            </p>
            <p className="mt-3 text-xs leading-5 text-[#858e83]">
              Evidence inputs: {result.evidence.inputs.join(" / ")}
            </p>
          </div>
        </div>
      </section>

      <section className="panel grid gap-8 p-6 sm:p-8 lg:grid-cols-[auto_1fr]">
        <ScoreRing score={result.score} />
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow">Run {result.id}</span>
            <span className={`border px-2 py-1 text-xs uppercase ${
              result.readiness === "ready" ? "border-[#b8ff58]/40 text-[#b8ff58]" :
              result.readiness === "conditional" ? "border-[#ffbd55]/40 text-[#ffbd55]" :
              "border-[#ff6c63]/40 text-[#ff8f87]"
            }`}>
              {result.readiness}
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-semibold">{result.input.agentName}</h2>
          <p className="copy mt-3 max-w-3xl">{result.input.purpose}</p>
          <div className="mt-7 grid grid-cols-2 gap-5 lg:grid-cols-4">
            <div><span className="text-xs text-[#858e83]">Executions</span><strong className="mt-1 block font-mono text-xl">{result.totalRuns.toLocaleString()}</strong></div>
            <div><span className="text-xs text-[#858e83]">Pass rate</span><strong className="mt-1 block font-mono text-xl">{result.passRate}%</strong></div>
            <div><span className="text-xs text-[#858e83]">Unsafe actions</span><strong className="mt-1 block font-mono text-xl">{result.unsafeActions}</strong></div>
            <div><span className="text-xs text-[#858e83]">P95 latency</span><strong className="mt-1 block font-mono text-xl">{result.p95LatencyMs}ms</strong></div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <div className="panel p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Release blockers</p>
              <h3 className="mt-3 text-2xl font-semibold">Findings that require a decision</h3>
            </div>
            <ShieldAlert className="text-[#ffbd55]" />
          </div>
          <div className="mt-7 divide-y divide-[var(--line)]">
            {result.findings.map((finding) => (
              <article key={finding.id} className="py-5 first:pt-0">
                <div className="flex items-start gap-4">
                  {finding.status === "passed" ? (
                    <CheckCircle2 className="mt-1 shrink-0 text-[var(--signal)]" size={19} />
                  ) : (
                    <AlertTriangle className="mt-1 shrink-0 text-[var(--amber)]" size={19} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-semibold">{finding.title}</h4>
                      <span className={`text-xs uppercase ${tone[finding.severity]}`}>{finding.severity}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#a9b1a6]">{finding.evidence}</p>
                    <p className="mt-3 border-l border-[var(--signal)] pl-3 text-sm text-[#d8ddd4]">{finding.recommendation}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <p className="eyebrow">Control coverage</p>
            <div className="mt-6 space-y-5">
              {Object.entries(result.categoryScores).map(([category, score]) => (
                <div key={category}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="capitalize text-[#b7bfb5]">{category}</span>
                    <span className="font-mono">{score}</span>
                  </div>
                  <div className="h-1.5 bg-[#292e29]">
                    <div className="h-full bg-[var(--signal)]" style={{ width: `${score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="panel p-5">
              <CircleDollarSign size={20} className="text-[var(--signal)]" />
              <span className="mt-6 block text-xs text-[#858e83]">Estimated monthly test cost</span>
              <strong className="mt-1 block font-mono text-2xl">${result.estimatedMonthlyCost}</strong>
            </div>
            <div className="panel p-5">
              <Clock3 size={20} className="text-[var(--signal)]" />
              <span className="mt-6 block text-xs text-[#858e83]">Generated</span>
              <strong className="mt-1 block text-sm">{new Date(result.createdAt).toLocaleDateString()}</strong>
            </div>
          </div>
          <div className="panel p-6">
            <p className="eyebrow">Calibration</p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div><span className="text-xs text-[#858e83]">Expected pass rate</span><strong className="mt-1 block font-mono text-xl">{result.calibration.expectedPassRate}%</strong></div>
              <div><span className="text-xs text-[#858e83]">Observed pass rate</span><strong className="mt-1 block font-mono text-xl">{result.calibration.observedPassRate}%</strong></div>
            </div>
            <div className="mt-5 border-t hairline pt-4 text-sm text-[#aeb6ac]">
              Calibration error: <strong className="font-mono text-white">{result.calibration.calibrationError}%</strong> across {result.calibration.sampleSize.toLocaleString()} trials.
            </div>
          </div>
        </div>
      </section>

      <section className="panel p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Replayable evidence</p>
            <h3 className="mt-3 text-2xl font-semibold">Execution trace</h3>
          </div>
          <button className="btn-secondary !min-h-10">
            Export trace <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {result.traces.slice(0, 10).map((step, index) => (
            <div key={`${step.at}-${index}`} className="trace-line pb-6">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm">{step.actor}</strong>
                <span className="font-mono text-xs text-[#788176]">+{step.at}ms</span>
              </div>
              <p className="mt-1 text-sm text-[#d3d8d0]">{step.action}</p>
              <p className="mt-1 text-xs leading-5 text-[#899287]">{step.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
