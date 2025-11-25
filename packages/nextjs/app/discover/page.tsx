"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GlobalPolyfill } from "../components/GlobalPolyfill";
import Navbar from "../components/Navbar";
import ShareButtons from "../components/ShareButtons";
import { type Question, useVoting } from "../hooks/useVoting";
import { Theme } from "@radix-ui/themes";
import { ArrowRight, Clock as ClockIcon, Filter, Globe2, Lock, Search, Sparkles, Trash2 } from "lucide-react";
import { useAccount } from "wagmi";
import { notification } from "~~/utils/helper/notification";
import { buildShareCopy } from "~~/utils/helper/shareCopy";

interface QuestionEntry {
  id: number;
  data: Question;
}

const PollCard = ({
  entry,
  onArchive,
  canArchive,
}: {
  entry: QuestionEntry;
  onArchive?: (id: number) => void;
  canArchive: boolean;
}) => {
  const { id, data } = entry;
  const isPrivate = data.question.startsWith("🔒");
  const displayQuestion = data.question.replace(/^🔒\s*/, "");
  const deadlineLabel = new Date(data.deadline * 1000).toLocaleString();
  const answers = data.possibleAnswers.join(" · ");
  const total = (data.decryptedTally ?? []).reduce((acc, v) => acc + v, 0);
  const creatorAvatar = data.image?.trim() ? data.image : "/shadow-logo.png";
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShareUrl(`${window.location.origin}/vote?questionId=${id}`);
  }, [id]);

  const shareCopy = buildShareCopy({
    prompt: displayQuestion,
    deadline: data.deadline,
    isPrivate,
    resultsOpened: data.resultsOpened,
    resultsFinalized: data.resultsFinalized,
    context: "discover",
  });

  const handleShare = (platform: "x" | "farcaster") => () => {
    if (!shareUrl) return;
    const encodedText = encodeURIComponent(shareCopy);
    const encodedUrl = encodeURIComponent(shareUrl);
    const link =
      platform === "x"
        ? `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
        : `https://warpcast.com/~/compose?text=${encodedText}`;
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard
      ?.writeText(shareUrl)
      .then(() => notification.success("Copied To Clipboard!"))
      .catch(() => notification.error("Unable to copy link"));
  };

  const [confirmArchive, setConfirmArchive] = useState(false);

  const shareControls = isPrivate ? (
    <ShareButtons onCopy={handleCopy} />
  ) : (
    <ShareButtons onShareX={handleShare("x")} onShareFarcaster={handleShare("farcaster")} />
  );

  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-[#0b0b0b]/90 via-[#0d0d0d]/70 to-[#0b0b0b]/90 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.55)] transition hover:-translate-y-1 hover:border-white/20">
      <div
        className="absolute inset-0 opacity-60"
        style={{ background: "radial-gradient(circle at 20% 20%, rgba(255,210,8,0.16), transparent 40%)" }}
      />
      <div className="absolute inset-x-4 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      <div className="absolute right-3 top-3 z-20">{shareControls}</div>

      <div className="relative flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:pt-3">
        <img
          src={creatorAvatar}
          alt="creator avatar"
          className="h-16 w-16 rounded-3xl border border-white/10 shadow-inner shadow-black/40 object-cover sm:h-12 sm:w-12"
          onError={e => {
            if (e.currentTarget.src.endsWith("shadow-logo.png")) return;
            e.currentTarget.src = "/shadow-logo.png";
          }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-gray-400">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${isPrivate ? "bg-white/5 border border-white/10" : "bg-[#ffd208]/10 border border-[#ffd208]/30 text-[#ffd208]"}`}
            >
              {isPrivate ? <Lock className="h-3 w-3" /> : <Globe2 className="h-3 w-3" />}{" "}
              {isPrivate ? "Private" : "Public"}
            </span>
            <span className="text-gray-500">#{id}</span>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-white line-clamp-2">{displayQuestion}</h3>
          <p className="text-sm text-gray-300 line-clamp-1">{answers}</p>
        </div>
      </div>

      <div className="relative mt-3 grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-gray-300">
        <div className="flex flex-col gap-1">
          <span className="uppercase tracking-[0.25em] text-[10px] text-gray-500">Deadline</span>
          <span className="text-white">{deadlineLabel}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="uppercase tracking-[0.25em] text-[10px] text-gray-500">Votes</span>
          <span className="text-white">{total || "Encrypted"}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="uppercase tracking-[0.25em] text-[10px] text-gray-500">Status</span>
          <span className={`text-${data.resultsFinalized ? "emerald" : "amber"}-300`}>
            {data.resultsFinalized ? "Published" : data.resultsOpened ? "Awaiting publish" : "Live"}
          </span>
        </div>
      </div>

      <div className="relative mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="order-2 line-clamp-1 text-[11px] uppercase tracking-[0.32em] text-gray-500 sm:order-1 sm:flex-1">
          {isPrivate ? "Secure link · Encrypted voters" : "Discoverable · Public board"}
        </div>
        <div className="order-1 flex w-full items-center justify-end gap-3 self-end sm:order-2 sm:w-auto sm:self-auto">
          {canArchive && (
            <button
              type="button"
              onClick={() => setConfirmArchive(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-xs font-semibold text-gray-400 transition hover:border-red-400/40 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              Archive
            </button>
          )}
          <Link
            href={`/vote?questionId=${id}`}
            className="inline-flex items-center gap-2 rounded-full bg-[#ffd208] px-4 py-2 text-xs font-semibold text-black shadow-[0_10px_30px_rgba(255,210,8,0.3)] transition hover:-translate-y-0.5"
          >
            View &amp; vote <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      {confirmArchive && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 rounded-[28px] bg-black/80 px-6 text-center text-white backdrop-blur-md transition">
          <p className="text-sm text-gray-200">
            Do you want to archive this vote? Once archived it is not interactable anymore.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setConfirmArchive(false)}
              className="rounded-full border border-white/20 px-4 py-2 text-sm text-gray-200 transition hover:border-white/50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onArchive?.(id);
                setConfirmArchive(false);
              }}
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(239,68,68,0.5)] transition hover:-translate-y-0.5"
            >
              Archive
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ARCHIVE_STORAGE_KEY = "shadow-archived-polls";

export default function DiscoverPage() {
  const { questionsCount, getQuestion } = useVoting();
  const { address } = useAccount();
  const normalizedAddress = useMemo(() => address?.toLowerCase(), [address]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"latest" | "deadline">("latest");
  const [filterType, setFilterType] = useState<"all" | "public" | "private">("all");
  const [entries, setEntries] = useState<QuestionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [archivedIds, setArchivedIds] = useState<number[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(ARCHIVE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setArchivedIds(parsed);
        }
      }
    } catch {
      setArchivedIds([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archivedIds));
  }, [archivedIds]);

  useEffect(() => {
    const load = async () => {
      if (!questionsCount || questionsCount <= 0) {
        setEntries([]);
        return;
      }
      setLoading(true);
      const ids = Array.from({ length: questionsCount }, (_, i) => i);
      const results = await Promise.all(
        ids.map(async id => {
          const question = await getQuestion(id);
          if (!question) return null;
          return { id, data: question } as QuestionEntry;
        }),
      );
      setEntries(results.filter(Boolean) as QuestionEntry[]);
      setLoading(false);
    };
    load();
  }, [questionsCount, getQuestion]);

  const filteredEntries = useMemo(() => {
    let list = [...entries];
    if (archivedIds.length) {
      list = list.filter(entry => !archivedIds.includes(entry.id));
    }

    list = list.filter(entry => {
      const isPrivate = entry.data.question.startsWith("🔒");
      if (!isPrivate) return true;
      const creatorAddress = entry.data.createdBy.toLowerCase();
      return Boolean(normalizedAddress) && creatorAddress === normalizedAddress;
    });

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(entry => {
        const prompt = entry.data.question.toLowerCase();
        const creator = entry.data.createdBy.toLowerCase();
        return prompt.includes(q) || creator.includes(q);
      });
    }

    if (filterType !== "all") {
      const shouldBePrivate = filterType === "private";
      list = list.filter(entry => entry.data.question.startsWith("🔒") === shouldBePrivate);
    }

    list.sort((a, b) => {
      if (sort === "deadline") {
        return a.data.deadline - b.data.deadline;
      }
      return b.id - a.id;
    });

    return list;
  }, [archivedIds, entries, query, sort, filterType, normalizedAddress]);

  const { liveEntries, expiredEntries } = useMemo(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    const live: QuestionEntry[] = [];
    const expired: QuestionEntry[] = [];
    filteredEntries.forEach(entry => {
      if (entry.data.deadline > currentTime) {
        live.push(entry);
      } else {
        expired.push(entry);
      }
    });
    return { liveEntries: live, expiredEntries: expired };
  }, [filteredEntries]);

  const handleArchive = useCallback((pollId: number) => {
    setArchivedIds(prev => (prev.includes(pollId) ? prev : [...prev, pollId]));
  }, []);

  const renderPollGrid = (list: QuestionEntry[], emptyLabel: string) => {
    if (loading) {
      return (
        <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-12 text-center text-white/70">
          Loading polls…
        </div>
      );
    }
    if (!list.length) {
      return (
        <div className="col-span-full flex min-h-[180px] flex-col items-center justify-center rounded-[32px] border border-white/10 bg-gradient-to-br from-black/70 via-black/60 to-black/70 px-6 text-center text-sm text-gray-300 shadow-[0_18px_45px_rgba(0,0,0,0.4)]">
          <Sparkles className="mb-2 h-6 w-6 text-[#ffd208]" />
          <p className="max-w-sm text-base font-medium text-white/80">{emptyLabel}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.35em] text-gray-500">Check back soon</p>
        </div>
      );
    }
    const mapped = list.map(entry => {
      const isCreator = Boolean(normalizedAddress && entry.data.createdBy?.toLowerCase() === normalizedAddress);
      return (
        <div key={entry.id} className="fade-card">
          <PollCard entry={entry} onArchive={handleArchive} canArchive={Boolean(isCreator)} />
        </div>
      );
    });
    return mapped;
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
        <div className="relative z-10 flex flex-col items-center px-4">
          <div className="navbar mb-12 w-full max-w-6xl">
            <Navbar />
          </div>
          <div className="w-full max-w-6xl space-y-10 pb-16">
            <section className="rounded-[40px] border border-white/10 bg-black/70 p-10 text-center text-white space-y-4 shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
              <p className="text-xs uppercase tracking-[0.45em] text-[#ffd208]/80">Discover</p>
              <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
                Vote privately on live encrypted tallies
              </h1>
              <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto">
                Browse open polls. Every vote is encrypted client-side, so your choice remains secret until the creator
                reveals results.
              </p>
              <div className="flex flex-col items-center gap-3 pt-4">
                <Link
                  href="/#create"
                  className="inline-flex items-center justify-center rounded-full bg-[#ffd208] px-6 py-3 text-black font-semibold shadow-[0_12px_40px_rgba(255,210,8,0.35)]"
                >
                  Launch encrypted tally
                </Link>
              </div>
            </section>

            <div className="grid gap-4 rounded-[32px] border border-white/10 bg-black/60 p-6 text-white md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.35em] text-gray-400">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-black/30 pl-10 pr-4 py-2 text-sm outline-none focus:border-white/40 transition-colors"
                    placeholder="Search prompt or creator…"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.35em] text-gray-400">Sort by</label>
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-black/30 pl-10 pr-4 py-2 text-sm outline-none focus:border-white/40 transition-colors appearance-none"
                    value={sort}
                    onChange={event => setSort(event.target.value as typeof sort)}
                  >
                    <option value="latest">Latest</option>
                    <option value="deadline">Soonest deadline</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.35em] text-gray-400">Filter by</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-black/30 pl-10 pr-4 py-2 text-sm outline-none focus:border-white/40 transition-colors appearance-none"
                    value={filterType}
                    onChange={event => setFilterType(event.target.value as typeof filterType)}
                  >
                    <option value="all">All polls</option>
                    <option value="public">Public board</option>
                    <option value="private">Private tally</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-sm text-[#ffd208]">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-[#ffd208]" />
                <p>Loading polls… stay tuned.</p>
              </div>
            ) : (
              <>
                <section className="space-y-4">
                  <div className="flex flex-col gap-1 text-white sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.45em] text-[#ffd208]/90">Live votes</p>
                      <h2 className="text-2xl font-semibold">Active polls</h2>
                    </div>
                    <span className="text-sm text-gray-400">{liveEntries.length} running</span>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {renderPollGrid(liveEntries, "No live polls yet—launch your own or check back soon.")}
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex flex-col gap-1 text-white sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.45em] text-[#ffd208]/90">History</p>
                      <h2 className="text-2xl font-semibold">Expired polls</h2>
                    </div>
                    <span className="text-sm text-gray-400">{expiredEntries.length} archived</span>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {renderPollGrid(
                      expiredEntries,
                      "No archived polls yet. Past votes will settle here automatically.",
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </Theme>
  );
}
