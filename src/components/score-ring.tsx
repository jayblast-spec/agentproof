export function ScoreRing({ score }: { score: number }) {
  return (
    <div className="score-ring" style={{ "--score": score } as React.CSSProperties}>
      <div className="text-center">
        <strong className="block font-mono text-4xl">{score}</strong>
        <span className="text-[10px] uppercase tracking-[.14em] text-[#8e978c]">Readiness</span>
      </div>
    </div>
  );
}
