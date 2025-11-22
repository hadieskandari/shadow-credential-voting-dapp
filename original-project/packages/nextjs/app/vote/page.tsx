"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Flex, Text, Theme } from "@radix-ui/themes";
import Navbar from "../components/Navbar";
import Voting from "../components/Voting";
import Silk from "../components/silk";
import { GlobalPolyfill } from "../components/GlobalPolyfill";
import { notification } from "../../utils/helper/notification";

const ASH_SILK = {
  color: "#a3a3a3",
  background: "#bebebe",
  speed: 5.5,
  scale: 1,
  noiseIntensity: 1.3,
  rotation: -0.1,
};

const VotePage = () => {
  const [questionId, setQuestionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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
    <Theme accentColor="yellow" grayColor="sand" radius="small" scaling="100%" appearance="dark">
      <GlobalPolyfill />
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: ASH_SILK.background }}>
          <Silk
            speed={ASH_SILK.speed}
            scale={ASH_SILK.scale}
            color={ASH_SILK.color}
            noiseIntensity={ASH_SILK.noiseIntensity}
            rotation={ASH_SILK.rotation}
          />
        </div>

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
                  Ballots encrypt in-browser with Zama’s FHE runtime. Votes stay opaque end-to-end; only after reveal do tallies decrypt with proofs and anchor on-chain.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-3 rounded-full bg-gradient-to-br from-[#ffd208] via-[#ffda42] to-[#f5c400] px-5 py-2.5 text-black font-semibold border border-[#ffd208]/60 shadow-[0_14px_30px_rgba(255,210,8,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(255,210,8,0.55)] active:translate-y-0.5"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                    Create a Vote
                  </Link>
                  <Link
                    href="/discover"
                    className="inline-flex items-center gap-3 rounded-full bg-gradient-to-br from-[#0b0b0b] via-[#131313] to-[#0b0b0b] px-5 py-2.5 text-white font-semibold border border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(0,0,0,0.7)] active:translate-y-0.5"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11.5" cy="11.5" r="7.5" />
                      <path d="m16 16 4 4" />
                    </svg>
                    Discover Polls
                  </Link>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
                  <button
                    onClick={() => notification.success("Success toast sample")}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#ffd208] via-[#ffda42] to-[#f5c400] px-4 py-2 text-black font-semibold border border-[#ffd208]/60 shadow-[0_10px_26px_rgba(255,210,8,0.45)] transition hover:-translate-y-0.5"
                  >
                    Test Success
                  </button>
                  <button
                    onClick={() => notification.error("Error toast sample")}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#0b0b0b] via-[#131313] to-[#0b0b0b] px-4 py-2 text-white font-semibold border border-white/15 shadow-[0_10px_26px_rgba(0,0,0,0.6)] transition hover:-translate-y-0.5"
                  >
                    Test Error
                  </button>
                  <button
                    onClick={() => notification.loading("Loading toast sample…", { duration: 6000 })}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#111] via-[#191919] to-[#111] px-4 py-2 text-white font-semibold border border-white/12 shadow-[0_10px_26px_rgba(0,0,0,0.6)] transition hover:-translate-y-0.5"
                  >
                    Test Loading
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full max-w-7xl mt-10 mb-16">{renderState()}</section>
        </div>
      </div>
    </Theme>
  );
};

export default VotePage;
