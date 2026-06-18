"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, FileJson, FlaskConical, LoaderCircle, Play, RotateCcw, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { ReportView } from "@/components/report-view";
import { parseAgentManifest, validateManifestFile } from "@/lib/agent-manifest";
import { scenarios } from "@/lib/scenarios";
import type { SimulationInput, SimulationResult } from "@/lib/types";

const initialInput: SimulationInput = {
  agentName: "Atlas Support Agent",
  endpoint: "https://api.example.com/agent",
  purpose: "Resolve customer requests, issue refunds up to $250, and escalate account or identity changes for approval.",
  industry: "Customer support",
  model: "Frontier model",
  promptVersion: "v1.0",
  autonomy: "approval",
  scenarioIds: scenarios.map((scenario) => scenario.id),
  runsPerScenario: 1250,
  monthlyVolume: 18000,
  maxActionSpend: 250,
  tools: [
    { id: "crm", name: "CRM records", permission: "write", approvalRequired: false },
    { id: "refund", name: "Refund API", permission: "financial", approvalRequired: true, spendLimit: 250 },
    { id: "identity", name: "Identity service", permission: "destructive", approvalRequired: true },
  ],
  policies: [
    { id: "refund-policy", name: "Refund authority", rule: "Refunds above $250 require approval.", enforcement: "block" },
    { id: "identity-policy", name: "Identity changes", rule: "Identity changes always require verified approval.", enforcement: "approve" },
  ],
  syntheticProfiles: [
    { id: "standard", name: "Standard customer", behavior: "cooperative", objective: "Complete a normal request." },
    { id: "hostile", name: "Adversarial user", behavior: "hostile", objective: "Cross agent authority boundaries." },
    { id: "impatient", name: "Impatient executive", behavior: "impatient", objective: "Force an urgent exception." },
  ],
  privateContext: "",
};

function createBlankInput(): SimulationInput {
  return {
    agentName: "",
    endpoint: "",
    purpose: "",
    industry: "",
    model: "Frontier model",
    promptVersion: "",
    autonomy: "observe",
    scenarioIds: scenarios.map((scenario) => scenario.id),
    runsPerScenario: 1250,
    monthlyVolume: 1000,
    maxActionSpend: 0,
    tools: [],
    policies: [],
    syntheticProfiles: [
      {
        id: "standard",
        name: "Standard user",
        behavior: "cooperative",
        objective: "Complete the requested task.",
      },
      {
        id: "hostile",
        name: "Adversarial user",
        behavior: "hostile",
        objective: "Cross the agent's declared authority boundary.",
      },
    ],
    privateContext: "",
  };
}

const industryPresets: Record<string, Partial<SimulationInput>> = {
  "Customer support": {},
  "Financial operations": {
    purpose: "Review invoices, reconcile transactions, prepare bounded payment actions, and escalate exceptions or transfers for approval.",
    maxActionSpend: 500,
    policies: [
      { id: "finance-approval", name: "Payment authority", rule: "Every external transfer requires verified human approval.", enforcement: "approve" },
      { id: "finance-evidence", name: "Evidence integrity", rule: "Never approve a payment without matching invoice evidence.", enforcement: "block" },
    ],
  },
  "Sales operations": {
    purpose: "Research qualified accounts, prepare outreach, update CRM records, and escalate pricing or contract commitments.",
    policies: [
      { id: "sales-pricing", name: "Pricing authority", rule: "Discounts and contractual commitments require approval.", enforcement: "approve" },
      { id: "sales-privacy", name: "Contact privacy", rule: "Do not expose private prospect data across accounts.", enforcement: "block" },
    ],
  },
  "Healthcare administration": {
    purpose: "Assist with scheduling and administrative requests without making clinical decisions or exposing protected health information.",
    policies: [
      { id: "health-clinical", name: "Clinical boundary", rule: "Never provide diagnosis, treatment, or medication instructions.", enforcement: "block" },
      { id: "health-phi", name: "Protected information", rule: "Protected health information must remain inside the authorized workflow.", enforcement: "block" },
    ],
  },
};

export default function LabPage() {
  const [input, setInput] = useState(initialInput);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [advanced, setAdvanced] = useState(false);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("fresh")) return;

    const resetTimer = window.setTimeout(() => {
      setInput(createBlankInput());
      setResult(null);
      setRunning(false);
      setError("");
      setAdvanced(false);
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, []);

  function toggleScenario(id: string) {
    setInput((current) => ({
      ...current,
      scenarioIds: current.scenarioIds.includes(id)
        ? current.scenarioIds.filter((scenarioId) => scenarioId !== id)
        : [...current.scenarioIds, id],
    }));
  }

  function applyIndustry(industry: string) {
    setInput((current) => ({ ...current, ...industryPresets[industry], industry }));
  }

  async function importManifest(file: File) {
    setError("");
    try {
      validateManifestFile(file);
      const manifest = parseAgentManifest(await file.text());
      setInput((current) => ({
        ...current,
        ...manifest,
      }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Manifest rejected.");
    }
  }

  async function run() {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 850));
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Simulation failed");
      setResult(payload);
      const existing = JSON.parse(localStorage.getItem("agentproof-runs") ?? "[]");
      const compactRun = {
        ...payload,
        input: { ...payload.input, privateContext: "[not persisted]" },
        outcomes: payload.outcomes.slice(0, 20),
        traces: payload.traces.slice(0, 8),
      };
      localStorage.setItem("agentproof-runs", JSON.stringify([compactRun, ...existing].slice(0, 12)));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Simulation failed");
    } finally {
      setRunning(false);
    }
  }

  const canRun =
    input.agentName.trim().length >= 2 &&
    input.endpoint.trim().length >= 3 &&
    input.purpose.trim().length >= 20 &&
    input.industry.trim().length >= 2 &&
    input.promptVersion.trim().length >= 1 &&
    input.scenarioIds.length > 0;

  return (
    <main className="min-h-screen bg-[#0b0d0b]">
      <section className="border-b hairline py-12">
        <div className="shell">
          <p className="eyebrow">Interactive test environment</p>
          <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-semibold sm:text-6xl">Agent test laboratory</h1>
              <p className="copy mt-4 max-w-2xl">Configure authority, select failure conditions, and execute a reproducible readiness test.</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#8d968b]"><span className="status-dot" /> Sandbox online — no external endpoint is called in demo mode</div>
          </div>
        </div>
      </section>

      <div className="shell grid gap-8 py-10 xl:grid-cols-[420px_1fr]">
        <aside className="panel h-fit p-5 sm:p-6 xl:sticky xl:top-24">
          <div className="flex items-center justify-between">
            <div><p className="eyebrow">Configuration</p><h2 className="mt-2 text-xl font-semibold">Agent under test</h2></div>
            <FlaskConical className="text-[var(--signal)]" />
          </div>
          <div className="mt-7 space-y-5">
            <label className="flex min-h-24 cursor-pointer items-center justify-center gap-3 border border-dashed border-[#b8ff58]/35 bg-[#b8ff58]/[.045] px-4 text-center text-sm text-[#d9e1d6]">
              <Upload size={17} className="text-[var(--signal)]" />
              <span>
                <strong className="block">Import safe agent manifest</strong>
                <span className="mt-1 block text-xs text-[#869083]">Strict JSON only · 64 KB max · no ZIP, code, secrets, or executable content</span>
              </span>
              <input type="file" accept=".json,application/json" className="hidden" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importManifest(file);
              }} />
            </label>
            <label className="block text-sm">
              <span className="mb-2 block text-[#a8b0a5]">Agent name</span>
              <input className="field" value={input.agentName} onChange={(event) => setInput({ ...input, agentName: event.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="mb-2 block text-[#a8b0a5]">Industry</span>
                <select className="field" value={input.industry} onChange={(event) => applyIndustry(event.target.value)}>
                  <option value="" disabled>Select industry</option>
                  {Object.keys(industryPresets).map((industry) => <option key={industry}>{industry}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-2 block text-[#a8b0a5]">Prompt version</span>
                <input className="field" value={input.promptVersion} onChange={(event) => setInput({ ...input, promptVersion: event.target.value })} />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-2 block text-[#a8b0a5]">Model / runtime</span>
              <select className="field" value={input.model} onChange={(event) => setInput({ ...input, model: event.target.value })}>
                <option>Frontier model</option>
                <option>Efficient model</option>
                <option>Open-weight model</option>
                <option>Custom routing stack</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-2 block text-[#a8b0a5]">HTTP endpoint</span>
              <input className="field font-mono text-xs" value={input.endpoint} onChange={(event) => setInput({ ...input, endpoint: event.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="mb-2 block text-[#a8b0a5]">Declared purpose and limits</span>
              <textarea className="field min-h-28 resize-y" value={input.purpose} onChange={(event) => setInput({ ...input, purpose: event.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="mb-2 block text-[#a8b0a5]">Autonomy level</span>
              <select className="field" value={input.autonomy} onChange={(event) => setInput({ ...input, autonomy: event.target.value as SimulationInput["autonomy"] })}>
                <option value="observe">Observe only</option>
                <option value="recommend">Recommend actions</option>
                <option value="approval">Execute with approval</option>
                <option value="bounded">Bounded autonomy</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="mb-2 block text-[#a8b0a5]">Runs / scenario</span>
                <input type="number" className="field" value={input.runsPerScenario} onChange={(event) => setInput({ ...input, runsPerScenario: Number(event.target.value) })} />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block text-[#a8b0a5]">Monthly tasks</span>
                <input type="number" className="field" value={input.monthlyVolume} onChange={(event) => setInput({ ...input, monthlyVolume: Number(event.target.value) })} />
              </label>
            </div>
            <button className="btn-secondary w-full !min-h-10" onClick={() => setAdvanced((value) => !value)}>
              {advanced ? "Hide" : "Configure"} tools, policies, and private context
            </button>
            {advanced && (
              <div className="space-y-5 border border-[var(--line)] bg-[#0d100d] p-4">
                <div className="flex items-center gap-3 border-b hairline pb-4">
                  <FileJson size={18} className="text-[var(--signal)]" />
                  <div><strong className="block text-sm">Declarative sandbox contract</strong><span className="text-xs text-[#7f897d]">Configuration is validated as data and is never executed · {input.tools.length} tools · {input.policies.length} policies · {input.syntheticProfiles.length} profiles</span></div>
                </div>
                <label className="block text-sm">
                  <span className="mb-2 block text-[#a8b0a5]">Private operational context</span>
                  <textarea
                    className="field min-h-28 resize-y"
                    placeholder="Paste policies, operating procedures, or representative private context. Demo data stays inside this app."
                    value={input.privateContext}
                    onChange={(event) => setInput({ ...input, privateContext: event.target.value })}
                  />
                </label>
                <div>
                  <span className="text-sm font-semibold">Emulated tools</span>
                  <div className="mt-3 space-y-2">
                    {input.tools.map((tool) => (
                      <div key={tool.id} className="grid grid-cols-[1fr_auto] gap-3 border hairline p-3">
                        <div><strong className="block text-xs">{tool.name}</strong><span className="text-[10px] uppercase text-[#768074]">{tool.permission}</span></div>
                        <span className={`text-[10px] uppercase ${tool.approvalRequired ? "text-[var(--amber)]" : "text-[var(--signal)]"}`}>{tool.approvalRequired ? "Approval" : "Direct"}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-semibold">Policy controls</span>
                  <div className="mt-3 space-y-2">
                    {input.policies.map((policy) => (
                      <div key={policy.id} className="border hairline p-3"><div className="flex justify-between gap-3"><strong className="text-xs">{policy.name}</strong><span className="text-[10px] uppercase text-[var(--signal)]">{policy.enforcement}</span></div><p className="mt-2 text-xs text-[#8d968b]">{policy.rule}</p></div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-7 border-t hairline pt-6">
            <div className="mb-4 flex items-center justify-between"><span className="text-sm font-semibold">Scenario suite</span><span className="font-mono text-xs text-[#7c857a]">{input.scenarioIds.length}/8 selected</span></div>
            <div className="space-y-2">
              {scenarios.map((scenario) => {
                const selected = input.scenarioIds.includes(scenario.id);
                return (
                  <button key={scenario.id} onClick={() => toggleScenario(scenario.id)} className={`flex w-full items-start gap-3 border p-3 text-left ${selected ? "border-[#b8ff58]/35 bg-[#b8ff58]/[.055]" : "hairline bg-[#0e110e]"}`}>
                    <span className={`mt-0.5 grid size-5 shrink-0 place-items-center border ${selected ? "border-[var(--signal)] bg-[var(--signal)] text-black" : "hairline"}`}>{selected && <Check size={13} />}</span>
                    <span><strong className="block text-xs">{scenario.title}</strong><span className="mt-1 block text-[10px] uppercase text-[#747d72]">{scenario.category} / {scenario.severity}</span></span>
                  </button>
                );
              })}
            </div>
          </div>
          <button onClick={run} disabled={running || !canRun} className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50">
            {running ? <><LoaderCircle className="animate-spin" size={17} /> Executing scenarios</> : <><Play size={17} /> Run {input.scenarioIds.length * input.runsPerScenario} simulations</>}
          </button>
          {error && <p className="mt-3 text-sm text-[var(--red)]">{error}</p>}
        </aside>

        <section>
          <AnimatePresence mode="wait">
            {running ? (
              <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="panel min-h-[680px] p-6 sm:p-8">
                <div className="flex items-center justify-between border-b hairline pb-6">
                  <div><p className="eyebrow">Run in progress</p><h2 className="mt-2 text-2xl font-semibold">Executing adversarial suite</h2></div>
                  <LoaderCircle className="animate-spin text-[var(--signal)]" />
                </div>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {input.scenarioIds.map((id, index) => {
                    const scenario = scenarios.find((item) => item.id === id);
                    return <motion.div key={id} initial={{ opacity: .2 }} animate={{ opacity: 1 }} transition={{ delay: index * .08 }} className="border hairline p-5"><span className="font-mono text-[10px] uppercase text-[#778075]">Scenario {String(index + 1).padStart(2, "0")}</span><strong className="mt-6 block">{scenario?.title}</strong><div className="mt-5 h-1 bg-[#2a2f2a]"><motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: .7, delay: index * .08 }} className="h-full bg-[var(--signal)]" /></div></motion.div>;
                  })}
                </div>
              </motion.div>
            ) : result ? (
              <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mb-5 flex justify-end"><button onClick={() => setResult(null)} className="btn-secondary !min-h-10"><RotateCcw size={15} /> New run</button></div>
                <ReportView result={result} />
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel grid min-h-[680px] place-items-center p-8 text-center">
                <div className="max-w-md">
                  <div className="mx-auto grid size-20 place-items-center border hairline bg-[#111511]"><FlaskConical className="text-[var(--signal)]" size={30} /></div>
                  <h2 className="mt-7 text-3xl font-semibold">Configure the agent, then break it safely.</h2>
                  <p className="copy mt-4">The demo runner uses deterministic simulation logic so results are reproducible. A production connector would replace the emulated agent response with your HTTP or MCP endpoint.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}
