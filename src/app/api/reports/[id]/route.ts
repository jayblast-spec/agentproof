import { NextResponse } from "next/server";
import { getReportById, hashReport } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getReportById(id);
  if (!row) {
    return NextResponse.json({ error: "Report not found or persistence not configured." }, { status: 404 });
  }
  const recomputedHash = hashReport(row.report);
  return NextResponse.json({
    id: row.id,
    createdAt: row.created_at,
    mode: row.mode,
    agentName: row.agent_name,
    score: row.score,
    readiness: row.readiness,
    integrityVerified: recomputedHash === row.sha256,
    report: row.report,
  });
}
