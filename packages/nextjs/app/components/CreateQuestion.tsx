"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVoting } from "../hooks/useVoting";
import { GlowButton } from "@/components/ui/glow-button";
import { Input } from "@/components/ui/input";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { CalendarClock, Clock3, Copy, Eye, Link2 } from "lucide-react";
import { useAccount, usePublicClient } from "wagmi";
import { simpleVotingAbi } from "~~/contracts/abis/simpleVotingAbi";
import { notification } from "~~/utils/helper/notification";
import { questionIdMapper } from "~~/utils/helper/questionIdMapper";

interface QuestionSummary {
  id: number;
  question?: string;
  createdBy?: string;
  possibleAnswers?: [string, string];
  image?: string;
  deadline?: number;
  resultsOpened?: boolean;
  encryptedTally?: [string, string];
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;
const MIN_DURATION_SECONDS = 15 * 60;
const CARD_BATCH_SIZE = 4;
const FALLBACK_IMAGES = ["/shadow-logo.png"];

const toDateTimeLocal = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const getDefaultDeadlineInput = () => toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000));
const pickFallbackImage = (index: number) => FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

export const CreateQuestion = () => {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const publicClient = usePublicClient();
  const { createQuestion, getQuestion, questionsCount, refetchQuestionsCount } = useVoting();
  const [shareBase, setShareBase] = useState("");

  const [question, setQuestion] = useState("");
  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [image, setImage] = useState("");
  const [pollType, setPollType] = useState<"public" | "private">("public");
  const [deadlineInput, setDeadlineInput] = useState(getDefaultDeadlineInput);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [userQuestions, setUserQuestions] = useState<QuestionSummary[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(CARD_BATCH_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const resolvedCount = useMemo(() => questionsCount ?? 0, [questionsCount]);

  const fetchUserQuestions = useCallback(async () => {
    if (!address) {
      setUserQuestions([]);
      return;
    }
    try {
      let count = resolvedCount;
      if (publicClient && CONTRACT_ADDRESS) {
        try {
          const onChainCount = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: simpleVotingAbi,
            functionName: "getQuestionsCount",
          });
          if (typeof onChainCount === "bigint") count = Number(onChainCount);
        } catch (readErr) {
          console.warn("Unable to read question count from chain", readErr);
        }
      }
      if (!count) {
        setUserQuestions([]);
        return;
      }
      const entries: QuestionSummary[] = [];
      for (let i = 0; i < count; i++) {
        const data = await getQuestion(i);
        if (data && data.createdBy.toLowerCase() === address.toLowerCase()) {
          entries.push({ ...data, id: i });
        }
      }
      setUserQuestions(entries);
    } catch (err) {
      console.error("Error fetching user questions", err);
      setUserQuestions([]);
    }
  }, [address, getQuestion, publicClient, resolvedCount]);

  useEffect(() => {
    fetchUserQuestions();
    if (typeof window !== "undefined") {
      setShareBase(window.location.origin);
    }
  }, [fetchUserQuestions]);

  const sortedUserQuestions = useMemo(() => [...userQuestions].sort((a, b) => b.id - a.id), [userQuestions]);
  const visibleQuestions = useMemo(
    () => sortedUserQuestions.slice(0, visibleCount),
    [sortedUserQuestions, visibleCount],
  );

  useEffect(() => {
    if (!sortedUserQuestions.length) {
      setVisibleCount(0);
      return;
    }
    setVisibleCount(prev => {
      if (!prev) return Math.min(CARD_BATCH_SIZE, sortedUserQuestions.length);
      return Math.min(Math.max(prev, CARD_BATCH_SIZE), sortedUserQuestions.length);
    });
  }, [sortedUserQuestions.length]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    if (visibleCount >= sortedUserQuestions.length) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount(prev => Math.min(prev + CARD_BATCH_SIZE, sortedUserQuestions.length));
        }
      },
      { threshold: 1.0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visibleCount, sortedUserQuestions.length]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isConnected) {
      notification.info("Connect your wallet to publish a vote.");
      openConnectModal?.();
      return;
    }
    if (!question || !answer1 || !answer2) {
      setError("Please fill in all required fields");
      notification.warning("Question prompt and both answers are required.");
      return;
    }
    setLoading(true);
    setSuccess("");
    setError("");
    let toastId: string | undefined;
    try {
      if (!deadlineInput) {
        throw new Error("Please pick a voting deadline.");
      }
      const selectedDate = new Date(deadlineInput);
      if (Number.isNaN(selectedDate.getTime())) {
        throw new Error("Invalid deadline format.");
      }
      const nowSeconds = Math.floor(Date.now() / 1000);
      const deadline = Math.floor(selectedDate.getTime() / 1000);
      const windowSeconds = deadline - nowSeconds;
      if (windowSeconds < MIN_DURATION_SECONDS) {
        throw new Error("Deadline must be at least 15 minutes ahead.");
      }

      const metadataImage = image || pickFallbackImage(Date.now());
      const questionPayload = pollType === "public" ? question : `🔒 ${question}`;

      toastId = notification.loading("Encrypting and submitting your vote…");
      const hash = await createQuestion(questionPayload, answer1, answer2, metadataImage, deadline);
      setSuccess("Question confirmed on-chain!");
      notification.success("Vote published! Share it from your dashboard once confirmed.");
      setQuestion("");
      setAnswer1("");
      setAnswer2("");
      setImage("");
      setDeadlineInput(getDefaultDeadlineInput());
      await refetchQuestionsCount();
      await fetchUserQuestions();
      console.debug("Question created in tx", hash);
    } catch (err) {
      console.error("Error creating question", err);
      const message = err instanceof Error ? err.message : "Error creating question. Please try again.";
      setError(message);
      notification.error(message);
    } finally {
      setLoading(false);
      if (toastId) {
        notification.remove(toastId);
      }
    }
  };

  const copyLink = async (id: number) => {
    const randomId = questionIdMapper.getRandomId(id);
    const link = `${shareBase}/vote?questionId=${randomId}`;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        notification.success("Copied To Clipboard!");
      }
    } catch (err) {
      console.error("Failed to copy link", err);
      notification.error("Unable to copy the vote link. Please try again.");
    }
  };

  const soonestDeadlineInput = toDateTimeLocal(new Date(Date.now() + MIN_DURATION_SECONDS * 1000));

  const renderStatusPill = (entry: QuestionSummary) => {
    const now = Date.now() / 1000;
    const closed = entry.deadline ? entry.deadline < now : false;
    if (entry.resultsOpened) {
      return { label: "Results opened", className: "bg-emerald-400/20 text-emerald-200 border border-emerald-400/30" };
    }
    if (closed) {
      return { label: "Awaiting results", className: "bg-blue-400/20 text-blue-100 border border-blue-400/40" };
    }
    return { label: "Live", className: "bg-[#ffd208]/20 text-[#ffd208] border border-[#ffd208]/40" };
  };

  const handleDeadlineChange = (value: string) => {
    setDeadlineInput(value);
  };

  return (
    <section className="w-full px-4 pt-12 pb-4" id="create">
      <div className="relative mx-auto w-full max-w-6xl space-y-10 overflow-hidden rounded-[44px] border border-white/10 bg-[#050505]/95 p-6 sm:p-10 shadow-[0_40px_120px_rgba(0,0,0,0.65)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: "radial-gradient(circle at 15% -10%, rgba(255,210,8,0.4), transparent 55%)",
          }}
        />
        <div className="relative space-y-8">
          <header className="space-y-4 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-[#ffd208]/80 sm:tracking-[0.55em]">
              Zama · Confidential ballots
            </p>
            <h2 className="text-[30px] leading-[1.2] font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              Launch{" "}
              <span className="bg-gradient-to-r from-[#ffd208] via-[#ffb347] to-white bg-clip-text text-transparent">
                encrypted votes
              </span>{" "}
              in seconds
            </h2>
            <p className="mx-auto max-w-3xl text-sm text-gray-300 leading-relaxed sm:text-base md:text-lg">
              Define your prompt, curate two answers, and let the relayer + ACL automation keep tallies private until
              the deadline.
            </p>
          </header>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6">
              <label className="space-y-2 w-full">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">Question prompt</span>
                <Input
                  placeholder="Will privacy-preserving tech become the norm by 2026?"
                  value={question}
                  onChange={event => setQuestion(event.target.value)}
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPollType("public")}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    pollType === "public"
                      ? "border-[#ffd208]/50 bg-[#ffd208]/10 text-white"
                      : "border-white/10 bg-black/30 text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 0 20" />
                        <path d="M12 2a15.3 15.3 0 0 0 0 20" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Public board</p>
                      <p className="text-sm">Show on Discover. Anyone can vote privately.</p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPollType("private")}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    pollType === "private"
                      ? "border-[#ffd208]/50 bg-[#ffd208]/10 text-white"
                      : "border-white/10 bg-black/30 text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1l3 5.9L21 8l-4.5 4.4L17 17l-5-2.6L7 17l.5-4.6L3 8l6-.9L12 1z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Private tally</p>
                      <p className="text-sm">Hidden from Discover. Share the secure link.</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {[
                  { label: "Answer A", value: answer1, setter: setAnswer1 },
                  { label: "Answer B", value: answer2, setter: setAnswer2 },
                ].map(({ label, value, setter }) => (
                  <label key={label} className="space-y-2 w-full">
                    <span className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">{label}</span>
                    <Input
                      value={value}
                      onChange={event => setter(event.target.value)}
                      placeholder={label === "Answer A" ? "Yes" : "No"}
                      required
                    />
                  </label>
                ))}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <label className="space-y-2 w-full sm:w-1/2">
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
                    Voting deadline
                  </span>
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        ref={dateInputRef}
                        type="datetime-local"
                        min={soonestDeadlineInput}
                        value={deadlineInput}
                        onChange={event => handleDeadlineChange(event.target.value)}
                        placeholder="Pick a date"
                        className="flex h-14 w-full items-center rounded-2xl border border-white/10 bg-black/50 px-4 text-base text-white transition hover:border-[#ffd208]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd208]/40 appearance-none"
                        required
                      />
                      <Clock3 className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ffd208]" />
                    </div>
                    <p className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock3 className="h-4 w-4 text-[#ffd208]" />
                      Pick any time at least 15 minutes in the future. We convert it to on-chain seconds automatically.
                    </p>
                  </div>
                </label>
                <label className="space-y-2 w-full sm:w-1/2">
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
                    Image URL (optional)
                  </span>
                  <Input
                    type="url"
                    placeholder="https://"
                    value={image}
                    onChange={event => setImage(event.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-center">
              <GlowButton
                type="submit"
                disabled={loading}
                fullWidth
                className="!bg-[#ffd208] !text-black font-semibold hover:!bg-black hover:!text-[#ffd208]"
              >
                {loading ? "Publishing..." : "Publish Vote"}
              </GlowButton>
            </div>
          </form>

          {visibleQuestions.length > 0 && (
            <section className="space-y-5 rounded-[40px] border border-white/10 bg-black/40 p-5 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-3 text-center sm:text-left">
                <div>
                  <p className="text-xs uppercase tracking-[0.5em] text-gray-500">Your live votes</p>
                  <h3 className="text-2xl font-semibold text-white">Sorted by freshest deployments</h3>
                </div>
                <span className="text-sm text-gray-400">
                  Showing {visibleQuestions.length} of {sortedUserQuestions.length}
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {visibleQuestions.map((entry, index) => {
                  const status = renderStatusPill(entry);
                  const randomId = questionIdMapper.getRandomId(entry.id);
                  const link = `${shareBase}/vote?questionId=${randomId}`;
                  const cover = entry.image || pickFallbackImage(index);
                  const deadlineLabel = entry.deadline
                    ? new Date(entry.deadline * 1000).toLocaleString()
                    : "No deadline";

                  return (
                    <article
                      key={entry.id}
                      className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-black/70 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
                    >
                      <img
                        src={cover}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 hidden h-full w-full rounded-[32px] object-cover opacity-35 transition duration-500 group-hover:scale-105 sm:block"
                      />
                      <div className="relative z-10 flex h-full flex-col gap-4 rounded-[32px] bg-black/80 p-5 backdrop-blur-sm sm:bg-black/70">
                        <div className="space-y-1 text-left">
                          <p className="text-xs uppercase tracking-[0.45em] text-[#ffd208]/80">Question #{entry.id}</p>
                          <h4 className="text-lg font-semibold text-white">{entry.question}</h4>
                          <p className="text-sm text-gray-200">{entry.possibleAnswers?.join(" vs ")}</p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-200">
                          <CalendarClock className="h-4 w-4 text-[#ffd208]" />
                          <span>{deadlineLabel}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                            {status.label}
                          </span>
                          <span className="flex items-center gap-2 text-xs text-gray-300">
                            <Link2 className="h-3.5 w-3.5 text-[#ffd208]" />
                            <span className="max-w-[190px] truncate">{link}</span>
                          </span>
                        </div>

                        <div className="flex w-full flex-row gap-2">
                          <GlowButton
                            type="button"
                            onClick={() => copyLink(entry.id)}
                            fullWidth={false}
                            className="flex flex-1 items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm"
                          >
                            <Copy className="h-4 w-4" />
                            <span className="hidden sm:inline">
                              {copiedId === entry.id ? "Link copied" : "Copy link"}
                            </span>
                            <span className="sm:hidden">{copiedId === entry.id ? "Copied" : "Copy"}</span>
                          </GlowButton>
                          <GlowButton
                            type="button"
                            fullWidth={false}
                            className="flex flex-1 items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm"
                            onClick={() => window.open(link, "_blank")}
                          >
                            <Eye className="h-4 w-4" />
                            <span>View</span>
                          </GlowButton>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {visibleCount < sortedUserQuestions.length && (
                <div ref={loadMoreRef} className="flex flex-col items-center gap-2 py-4 text-sm text-gray-400">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#ffd208]" />
                  <p>Scroll for more votes</p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </section>
  );
};

export default CreateQuestion;
