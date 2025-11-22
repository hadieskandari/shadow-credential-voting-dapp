"use client";

import { useSearchParams } from "next/navigation";
import { Theme, Text, Flex, Box, Button } from "@radix-ui/themes";
import { GlobalPolyfill } from "../components/GlobalPolyfill";
import Navbar from "../components/Navbar";
import ShareButtons from "../components/ShareButtons";
import Silk from "../components/silk";
import { useVoting } from "../hooks/useVoting";
import { useEffect, useState, useMemo, useCallback, Suspense } from "react";

const ASH_SILK = {
  color: "#a3a3a3",
  background: "#bebebe",
  speed: 5.5,
  scale: 1,
  noiseIntensity: 1.3,
  rotation: -0.1,
};

const SectionCard = ({
  title,
  subtitle,
  children,
  className = "",
  refreshSlot,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  refreshSlot?: React.ReactNode;
}) => (
  <div className={`rounded-[32px] border border-white/10 bg-black/70 p-6 text-white space-y-4 relative ${className}`}>
    {refreshSlot}
    <div className="space-y-3">
      <Text size="4" weight="bold">
        {title}
      </Text>
      {subtitle && (
        <Text size="2" color="gray">
          {subtitle}
        </Text>
      )}
    </div>
    {children}
  </div>
);

const ActionButton = ({
  children,
  variant = "ghost",
  disabled,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  variant?: "ghost" | "primary";
  disabled: boolean;
  onClick?: () => void;
  className?: string;
}) => {
  const base =
    "rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center";
  const enabled =
    variant === "primary"
      ? "bg-gradient-to-r from-[#ffd208] to-[#ffb347] text-black shadow-[0_10px_30px_rgba(255,210,8,0.25)] hover:shadow-[0_12px_40px_rgba(255,210,8,0.35)]"
      : "border border-white/15 text-white hover:border-white/40";
  const disabledStyles = "opacity-40 cursor-not-allowed border border-white/10 text-gray-500";
  return (
    <button
      className={`${base} min-w-[120px] ${disabled ? disabledStyles : enabled} ${className}`}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </button>
  );
};

const ResultsContent = () => {
  const params = useSearchParams();
  const questionId = Number(params.get("questionId"));
  const { getQuestion, openResults, publishResults } = useVoting();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [question, setQuestion] = useState<any>(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  const loadQuestion = useCallback(async () => {
    if (Number.isNaN(questionId)) {
      setError("Missing questionId in query params.");
      setQuestion(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
        const data = await getQuestion(questionId);
      setQuestion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load question");
    } finally {
      setLoading(false);
    }
  }, [getQuestion, questionId]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const decryptedTallies = question?.decryptedTally ?? [0, 0];
  const totalVotes = decryptedTallies[0] + decryptedTallies[1];
  const timeline = useMemo(() => {
    if (!question) return [];
    const events: { label: string; value: string }[] = [
      { label: "Deadline", value: new Date(question.deadline * 1000).toLocaleString() },
    ];
    if (question.resultsOpened) events.push({ label: "Encrypted tally revealed", value: "Submitted to relayer" });
    if (question.resultsFinalized) events.push({ label: "Published", value: "Proof verified on-chain" });
    return events;
  }, [question]);

  const isPrivate = question?.question?.startsWith("🔒");
  const shareText = useMemo(() => {
    if (!question) return "";
    if (!question.resultsFinalized) return `Encrypted tally for "${question.question.replace("🔒 ", "")}" remains locked.`;
    return `Clear tally for "${question.question.replace("🔒 ", "")}": ${question.decryptedTally[0]} vs ${question.decryptedTally[1]}. Verified with Zama FHEVM.`;
  }, [question]);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/results?questionId=${questionId}` : "";
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    } catch {
      // ignore
    }
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
        <div className="relative z-10 flex flex-col items-center px-4">
          <div className="navbar mb-12 w-full max-w-7xl">
            <Navbar />
          </div>
          <div className="w-full max-w-7xl space-y-8 pb-16">
            <section className="rounded-[40px] border border-white/10 bg-black/70 p-10 text-center text-white space-y-6 shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
              <p className="text-xs uppercase tracking-[0.45em] text-[#ffd208]/80">Reveal console</p>
              <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
                Decrypt tallies with{" "}
                <span className="bg-gradient-to-r from-[#ffd208] via-[#ffb347] to-white bg-clip-text text-transparent">
                  verifiable proofs
                </span>
              </h1>
              <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto">
                Use the console below to trigger public decrypt and publish the cleartext results once the deadline
                passes. Every step emits on-chain events for full auditability.
              </p>
            </section>

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-12 text-center text-white/70">
                Loading…
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-12 text-center text-red-100">
                {error}
              </div>
            ) : !question ? (
              <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-12 text-center text-white/70">
                Question not found.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <SectionCard
                  title={`Question #${questionId}`}
                  subtitle="Encrypted tallies stay hidden until you trigger reveal."
                  refreshSlot={
                    <button
                      onClick={loadQuestion}
                      className="absolute top-4 right-4 h-10 w-10 rounded-full bg-[#ffd208] text-black flex items-center justify-center shadow-[0_10px_30px_rgba(255,210,8,0.25)] transition hover:shadow-[0_12px_40px_rgba(255,210,8,0.35)] active:scale-95"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7.5-4" />
                        <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7.5 4" />
                        <path d="M3 3v6h6" />
                        <path d="M21 21v-6h-6" />
                      </svg>
                    </button>
                  }
                >
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-4">
                    {question.possibleAnswers.map((label: string, idx: number) => {
                      const votes = decryptedTallies[idx] ?? 0;
                      const percent = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
                      return (
                        <div key={label} className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>{label}</span>
                            <span>
                              {question.resultsFinalized
                                ? `${votes} vote${votes === 1 ? "" : "s"} (${percent}%)`
                                : question.resultsOpened
                                  ? "Ready to publish"
                                  : "Encrypted"}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-black/40 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#ffd208] to-white transition-all duration-300"
                              style={{ width: question.resultsFinalized ? `${percent}%` : "0%" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-3 items-center">
                    <ActionButton
                      variant="primary"
                      disabled={
                        revealLoading ||
                        question.resultsOpened ||
                        Date.now() / 1000 < question.deadline
                      }
                      onClick={async () => {
                        try {
                          setRevealLoading(true);
                          await openResults(questionId);
                          await loadQuestion();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Failed to reveal tallies");
                        } finally {
                          setRevealLoading(false);
                        }
                      }}
                    >
                      {question.resultsOpened ? "Tallies revealed" : revealLoading ? "Revealing…" : "Reveal encrypted tally"}
                    </ActionButton>
                    <ActionButton
                      disabled={publishLoading || !question.resultsOpened || question.resultsFinalized}
                      onClick={async () => {
                        try {
                          setPublishLoading(true);
                          await publishResults(questionId);
                          await loadQuestion();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Failed to publish results");
                        } finally {
                          setPublishLoading(false);
                        }
                      }}
                    >
                      {question.resultsFinalized ? "Results published" : publishLoading ? "Submitting…" : "Publish decrypted tally"}
                    </ActionButton>
                  </div>
                  <div className="flex justify-end gap-2 pt-3">
                    {isPrivate ? (
                      <ActionButton variant="ghost" disabled={!question} onClick={handleCopy}>
                        Copy summary
                      </ActionButton>
                    ) : (
                      <ShareButtons
                        onShareX={() => window.open(tweetUrl, "_blank")}
                        onShareFarcaster={() => window.open(warpcastUrl, "_blank")}
                        className="justify-end"
                      />
                    )}
                  </div>
                </SectionCard>

                <div className="space-y-6">
                  <SectionCard title="Timeline" subtitle="Track each milestone for this poll.">
                    <div className="space-y-4">
                      {timeline.map(event => (
                        <div key={event.label} className="flex justify-between text-sm text-gray-300">
                          <span>{event.label}</span>
                          <span className="text-white">{event.value}</span>
                        </div>
                      ))}
                      {!timeline.length && <p className="text-sm text-gray-400">Awaiting deadline…</p>}
                    </div>
                  </SectionCard>
                  <SectionCard title="Audit trail" subtitle="Handles and proofs bound to this poll.">
                    <div className="space-y-2 text-xs text-gray-400">
                      {question.encryptedTally?.map((handle: string, idx: number) => (
                        <div key={`${handle}-${idx}`} className="flex justify-between">
                          <span>Handle #{idx + 1}</span>
                          <span className="text-white">{handle.slice(0, 10)}…{handle.slice(-6)}</span>
                        </div>
                      ))}
                      <p className="text-xs text-gray-500">
                        Proofs are fetched from the relayer when you publish; the contract verifies signatures before accepting.
                      </p>
                    </div>
                  </SectionCard>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Theme>
  );
};

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-white/70 bg-black">
          Loading results…
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
