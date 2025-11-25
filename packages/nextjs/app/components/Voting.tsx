"use client";

/* eslint-disable @next/next/no-img-element */
import { type ReactNode, useCallback, useEffect, useState } from "react";
import Head from "next/head";
import { notification } from "../../utils/helper/notification";
import { type Question, useVoting } from "../hooks/useVoting";
import ShareButtons from "./ShareButtons";
import VoteStats from "./VoteStats";
import { Box, Button, Text } from "@radix-ui/themes";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { SHARE_BANNER_IMAGE } from "~~/utils/helper/shareConfig";
import { buildShareCopy } from "~~/utils/helper/shareCopy";
import { questionIdMapper } from "~~/utils/helper/questionIdMapper";

interface VotingProps {
  questionId: number;
  primary?: boolean;
}

export const Voting = ({ questionId, primary = true }: VotingProps) => {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { getQuestion, vote, hasVoted, openResults, publishResults, fheStatus } = useVoting();

  const [loading, setLoading] = useState(false);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [votedFor, setVotedFor] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [questionData, setQuestionData] = useState<Question | null>(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [origin, setOrigin] = useState("");

  const refreshQuestion = useCallback(async () => {
    if (!questionId && questionId !== 0) return;
    const details = await getQuestion(questionId);
    setQuestionData(details);
    if (address) {
      const voted = await hasVoted(questionId, address);
      setUserHasVoted(voted);
      if (!voted) {
        setVotedFor(null);
      }
    }
  }, [address, getQuestion, hasVoted, questionId]);

  useEffect(() => {
    refreshQuestion();
    const interval = setInterval(() => {
      refreshQuestion();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshQuestion]);

  useEffect(() => {
    if (!address) {
      setUserHasVoted(false);
      setVotedFor(null);
    }
  }, [address]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOrigin(window.location.origin);
  }, []);

  const handleVote = async (answerIndex: number) => {
    if (!isConnected) {
      notification.info("Connect your wallet to submit a vote.");
      openConnectModal?.();
      return;
    }
    const loadingToast = notification.loading("Submitting encrypted vote…");
    setLoading(true);
    setError("");
    try {
      await vote(questionId, answerIndex);
      setVotedFor(answerIndex);
      setUserHasVoted(true);
      notification.success("Vote recorded privately.");
      await refreshQuestion();
    } catch (err) {
      console.error("Error voting", err);
      setError(err instanceof Error ? err.message : "Failed to vote. Please try again.");
      notification.error(err instanceof Error ? err.message : "Failed to vote. Please try again.");
    } finally {
      if (loadingToast) {
        notification.remove(loadingToast);
      }
      setLoading(false);
    }
  };

  const fallbackImage = "/shadow-logo.png";

  if (!questionData) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-12 text-center text-white/70">
        Loading Poll . . .
      </div>
    );
  }

  const deadlinePassed = questionData ? Date.now() / 1000 >= questionData.deadline : false;
  const decryptedTallies = questionData?.decryptedTally ?? [0, 0];
  const totalVotes = decryptedTallies[0] + decryptedTallies[1];
  const noVotesSubmitted = totalVotes === 0;
  const showTallies = Boolean(questionData?.resultsOpened || questionData?.resultsFinalized);
  const canPublishResults = Boolean(questionData?.resultsOpened && !questionData?.resultsFinalized);
  const isPrivatePoll = questionData.question.startsWith("🔒");
  const statusLabel = (() => {
    if (questionData.resultsFinalized) return "Published";
    if (noVotesSubmitted && deadlinePassed) return "No Votes Submitted";
    if (questionData.resultsOpened) return "Awaiting publish";
    return deadlinePassed ? "Ended" : "Live";
  })();

  const handleShare = (platform: "x" | "farcaster") => () => {
    if (typeof window === "undefined") return;
    const randomId = questionIdMapper.getRandomId(questionId);
    const voteUrl = `${window.location.origin}/vote?questionId=${randomId}`;
    const displayQuestion = questionData ? questionData.question.replace(/^🔒\s*/, "") : "";
    const shareCopy = buildShareCopy({
      prompt: displayQuestion,
      deadline: questionData.deadline,
      isPrivate: isPrivatePoll,
      resultsOpened: questionData.resultsOpened,
      resultsFinalized: questionData.resultsFinalized,
      userHasVoted,
      context: "voting",
    });
    const encodedText = encodeURIComponent(shareCopy);
    const encodedUrl = encodeURIComponent(voteUrl);
    const link =
      platform === "x"
        ? `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
        : `https://warpcast.com/~/compose?text=${encodedText}`;
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const wrapperClass = primary
    ? "rounded-[30px] bg-gradient-to-br from-[#0b0b0b]/96 via-[#0a0a0a]/94 to-[#080808]/92 border border-white/10 shadow-[0_22px_45px_rgba(0,0,0,0.6)] p-4 md:p-5 transition duration-500 hover:border-white/20"
    : "rounded-[28px] bg-gradient-to-br from-[#0b0b0b]/94 to-[#090909]/90 border border-white/10 p-4 transition duration-500 hover:border-white/20";

  const displayQuestion = questionData ? questionData.question.replace(/^🔒\s*/, "") : "";
  const featureImage = questionData?.image?.trim() ? questionData.image : fallbackImage;
  const creatorAvatar = questionData?.image?.trim() ? questionData.image : "/shadow-logo.png";
  const shareImagePath =
    questionData?.image?.trim() && questionData.image.startsWith("http")
      ? questionData.image
      : questionData?.image?.trim() && origin
        ? `${origin}${questionData.image}`
        : SHARE_BANNER_IMAGE;
  const absoluteShareImage = shareImagePath || SHARE_BANNER_IMAGE;
  const shareTitle = `Vote on "${displayQuestion}" | Shadow`;
  const shareDescription = questionData.resultsFinalized
    ? "Clear tallies published with FHE proofs."
    : "Encrypted tallies stay sealed until the creator reveals them.";

  const ActionButton = ({
    children,
    variant = "ghost",
    disabled,
    onClick,
  }: {
    children: ReactNode;
    variant?: "ghost" | "primary";
    disabled: boolean;
    onClick?: () => void;
  }) => {
    const base =
      "w-full rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center";
    const enabled =
      variant === "primary"
        ? "bg-gradient-to-r from-[#ffd208] to-[#ffb347] text-black shadow-[0_10px_30px_rgba(255,210,8,0.25)] hover:shadow-[0_12px_40px_rgba(255,210,8,0.35)]"
        : "border border-white/15 text-white hover:border-white/40";
    const disabledStyles = "opacity-40 cursor-not-allowed border border-white/10 text-gray-500";
    return (
      <button
        className={`${base} ${disabled ? disabledStyles : enabled}`}
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
      >
        {children}
      </button>
    );
  };

  const getShareUrl = () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/vote?questionId=${questionIdMapper.getRandomId(questionId)}`
      : "";

  const handleCopyLink = () => {
    const url = getShareUrl();
    if (!url) return;
    navigator.clipboard
      ?.writeText(url)
      .then(() => notification.success("Copied To Clipboard!"))
      .catch(() => notification.error("Unable to copy link"));
  };

  const cardBody = (
    <div className={`${wrapperClass} relative flex flex-col gap-5`} style={{ backdropFilter: "blur(16px)" }}>
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            "radial-gradient(circle at 20% -10%, rgba(255,255,255,0.08), transparent 42%), radial-gradient(circle at 75% 20%, rgba(255,255,255,0.05), transparent 38%)",
        }}
      />

      <div className="relative flex flex-col gap-5">
        <div className="absolute right-0 top-1 flex justify-end">
          {!isPrivatePoll ? (
            <ShareButtons onShareX={handleShare("x")} onShareFarcaster={handleShare("farcaster")} />
          ) : (
            <ShareButtons onCopy={handleCopyLink} />
          )}
        </div>
        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:pr-[9.5rem]">
          <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
            <img
              src={featureImage}
              alt="topic"
              className="h-full w-full object-cover"
              onError={e => {
                if (e.currentTarget.src.endsWith("shadow-logo.png")) return;
                e.currentTarget.src = "/shadow-logo.png";
              }}
            />
          </div>
          <div className="flex-1 min-w-0 space-y-2.5">
            <div className="flex flex-wrap gap-2 text-xs text-gray-300">
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 uppercase tracking-[0.3em]">
                  {isPrivatePoll ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 11h18" />
                        <path d="M5 11V7a7 7 0 0 1 14 0v4" />
                        <rect width="18" height="11" x="3" y="11" rx="2" />
                      </svg>
                      Private
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 0 20" />
                        <path d="M12 2a15.3 15.3 0 0 0 0 20" />
                      </svg>
                      Public
                    </>
                  )}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 uppercase tracking-[0.3em] text-gray-200">
                  #{questionId}
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <span className="rounded-full border border-[#ffd208]/40 bg-[#ffd208]/10 px-3 py-1 text-[#ffd208]">
                  Confidential
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200 shadow-[0_8px_24px_rgba(16,185,129,0.25)]">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Active
                </span>
              </div>
            </div>
            <Text size="6" weight="bold" className="mt-1 leading-tight break-words max-w-[calc(100%-1rem)]">
              {displayQuestion}
            </Text>
            <p className="text-base text-gray-200">{questionData.possibleAnswers.join(" · ")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 sm:grid-cols-3">
          <div className="flex flex-col gap-0">
            <p className="text-[10px] my-0.5 uppercase tracking-[0.4em] text-gray-400">Deadline</p>
            <p className="text-sm  text-white/90">{new Date(questionData.deadline * 1000).toLocaleString()}</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[10px] my-0.5 uppercase tracking-[0.4em] text-gray-400">Votes</p>
            <p className="text-lg font-semibold text-white">
              {totalVotes || (questionData.resultsOpened ? "Decrypt" : "—")}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[10px] my-0.5 uppercase tracking-[0.4em] text-gray-400">Status</p>
            <p
              className={`text-sm ${
                statusLabel === "Published"
                  ? "text-emerald-300"
                  : statusLabel === "No Votes Submitted"
                    ? "text-rose-200"
                    : statusLabel === "Awaiting publish"
                      ? "text-amber-200"
                      : "text-slate-200"
              }`}
            >
              {statusLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
          <div className="h-11 w-11 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
            <img
              src={creatorAvatar || "/shadow-logo.png"}
              alt="creator avatar"
              className="h-full w-full object-cover"
              onError={e => {
                if (e.currentTarget.src.endsWith("shadow-logo.png")) return;
                e.currentTarget.src = "/shadow-logo.png";
              }}
            />
          </div>
          <Box>
            <Text size="2" color="gray">
              Created by
            </Text>
            <Text size="3" weight="bold">
              {questionData.createdBy.slice(0, 6)}...{questionData.createdBy.slice(-4)}
            </Text>
          </Box>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
          <p className="text-sm text-gray-300">
            {questionData.resultsFinalized
              ? "Tallies published on-chain."
              : noVotesSubmitted && deadlinePassed
                ? "Voting window closed with no submissions. Nothing can be decrypted."
                : questionData.resultsOpened
                  ? "Tallies decrypted — publish to reveal clear counts."
                  : `Votes remain encrypted until ${new Date(questionData.deadline * 1000).toLocaleString()}.`}
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {questionData.possibleAnswers.map((ans, idx) => {
              const votes = decryptedTallies[idx] ?? 0;
              const percent = showTallies && totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
              return (
                <div key={`${ans}-${idx}`} className="rounded-xl border border-white/10 bg-black/30 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-medium text-white/85">{ans}</span>
                    <span>
                      {showTallies
                        ? `${votes} vote${votes === 1 ? "" : "s"}${totalVotes ? ` (${percent}%)` : ""}`
                        : questionData.resultsOpened
                          ? "decrypt & publish"
                          : "encrypted"}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#ffd208] via-white to-white/80 transition-all duration-300"
                      style={{
                        width: showTallies ? (totalVotes === 0 ? "0%" : `${percent}%`) : "100%",
                        opacity: showTallies ? 1 : 0.25,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {!isConnected ? (
            <Button
              onClick={() => openConnectModal?.()}
              size="3"
              className="w-full bg-[#ffd208] text-black font-semibold"
            >
              Connect wallet to vote
            </Button>
          ) : deadlinePassed ? (
            <div className="flex flex-col gap-2 text-center text-gray-400 bg-white/5 border border-white/10 rounded-2xl px-4 py-6">
              <Text size="3" weight="bold">
                Poll Closed
              </Text>
              <Text size="2">Deadline passed; encrypted tally will be revealed once published on-chain.</Text>
            </div>
          ) : !userHasVoted ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {questionData.possibleAnswers.map((ans, idx) => (
                <button
                  key={ans}
                  onClick={() => handleVote(idx)}
                  disabled={loading}
                  className={`rounded-2xl border px-6 py-4 text-lg font-semibold tracking-wide transition-all ${
                    votedFor === idx
                      ? "bg-[#ffd208]/20 border-[#ffd208]/50 text-white shadow-[0_12px_30px_rgba(255,210,8,0.25)]"
                      : "bg-[#111]/60 border-white/10 text-white hover:border-white/40 hover:bg-[#111]/80"
                  }`}
                >
                  {ans}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 text-center rounded-2xl bg-white/5 border border-white/10 px-4 py-4">
              <Text size="3" color="green" weight="bold">
                ✓ Encrypted Vote Recorded
                {typeof votedFor === "number" ? ` for ${questionData.possibleAnswers[votedFor]}` : ""}
              </Text>
              <Text size="2" color="gray">
                Votes cannot be changed once submitted to preserve secrecy.
              </Text>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ActionButton
              disabled={!deadlinePassed || questionData.resultsOpened || revealLoading || noVotesSubmitted}
              onClick={async () => {
                if (!deadlinePassed || questionData.resultsOpened || noVotesSubmitted) return;
                let toastId: string | undefined;
                try {
                  toastId = notification.loading("Requesting Tally Reveal…") ?? undefined;
                  setRevealLoading(true);
                  await openResults(questionId);
                  await refreshQuestion();
                  notification.success("Encrypted Tally Reveal Requested.");
                } catch (err) {
                  console.error("Failed To Open Results", err);
                  notification.error("Failed To Reveal Encrypted Tally.");
                } finally {
                  setRevealLoading(false);
                  if (toastId) {
                    notification.remove(toastId);
                  }
                }
              }}
            >
              {noVotesSubmitted ? "No Votes To Reveal" : revealLoading ? "Publishing…" : "Reveal Encrypted Tally"}
            </ActionButton>
            <ActionButton
              variant="primary"
              disabled={!canPublishResults || publishLoading || noVotesSubmitted}
              onClick={async () => {
                if (!canPublishResults || noVotesSubmitted) return;
                let toastId: string | undefined;
                try {
                  toastId = notification.loading("Publishing Clear Tally…") ?? undefined;
                  setPublishLoading(true);
                  await publishResults(questionId);
                  await refreshQuestion();
                  notification.success("Clear Tally Published On-chain.");
                } catch (err) {
                  console.error("Failed To Publish Results", err);
                  setError(err instanceof Error ? err.message : "Failed To Publish .");
                  notification.error(err instanceof Error ? err.message : "Failed To Publish Results.");
                } finally {
                  setPublishLoading(false);
                  if (toastId) {
                    notification.remove(toastId);
                  }
                }
              }}
            >
              {noVotesSubmitted ? "No Votes To Publish" : publishLoading ? "Submitting…" : "Publish Clear Tally"}
            </ActionButton>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}
      </div>
    </div>
  );

  if (primary) {
    return (
      <>
        {questionData && (
          <Head>
            <title>{shareTitle}</title>
            <meta property="og:title" content={shareTitle} />
            <meta property="og:description" content={shareDescription} />
            {absoluteShareImage && <meta property="og:image" content={absoluteShareImage} />}
            {origin && (
              <meta
                property="og:url"
                content={`${origin}/vote?questionId=${questionIdMapper.getRandomId(questionId)}`}
              />
            )}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:title" content={shareTitle} />
            <meta property="twitter:description" content={shareDescription} />
            {absoluteShareImage && <meta property="twitter:image" content={absoluteShareImage} />}
          </Head>
        )}
        <div className="w-full px-0 my-8 flex justify-center">
          <div className="w-full max-w-6xl">
            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <Box className="w-full">{cardBody}</Box>
              <VoteStats
                questionId={questionId}
                question={questionData}
                account={address}
                chainId={undefined}
                hasVoted={userHasVoted}
                votedFor={votedFor}
                fheStatus={fheStatus}
                isConnected={isConnected}
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {questionData && (
        <Head>
          <title>{shareTitle}</title>
          <meta property="og:title" content={shareTitle} />
          <meta property="og:description" content={shareDescription} />
          {absoluteShareImage && <meta property="og:image" content={absoluteShareImage} />}
          {origin && (
            <meta
              property="og:url"
              content={`${origin}/vote?questionId=${questionIdMapper.getRandomId(questionId)}`}
            />
          )}
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:title" content={shareTitle} />
          <meta property="twitter:description" content={shareDescription} />
          {absoluteShareImage && <meta property="twitter:image" content={absoluteShareImage} />}
        </Head>
      )}
      <div className="w-full h-full">
        <Box className="w-full h-full">{cardBody}</Box>
      </div>
    </>
  );
};

export default Voting;
