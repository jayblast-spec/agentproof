import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

const plans = [
  { name: "Single run", price: "$49", note: "One readiness report", features: ["Up to 1,000 executions", "8 scenario classes", "Failure replay", "Shareable report"] },
  { name: "Continuous", price: "$299", note: "Per month", featured: true, features: ["Unlimited release suites", "Regression comparison", "Team approval workflow", "30-day trace history"] },
  { name: "Agency", price: "$1,500", note: "Starting monthly", features: ["Multiple client workspaces", "Private scenario libraries", "White-label reports", "Priority connector support"] },
];

export default function PricingPage() {
  return (
    <main>
      <section className="border-b hairline py-20">
        <div className="shell max-w-4xl text-center">
          <p className="eyebrow">Commercial model</p>
          <h1 className="section-title mt-5">Price the evidence below the cost of one agent incident.</h1>
          <p className="copy mx-auto mt-6 max-w-2xl">Start with a release test. Move to continuous regression testing when the agent becomes operationally important.</p>
        </div>
      </section>
      <section className="py-20">
        <div className="shell grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`flex min-h-[520px] flex-col border p-7 sm:p-9 ${plan.featured ? "border-[var(--signal)] bg-[#171c16]" : "hairline bg-[#101310]"}`}>
              <span className="eyebrow">{plan.featured ? "Recommended" : "AgentProof"}</span>
              <h2 className="mt-6 text-2xl font-semibold">{plan.name}</h2>
              <strong className="mt-10 text-5xl font-semibold">{plan.price}</strong>
              <span className="mt-2 text-sm text-[#899287]">{plan.note}</span>
              <div className="my-8 h-px bg-[var(--line)]" />
              <ul className="space-y-4 text-sm text-[#b3bbb0]">
                {plan.features.map((feature) => <li key={feature} className="flex gap-3"><Check size={16} className="shrink-0 text-[var(--signal)]" />{feature}</li>)}
              </ul>
              <Link href="/lab" className={plan.featured ? "btn-primary mt-auto" : "btn-secondary mt-auto"}>Start testing <ArrowRight size={16} /></Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
