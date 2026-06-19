import { ConnectorPairing } from "@/components/connector-pairing";

export const metadata = {
  title: "Connect Agent Runner",
  description: "Pair a customer-controlled AgentProof runner without uploading source code or production credentials.",
};

export default function ConnectorsPage() {
  return (
    <main className="min-h-screen py-12">
      <div className="shell">
        <p className="eyebrow">Customer-controlled execution</p>
        <div className="mt-5 grid gap-6 border-b hairline pb-10 lg:grid-cols-[1fr_.7fr] lg:items-end">
          <div>
            <h1 className="text-4xl font-semibold sm:text-6xl">Connect Agent Runner</h1>
            <p className="copy mt-5 max-w-3xl">
              Run AgentProof jobs inside your own environment. The runner pulls outbound, returns signed evidence, and never gives AgentProof direct access to internal systems.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            {["Outbound only", "Signed evidence", "Replay blocked"].map((label) => (
              <div key={label} className="border hairline px-3 py-4 text-[#aeb6ac]">{label}</div>
            ))}
          </div>
        </div>
        <div className="py-10">
          <ConnectorPairing />
        </div>
      </div>
    </main>
  );
}
