"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlobalPolyfill } from "../components/GlobalPolyfill";
import Navbar from "../components/Navbar";
import Voting from "../components/Voting";
import { Card, Text, Theme } from "@radix-ui/themes";
import { ArrowDown, ShieldCheck, Stamp, Wallet2 } from "lucide-react";

const VotePage = () => {
  const [questionId, setQuestionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [guideMounted, setGuideMounted] = useState(false);

  const guideSteps = [
    {
      title: "Connect & fund",
      description: (
        <>
          Connect your wallet and make sure it holds a little Sepolia ETH.{" "}
          <a
            href="https://faucet.quicknode.com/ethereum/sepolia"
            target="_blank"
            rel="noreferrer"
            className="text-[#ffd208] underline underline-offset-2"
          >
            Grab some from the faucet
          </a>{" "}
          if you need a top-up.
        </>
      ),
      icon: <Wallet2 className="h-6 w-6" />,
    },
    {
      title: "Choose your poll",
      description:
        "Pick a public vote below or paste the private link you received. Every choice encrypts locally before it ever touches the network.",
      icon: <ShieldCheck className="h-6 w-6" />,
    },
    {
      title: "Submit & wait",
      description:
        "Confirm the transaction, watch for the success toast, and let the tally remain hidden until the creator opens results.",
      icon: <Stamp className="h-6 w-6" />,
    },
  ];

  const openGuide = () => {
    if (guideMounted) {
      setShowGuide(true);
      return;
    }
    setGuideMounted(true);
    requestAnimationFrame(() => setShowGuide(true));
  };

  const closeGuide = () => {
    setShowGuide(false);
    setTimeout(() => setGuideMounted(false), 320);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("questionId"));
    if (!Number.isNaN(id) && id >= 0) {
      setQuestionId(id);
    } else {
      setQuestionId(null);
    }
    setLoading(false);
  }, []);

  const renderState = () => {
    if (loading) {
      return (
        <Card className="bg-black/50 border border-white/10 text-center py-12">
          <Text size="3">Loading question...</Text>
        </Card>
      );
    }

    if (questionId === null) {
      return (
        <Card className="bg-black/50 border border-white/10 text-center py-12">
          <Text size="3">Sorry! No question found. Provide a valid questionId in the URL.</Text>
        </Card>
      );
    }

    return <Voting questionId={questionId} primary />;
  };

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
        <div className="relative z-10 flex flex-col items-center px-4 text-white">
          <div className="navbar mb-12 w-full max-w-7xl">
            <Navbar />
          </div>

          <section className="w-full max-w-6xl">
            <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br from-[#050505]/94 via-[#0a0a0a]/94 to-[#050505]/94 px-4 py-4 shadow-[0_14px_50px_rgba(0,0,0,0.55)] sm:px-5 sm:py-5">
              <div
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                  background:
                    "radial-gradient(circle at 20% 18%, rgba(255,210,8,0.18), transparent 40%), radial-gradient(circle at 78% 20%, rgba(255,210,8,0.12), transparent 38%), radial-gradient(circle at 60% 80%, rgba(255,255,255,0.05), transparent 42%)",
                  filter: "blur(16px)",
                }}
              />
              <div className="relative flex flex-col items-center text-center gap-2.5 py-2 sm:py-3">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-[#ffd208]">
                  Shadow <span className="h-1.5 w-1.5 rounded-full bg-[#ffd208]" /> Powered by Zama FHE
                </p>
                <h1 className="text-[21px] sm:text-[25px] md:text-[28px] font-semibold leading-tight max-w-2xl">
                  Cast privately; reveal tallies with on-chain proofs only when you choose
                </h1>
                <p className="text-sm sm:text-base text-gray-200 max-w-2xl leading-relaxed">
                  Ballots encrypt in-browser with Zama’s FHE runtime. Votes stay opaque end-to-end; only after reveal do
                  tallies decrypt with proofs and anchor on-chain.
                </p>
                <div className="mt-1 flex w-full flex-col items-center gap-3">
                  <div className="flex w-full flex-row flex-wrap items-center justify-center gap-3 sm:flex-nowrap">
                    <Link
                      href="/"
                      className="inline-flex flex-1 min-w-[45%] items-center justify-center gap-3 rounded-full bg-gradient-to-br from-[#ffd208] via-[#ffda42] to-[#f5c400] px-5 py-2.5 text-black font-semibold border border-[#ffd208]/60 shadow-[0_14px_30px_rgba(255,210,8,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(255,210,8,0.55)] active:translate-y-0.5 sm:flex-none sm:w-auto"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                      Create a Vote
                    </Link>
                    <Link
                      href="/discover"
                      className="inline-flex flex-1 min-w-[45%] items-center justify-center gap-3 rounded-full bg-gradient-to-br from-[#0b0b0b] via-[#131313] to-[#0b0b0b] px-5 py-2.5 text-white font-semibold border border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(0,0,0,0.7)] active:translate-y-0.5 sm:flex-none sm:w-auto"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11.5" cy="11.5" r="7.5" />
                        <path d="m16 16 4 4" />
                      </svg>
                      Discover Polls
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={openGuide}
                    className="text-sm font-semibold text-[#ffd208] underline underline-offset-4 transition hover:text-white"
                  >
                    How to vote?
                  </button>
                </div>
              </div>
            </div>
          </section>
          <section className="w-full max-w-7xl mt-2 mb-16 mx-0">{renderState()}</section>
        </div>
      </div>
      {guideMounted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-0">
          <div
            className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${showGuide ? "opacity-100" : "opacity-0"}`}
            onClick={closeGuide}
          />
          <div
            className={`relative z-10 w-full max-w-xl rounded-[32px] border border-white/10 bg-[#060606]/95 p-5 text-white shadow-[0_32px_100px_rgba(0,0,0,0.6)] transition-all duration-300 ${showGuide ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95"}`}
          >
            <button
              type="button"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#ffd208] text-black shadow-[0_12px_26px_rgba(255,210,8,0.45)] transition hover:shadow-[0_16px_32px_rgba(255,210,8,0.55)]"
              onClick={closeGuide}
              aria-label="Close voting guide"
            >
              ✕
            </button>
            <p className="text-[11px] uppercase tracking-[0.4em] text-[#ffd208]/80">Shadow walkthrough</p>
            <h3 className="mt-2 text-xl font-semibold">How to cast a confidential vote</h3>
            <div className="mt-4 grid gap-4">
              {guideSteps.map((step, index) => (
                <div key={step.title} className="space-y-3">
                  <div className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-3 text-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#ffd208]">
                      {step.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-gray-400">
                        Step {index + 1}
                      </p>
                      <h4 className="text-base font-semibold text-white">{step.title}</h4>
                      <p className="text-sm text-gray-200 leading-snug">{step.description}</p>
                    </div>
                  </div>
                  {index < guideSteps.length - 1 && (
                    <div className="flex items-center justify-center text-[#ffd208]/80">
                      <ArrowDown className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Theme>
  );
};

export default VotePage;
