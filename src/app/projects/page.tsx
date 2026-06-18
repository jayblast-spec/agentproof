"use client";

import Link from "next/link";
import { ArrowRight, FolderKanban, History } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";
import type { SimulationResult } from "@/lib/types";

function subscribe() {
  return () => undefined;
}

function getSnapshot() {
  return localStorage.getItem("agentproof-runs") ?? "[]";
}

function getServerSnapshot() {
  return "[]";
}

export default function ProjectsPage() {
  const storedRuns = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const runs = useMemo<SimulationResult[]>(() => JSON.parse(storedRuns), [storedRuns]);

  return (
    <main className="min-h-screen">
      <section className="border-b hairline py-16">
        <div className="shell">
          <p className="eyebrow">Regression workspace</p>
          <h1 className="mt-5 text-4xl font-semibold sm:text-6xl">Saved readiness runs</h1>
          <p className="copy mt-5 max-w-2xl">Every lab execution is stored locally for comparison. Production workspaces would persist encrypted runs and private scenario libraries.</p>
        </div>
      </section>
      <section className="shell py-12">
        {runs.length === 0 ? (
          <div className="panel grid min-h-96 place-items-center p-8 text-center">
            <div className="max-w-md">
              <FolderKanban className="mx-auto text-[var(--signal)]" size={34} />
              <h2 className="mt-6 text-2xl font-semibold">No simulation history yet</h2>
              <p className="copy mt-3">Run the lab once to create a baseline for model, prompt, and policy regression.</p>
              <Link href="/lab" className="btn-primary mt-7">Open test lab <ArrowRight size={16} /></Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {runs.map((run, index) => {
              const previous = runs[index + 1];
              const delta = previous ? run.score - previous.score : 0;
              return (
                <article key={`${run.id}-${index}`} className="panel grid gap-6 p-6 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
                  <div>
                    <div className="flex items-center gap-3"><History size={16} className="text-[var(--signal)]" /><span className="eyebrow">{run.input.promptVersion} / {run.input.model}</span></div>
                    <h2 className="mt-3 text-xl font-semibold">{run.input.agentName}</h2>
                    <p className="mt-2 text-sm text-[#8d968b]">{run.totalRuns.toLocaleString()} trials · {new Date(run.createdAt).toLocaleString()}</p>
                  </div>
                  <div><span className="text-xs text-[#858e83]">Readiness</span><strong className="mt-1 block font-mono text-3xl">{run.score}</strong></div>
                  <div><span className="text-xs text-[#858e83]">Unsafe</span><strong className="mt-1 block font-mono text-2xl">{run.unsafeActions}</strong></div>
                  <div className={delta >= 0 ? "text-[var(--signal)]" : "text-[var(--red)]"}>{previous ? `${delta >= 0 ? "+" : ""}${delta} vs prior` : "Baseline"}</div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
