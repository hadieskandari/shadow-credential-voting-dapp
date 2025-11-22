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
    <div className="container mt-10">
      {/* <h2 className="text-xl font-semibold mb-4">Recent Votes</h2>
      <div className="spinner-parent">
        {isFetching && (
          <div className="overlay">
            <div className="spinner" />
          </div>
        )}
        {events.length === 0 ? (
          <p>No votes recorded yet.</p>
        ) : (
          <ul className="events-list">
            {events.map(event => (
              <li key={`${event.txHash}-${event.questionId}`} className="event-item">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Question #{event.questionId}</span>
                  <span>{event.timestamp ?? "Pending timestamp"}</span>
                </div>
                <div className="mt-1 text-sm">
                  <p>
                    <strong>Voter:</strong> {event.voter.slice(0, 6)}...{event.voter.slice(-4)}
                  </p>
                  <p>
                    <strong>Answer Index:</strong> {event.answerIndex}
                  </p>
                  <p className="truncate">
                    <strong>Tx:</strong> {event.txHash}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div> */}
    </div>
  );
};

export default Events;
