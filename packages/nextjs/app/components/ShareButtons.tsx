"use client";

type ShareButtonsProps = {
  onShareX?: () => void;
  onShareFarcaster?: () => void;
  onCopy?: () => void;
  className?: string;
};

const baseBtn =
  "relative inline-flex items-center justify-center w-11 h-11 rounded-full transition-all duration-400 group shadow-[0_12px_28px_rgba(0,0,0,0.45)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd208]";

export const ShareButtons = ({ onShareX, onShareFarcaster, onCopy, className = "" }: ShareButtonsProps) => {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {onShareX && (
        <button
          type="button"
          onClick={onShareX}
          className={`${baseBtn} bg-[#050505] text-white`}
          title="Share on X"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-black/20 via-black/50 to-black/10 shadow-inner shadow-white/10 group-hover:scale-105 transition">
            <img src="/social/X.png" alt="X" className="h-[18px] w-[18px] object-contain" />
          </span>
        </button>
      )}
      {onShareFarcaster && (
        <button
          type="button"
          onClick={onShareFarcaster}
          className={`${baseBtn} bg-gradient-to-r from-[#3c1b9c] via-[#5b2adf] to-[#3c1b9c] text-white shadow-[0_14px_38px_rgba(91,42,223,0.5)]`}
          title="Share on Farcaster"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/10 shadow-inner shadow-white/20 group-hover:scale-105 transition">
            <img src="/social/Farcaster.png" alt="Farcaster" className="h-[18px] w-[18px] object-contain" />
          </span>
        </button>
      )}
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          className={`${baseBtn} bg-[#0f0f0f] text-white shadow-[0_12px_28px_rgba(0,0,0,0.48)]`}
          title="Copy link"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-white/10 via-white/5 to-transparent shadow-inner shadow-white/10 group-hover:scale-105 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
              <path d="M8 17h-2.5A2.5 2.5 0 0 1 3 14.5v-7A2.5 2.5 0 0 1 5.5 5H13" />
              <rect x="8" y="7" width="13" height="13" rx="2.5" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
};

export default ShareButtons;
