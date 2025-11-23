"use client";

import { useCallback, useEffect, useState } from "react";
import { parseAbiItem } from "viem";
import { usePublicClient } from "wagmi";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;

const votedEventAbi = parseAbiItem("event Voted(address indexed voter, uint256 indexed questionId, uint8 answerIndex)");

type VotedEvent = {
  voter: string;
  questionId: number;
  answerIndex: number;
  txHash: `0x${string}`;
  timestamp?: string;
};

export const Events = ({ triggerKey }: { triggerKey?: string }) => {
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<VotedEvent[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!publicClient || !CONTRACT_ADDRESS) return;
    setIsFetching(true);
    try {
      const latestBlock = await publicClient.getBlockNumber();
      const fromBlock = latestBlock > 5000n ? latestBlock - 5000n : 0n;
      const logs = await publicClient.getLogs({
        address: CONTRACT_ADDRESS,
        event: votedEventAbi,
        fromBlock,
        toBlock: latestBlock,
      });
      const enriched = await Promise.all(
        logs.slice(-10).map(async log => {
          let timestamp: string | undefined;
          try {
            const block = await publicClient.getBlock({ blockHash: log.blockHash });
            timestamp = new Date(Number(block.timestamp) * 1000).toLocaleString();
          } catch {
            timestamp = undefined;
          }
          return {
            voter: log.args.voter as string,
            questionId: Number(log.args.questionId ?? 0),
            answerIndex: Number(log.args.answerIndex ?? 0),
            txHash: log.transactionHash,
            timestamp,
          } satisfies VotedEvent;
        }),
      );
      setEvents(enriched.reverse());
    } catch (err) {
      console.error("Error fetching events", err);
    } finally {
      setIsFetching(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, triggerKey]);

  if (!CONTRACT_ADDRESS) return null;

  return (
    <section className="mt-10 w-full">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/60 p-6 text-white shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-gray-500">Recent votes</p>
            <h3 className="text-2xl font-semibold text-white">Live activity from the contract</h3>
          </div>
          {isFetching && <span className="text-xs text-gray-400">Refreshing…</span>}
        </div>

        {events.length === 0 ? (
          <p className="mt-6 text-sm text-gray-400">No votes recorded yet.</p>
        ) : (
          <ul className="mt-6 space-y-3 text-sm">
            {events.map(event => (
              <li
                key={`${event.txHash}-${event.questionId}`}
                className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-gray-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.35em] text-gray-500">
                  <span>Question #{event.questionId}</span>
                  <span>{event.timestamp ?? "Timestamp pending"}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-6 text-sm">
                  <span>
                    <strong className="text-white/80">Voter:</strong> {event.voter.slice(0, 6)}…{event.voter.slice(-4)}
                  </span>
                  <span>
                    <strong className="text-white/80">Answer:</strong> #{event.answerIndex + 1}
                  </span>
                  <span className="truncate">
                    <strong className="text-white/80">Tx:</strong> {event.txHash.slice(0, 10)}…{event.txHash.slice(-6)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default Events;
