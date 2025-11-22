"use client";

import { useMemo, useState, useEffect } from "react";
import { Theme } from "@radix-ui/themes";
import { Search, Filter, Clock as ClockIcon, ArrowRight, Lock, Globe2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Silk from "../components/silk";
import { GlobalPolyfill } from "../components/GlobalPolyfill";
import { useVoting, type Question } from "../hooks/useVoting";
import ShareButtons from "../components/ShareButtons";
import Link from "next/link";

const ASH_SILK = {
  color: "#a3a3a3",
  background: "#bebebe",
  speed: 5.5,
  scale: 1,
  noiseIntensity: 1.3,
  rotation: -0.1,
};

interface QuestionEntry {
  id: number;
  data: Question;
}

const PollCard = ({ entry }: { entry: QuestionEntry }) => {
  const { id, data } = entry;
  const isPrivate = data.question.startsWith("🔒");
  const displayQuestion = data.question.replace(/^🔒\s*/, "");
  const deadlineLabel = new Date(data.deadline * 1000).toLocaleString();
  const answers = data.possibleAnswers.join(" · ");
  const total = (data.decryptedTally ?? []).reduce((acc, v) => acc + v, 0);
  const creatorAvatar = data.image?.trim()
    ? data.image
    : "/shadow-logo.png";
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/vote?questionId=${id}` : "";

  const handleShare = (platform: "x" | "farcaster") => () => {
    if (!shareUrl) return;
    if (platform === "x") {
      const link = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
        `Vote on "${displayQuestion}" with encrypted tallies`,
      )}`;
      window.open(link, "_blank");
    } else {
      const link = `https://warpcast.com/~/compose?text=${encodeURIComponent(
        `Vote on "${displayQuestion}" ➜ ${shareUrl}`,
      )}`;
      window.open(link, "_blank");
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
  };

  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-[#0b0b0b]/90 via-[#0d0d0d]/70 to-[#0b0b0b]/90 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.55)] transition hover:-translate-y-1 hover:border-white/20">
      <div className="absolute inset-0 opacity-60" style={{ background: "radial-gradient(circle at 20% 20%, rgba(255,210,8,0.16), transparent 40%)" }} />
      <div className="absolute inset-x-4 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      <div className="absolute top-3 right-3 z-20">
        {isPrivate ? (
          <ShareButtons onCopy={handleCopy} />
        ) : (
          <ShareButtons onShareX={handleShare("x")} onShareFarcaster={handleShare("farcaster")} />
        )}
      </div>

      <div className="relative flex items-start gap-3 pb-3">
        <img
          src={creatorAvatar}
          alt="creator avatar"
          className="h-12 w-12 rounded-2xl border border-white/10 shadow-inner shadow-black/40 object-cover"
          onError={e => {
            if (e.currentTarget.src.endsWith("shadow-logo.png")) return;
            e.currentTarget.src = "/shadow-logo.png";
          }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-gray-400">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${isPrivate ? "bg-white/5 border border-white/10" : "bg-[#ffd208]/10 border border-[#ffd208]/30 text-[#ffd208]"}`}>
              {isPrivate ? <Lock className="h-3 w-3" /> : <Globe2 className="h-3 w-3" />} {isPrivate ? "Private" : "Public"}
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

      <div className="relative mt-4 flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.32em] text-gray-500">
          {isPrivate ? "Secure link · Encrypted voters" : "Discoverable · Public board"}
        </div>
        <Link
          href={`/vote?questionId=${id}`}
          className="inline-flex items-center gap-2 rounded-full bg-[#ffd208] px-4 py-2 text-xs font-semibold text-black shadow-[0_10px_30px_rgba(255,210,8,0.3)] transition hover:-translate-y-0.5"
        >
          View &amp; vote <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default function DiscoverPage() {
  const { questionsCount, getQuestion } = useVoting();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"latest" | "deadline">("latest");
  const [filterType, setFilterType] = useState<"all" | "public" | "private">("all");
  const [entries, setEntries] = useState<QuestionEntry[]>([]);
  const [loading, setLoading] = useState(false);

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
  }, [entries, query, sort, filterType]);

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
          <div className="navbar mb-12 w-full max-w-6xl">
            <Navbar />
          </div>
          <div className="w-full max-w-6xl space-y-10 pb-16">
            <section className="rounded-[40px] border border-white/10 bg-black/70 p-10 text-center text-white space-y-4 shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
              <p className="text-xs uppercase tracking-[0.45em] text-[#ffd208]/80">Discover</p>
              <h1 className="text-4xl md:text-5xl font-semibold leading-tight">Vote privately on live encrypted tallies</h1>
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

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {loading && (
                <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-12 text-center text-white/70">
                  Loading polls…
                </div>
              )}
              {!loading &&
                filteredEntries.map(entry => (
                  <div key={entry.id} className="fade-card">
                    <PollCard entry={entry} />
                  </div>
                ))}
              {!loading && !filteredEntries.length && (
                <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-12 text-center text-white/70">No polls yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Theme>
  );
}
