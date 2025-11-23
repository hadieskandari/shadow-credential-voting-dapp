"use client";

import { useMemo } from "react";
import type { Question } from "../hooks/useVoting";
import { Box, Flex, Text } from "@radix-ui/themes";

interface VoteStatsProps {
  questionId: number;
  question?: Question | null;
  account?: string;
  chainId?: number;
  hasVoted: boolean;
  votedFor: number | null;
  fheStatus: "idle" | "loading" | "ready" | "error";
  isConnected: boolean;
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const StatRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <Text size="1" color="gray">
      {label}
    </Text>
    <Text size="2" weight="medium">
      {value}
    </Text>
  </div>
);

const truncate = (value?: string, chars = 6) => {
  if (!value) return "—";
  if (value.length <= chars * 2) return value;
  return `${value.slice(0, chars)}…${value.slice(-chars)}`;
};

const formatDuration = (ms: number) => {
  if (ms <= 0) return "Expired";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
};

export const VoteStats = ({
  questionId,
  question,
  account,
  chainId,
  hasVoted,
  votedFor,
  fheStatus,
  isConnected,
}: VoteStatsProps) => {
  const timeLeft = useMemo(() => {
    if (!question) return "—";
    const diff = question.deadline * 1000 - Date.now();
    return formatDuration(diff);
  }, [question]);

  const encryptedHandles = question?.encryptedTally ?? [];
  const totalVotes = question ? question.decryptedTally[0] + question.decryptedTally[1] : 0;
  const statusLabel = useMemo(() => {
    if (!question) return "—";
    if (question.resultsFinalized) return "Published";
    if (totalVotes === 0 && Date.now() / 1000 >= question.deadline) return "No Votes Submitted";
    if (question.resultsOpened) return "Awaiting Publish";
    return Date.now() / 1000 >= question.deadline ? "Ended" : "Live";
  }, [question, totalVotes]);
  const voteSummary = useMemo(() => {
    if (!isConnected) return "Wallet Not Connected";
    if (!hasVoted) return "Not Submitted";
    if (typeof votedFor === "number" && question) {
      return `Encrypted ${question.possibleAnswers[votedFor]}`;
    }
    return "Encrypted vote stored";
  }, [hasVoted, votedFor, question, isConnected]);

  return (
    <Box
      className="rounded-[26px] border border-white/10 bg-[#060606]/92 p-5 text-white space-y-5 h-full"
      style={{ backdropFilter: "blur(16px)" }}
    >
      <div className="space-y-1">
        <Text size="4" weight="bold">
          Diagnostics
        </Text>
        <br />
        <Text size="2" color="gray">
          Zama FHE keeps ballots opaque; decrypt only when you choose to publish.
        </Text>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <Flex justify="between" align="center">
          <Text size="2" weight="medium">
            Wallet
          </Text>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              isConnected ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-200"
            }`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </Flex>
        <div className="grid grid-cols-2 gap-3">
          <StatRow label="Address" value={truncate(account)} />
          <StatRow label="Chain ID" value={chainId ? `${chainId}` : "—"} />
          <StatRow label="Contract" value={truncate(CONTRACT_ADDRESS)} />
          <StatRow label="Time left" value={timeLeft} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <Flex justify="between" align="center">
          <Text size="2" weight="medium">
            Encrypted Handles
          </Text>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              fheStatus === "ready" ? "bg-emerald-500/15 text-emerald-200" : "bg-orange-500/15 text-orange-200"
            }`}
          >
            {fheStatus === "ready" ? "Relayer Ready" : `FHE: ${fheStatus}`}
          </span>
        </Flex>
        {encryptedHandles.map((handle, idx) => (
          <StatRow key={`${handle}-${idx}`} label={`Option ${idx + 1}`} value={truncate(handle, 8)} />
        ))}
        <Text size="1" color="gray">
          Handles + proofs stay opaque; only after reveal do tallies decrypt and post on-chain.
        </Text>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <Flex justify="between" align="center">
          <Text size="2" weight="medium">
            Question #{questionId}
          </Text>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              statusLabel === "Published"
                ? "bg-emerald-400/20 text-emerald-300"
                : statusLabel === "No Votes Submitted"
                  ? "bg-rose-400/20 text-rose-200"
                  : "bg-[#ffd208]/15 text-[#ffd208]"
            }`}
          >
            {statusLabel}
          </span>
        </Flex>
        <StatRow label="Deadline" value={question ? new Date(question.deadline * 1000).toLocaleString() : "—"} />
        <StatRow label="Your Vote" value={voteSummary} />
        <div className="rounded-xl border border-[#ffd208]/30 bg-[#ffd208]/5 p-3 text-xs text-yellow-100 space-y-1.5">
          <Text weight="bold" color="yellow">
            FHE Flow:
          </Text>
          <ul className="list-disc pl-4 space-y-1">
            <li>Encrypt locally; relayer returns handle + proof bound to this contract.</li>
            <li>Handles remain unreadable until creator requests tally reveal.</li>
            <li>Clear counts + proof publish on-chain after decrypt.</li>
          </ul>
        </div>
      </div>
    </Box>
  );
};

export default VoteStats;
