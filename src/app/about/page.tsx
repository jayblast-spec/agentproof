import { Eye, Scale, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <main>
      <section className="grid-bg border-b hairline py-24">
        <div className="shell">
          <p className="eyebrow">Why AgentProof exists</p>
          <h1 className="display mt-7 max-w-6xl">Autonomy must be earned, not declared.</h1>
          <p className="copy mt-8 max-w-2xl text-lg">AI agents are moving from answering questions to taking actions. Release practices have not caught up. AgentProof turns authority, safety, reliability, and cost into testable release criteria.</p>
        </div>
      </section>
      <section className="py-24">
        <div className="shell grid gap-5 lg:grid-cols-3">
          {[
            [Eye, "Observable", "Every scenario, decision, tool attempt, control result, and failure remains replayable."],
            [Scale, "Measured", "Readiness is separated by security, reliability, policy, and cost rather than hidden in one average."],
            [ShieldCheck, "Governed", "AgentProof tests whether authority boundaries hold before the agent receives production access."],
          ].map(([Icon, title, copy]) => (
            <article key={title as string} className="panel min-h-80 p-8">
              <Icon className="text-[var(--signal)]" size={26} />
              <h2 className="mt-20 text-3xl font-semibold">{title as string}</h2>
              <p className="copy mt-5">{copy as string}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
