export type ShareContext = "discover" | "voting" | "results";

export interface ShareCopyOptions {
  prompt: string;
  deadline: number;
  isPrivate?: boolean;
  resultsOpened?: boolean;
  resultsFinalized?: boolean;
  userHasVoted?: boolean;
  context?: ShareContext;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const formatDeadline = (deadline: number) => {
  try {
    return dateFormatter.format(new Date(deadline * 1000));
  } catch {
    return new Date(deadline * 1000).toLocaleString();
  }
};

const formatCountdown = (deadline: number) => {
  const diffMs = deadline * 1000 - Date.now();
  if (diffMs <= 0) return null;
  const totalMinutes = Math.floor(diffMs / 60000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 24) {
    const minutes = totalMinutes % 60;
    return `${totalHours}h ${minutes}m`;
  }
  const days = Math.floor(totalHours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
};

import { SHARE_BANNER_SHORT } from "./shareConfig";

export const buildShareCopy = (options: ShareCopyOptions) => {
  const { prompt, deadline, isPrivate, resultsOpened, resultsFinalized, userHasVoted, context = "discover" } = options;
  const deadlineText = formatDeadline(deadline);
  const countdown = formatCountdown(deadline);
  const descriptor = isPrivate ? "private Shadow poll" : "Shadow poll";

  if (context === "results" || resultsFinalized) {
    return `Proof-backed results for ${descriptor} "${prompt}" on Shadow (powered by @zama) are live. Peek at the decrypt-and-publish reveal. ${SHARE_BANNER_SHORT}`;
  }

  if (resultsOpened && !resultsFinalized) {
    return `Encrypted tallies for ${descriptor} "${prompt}" are being revealed on Shadow (powered by @zama). Watch the proofs drop when they publish. ${SHARE_BANNER_SHORT}`;
  }

  if (userHasVoted) {
    return `I just cast a private vote on Shadow (powered by @zama) for "${prompt}". Tallies stay sealed until ${deadlineText}${countdown ? ` (${countdown} left)` : ""}. ${SHARE_BANNER_SHORT}`;
  }

  const inviteLine = isPrivate ? "Only invitees with this link can join." : "You can still take part before the reveal.";
  if (deadline * 1000 > Date.now()) {
    return `Spotted this ${descriptor} "${prompt}" on Shadow (powered by @zama). Votes stay encrypted until ${deadlineText}${countdown ? ` (${countdown} left)` : ""}. ${inviteLine} ${SHARE_BANNER_SHORT}`;
  }

  return `Voting just closed on ${descriptor} "${prompt}" via Shadow (powered by @zama). Stick around for the encrypted tally reveal and on-chain publish. ${SHARE_BANNER_SHORT}`;
};
