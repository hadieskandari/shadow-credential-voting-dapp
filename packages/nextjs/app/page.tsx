import { Theme } from "@radix-ui/themes";
import CreateQuestion from "./components/CreateQuestion";
import Events from "./components/Events";
import { GlobalPolyfill } from "./components/GlobalPolyfill";
import Navbar from "./components/Navbar";
import Link from "next/link";

export default function Home() {
  return (
    <Theme
      accentColor="yellow"
      grayColor="sand"
      radius="small"
      scaling="100%"
      appearance="dark"
      className="bg-transparent"
      style={{ background: "transparent" }}
    >
      <GlobalPolyfill />
      <div className="relative min-h-screen">
        <div className="relative z-10 flex flex-col items-center px-4">
          <div className="navbar mb-16 w-full max-w-6xl">
            <Navbar />
          </div>
          <div className="w-full max-w-6xl space-y-16 pb-12">
            <section className="rounded-[40px] border border-white/10 bg-black/70 p-10 text-center text-white space-y-6 shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
              <p className="text-xs uppercase tracking-[0.45em] text-[#ffd208]/80">Shadow · powered by Zama</p>
              <h1 className="text-4xl md:text-[46px] font-semibold leading-tight max-w-4xl mx-auto">
                Confidential tallies you can share, prove,{" "}
                <span className="bg-gradient-to-r from-[#ffd208] via-[#ffb347] to-white bg-clip-text text-transparent">
                  and never leak
                </span>
              </h1>
              <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto">
                FHE keeps every ballot encrypted on-chain. Only when the creator triggers reveal do the tallies decrypt,
                with proofs the chain can verify. Voters stay anonymous, tallies stay auditable.
              </p>
              <div className="pt-2">
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-3 rounded-full bg-[#ffd208] px-6 py-3 text-black font-semibold shadow-[0_12px_40px_rgba(255,210,8,0.35)]"
                >
                  Discover Public Votes
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14" />
                    <path d="M13 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </section>
            <CreateQuestion />
            <Events />
          </div>
        </div>
      </div>
    </Theme>
  );
}
