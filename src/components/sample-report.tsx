"use client";

import Link from "next/link";
import { Download, FlaskConical, RotateCcw } from "lucide-react";
import { useState } from "react";
import { ReportView } from "@/components/report-view";
import type { SimulationResult } from "@/lib/types";

export function SampleReport({ result }: { result: SimulationResult }) {
  const [report, setReport] = useState<SimulationResult | null>(result);

  if (!report) {
    return (
      <section className="panel grid min-h-[420px] place-items-center p-8 text-center">
        <div className="max-w-md">
          <div className="mx-auto grid size-16 place-items-center border hairline bg-[#111511]">
            <FlaskConical className="text-[var(--signal)]" size={25} />
          </div>
          <p className="eyebrow mt-6">Report reset</p>
          <h2 className="mt-3 text-3xl font-semibold">No test result loaded</h2>
          <p className="copy mt-4">The previous sample run has been cleared from this view.</p>
          <Link href="/lab?fresh=1" className="btn-primary mt-7">
            Start a new test
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={() => setReport(null)}>
          <RotateCcw size={16} />
          Reset report
        </button>
        <button type="button" className="btn-secondary" onClick={() => window.print()}>
          <Download size={16} />
          Save report
        </button>
      </div>
      <ReportView result={report} />
    </>
  );
}
