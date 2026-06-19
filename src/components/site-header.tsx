"use client";

import Link from "next/link";
import { Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

const links = [
  ["Product", "/#product"],
  ["Method", "/#method"],
  ["Report", "/reports/sample"],
  ["Runs", "/projects"],
  ["Connectors", "/connectors"],
  ["Pricing", "/pricing"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b hairline bg-[#090b0a]/90 backdrop-blur-xl">
      <div className="shell flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="grid size-8 place-items-center bg-[var(--signal)] text-black">
            <ShieldCheck size={18} />
          </span>
          <span>AgentProof</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-[#aeb6ac] md:flex">
          {links.map(([label, href]) => (
            <Link key={label} href={href} className="hover:text-white">{label}</Link>
          ))}
          <Link href="/lab" className="btn-primary !min-h-10 !px-4">Open test lab</Link>
        </nav>
        <button
          className="grid size-11 place-items-center border hairline md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav className="shell grid gap-2 border-t hairline py-4 md:hidden">
          {links.map(([label, href]) => (
            <Link key={label} href={href} onClick={() => setOpen(false)} className="py-3 text-sm">
              {label}
            </Link>
          ))}
          <Link href="/lab" onClick={() => setOpen(false)} className="btn-primary mt-2">Open test lab</Link>
        </nav>
      )}
    </header>
  );
}
