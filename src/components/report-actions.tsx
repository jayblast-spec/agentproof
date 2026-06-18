"use client";

import { Download, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

export function ReportActions() {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        className="btn-secondary"
        onClick={() => router.push("/lab")}
      >
        <RotateCcw size={16} />
        Reset to new test
      </button>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => window.print()}
      >
        <Download size={16} />
        Save report
      </button>
    </div>
  );
}
