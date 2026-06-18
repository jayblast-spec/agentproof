"use client";

import { Download, RotateCcw } from "lucide-react";

export function ReportActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        className="btn-secondary"
        onClick={() => window.location.assign(`/lab?fresh=${Date.now()}`)}
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
