import { ArrowRight, CloudDownload, FileCheck2, Laptop, ShieldBan } from "lucide-react";

const steps = [
  { icon: CloudDownload, label: "Pull", text: "Runner requests one leased job outbound." },
  { icon: Laptop, label: "Execute", text: "Your agent handles dry-run scenarios locally." },
  { icon: ShieldBan, label: "Intercept", text: "Tool requests become evidence, not side effects." },
  { icon: FileCheck2, label: "Prove", text: "Signed results become a replay-safe report." },
];

export function RunnerFlowIllustration() {
  return (
    <section className="panel overflow-hidden p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-4 border-b hairline pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">How the connection works</p>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">AgentProof never reaches into your environment</h2>
        </div>
        <span className="text-xs text-[#8e978c]">Outbound runner architecture</span>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.label} className="relative min-h-44 border-l border-[var(--line)] pl-5">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center border border-[#b8ff58]/30 text-[var(--signal)]">
                <step.icon size={19} />
              </span>
              {index < steps.length - 1 && <ArrowRight className="hidden text-[#4e574c] md:block" size={18} />}
            </div>
            <span className="mt-7 block font-mono text-[10px] text-[#6f786d]">0{index + 1}</span>
            <strong className="mt-2 block">{step.label}</strong>
            <p className="mt-2 text-sm leading-6 text-[#9da69a]">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
