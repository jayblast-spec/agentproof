import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReportActions } from "@/components/report-actions";
import { ReportView } from "@/components/report-view";
import { sampleResult } from "@/lib/simulation";

export default function SampleReportPage() {
  return (
    <main className="min-h-screen py-12">
      <div className="shell">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#929b90] hover:text-white"><ArrowLeft size={15} /> Back to product</Link>
            <p className="eyebrow mt-7">Public sample report</p>
            <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Production readiness evidence</h1>
          </div>
          <ReportActions />
        </div>
        <ReportView result={sampleResult} />
      </div>
    </main>
  );
}
