import React, { useState } from "react";
import { 
  X, Check, Copy, Share2, Trophy, CheckCircle2, 
  ExternalLink, Sparkles, MessageCircle, Send, Globe
} from "lucide-react";
import { Prediction, PredictionMatch } from "../types";

interface SharePredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prediction: Prediction;
  match: PredictionMatch;
}

export default function SharePredictionModal({
  isOpen,
  onClose,
  prediction,
  match,
}: SharePredictionModalProps) {
  const [copiedType, setCopiedType] = useState<"text" | "link" | null>(null);

  if (!isOpen) return null;

  const isSettled = match.status === "settled";
  const isWinner = Boolean(prediction.grandPrizeWinner);
  const legsCorrect = prediction.legsCorrect ?? (
    (prediction.leg1Correct ? 1 : 0) + 
    (prediction.leg2Correct ? 1 : 0) + 
    (prediction.leg3Correct ? 1 : 0)
  );

  const currentUrl = typeof window !== "undefined" ? window.location.href : "https://hattrick-cafe.web.app";
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://hattrick-cafe.web.app";

  // Friendly outcome label
  const outcomeText = 
    prediction.outcome === "HOME" ? `${match.homeTeam} Win` :
    prediction.outcome === "AWAY" ? `${match.awayTeam} Win` : "Draw";

  // Formatted summary text for social platforms
  const shareTitle = isWinner 
    ? `🏆 I won the Hattrick Cafe 3-Leg Prediction Challenge!` 
    : isSettled 
    ? `⚽ My Match Day Prediction Result for ${match.homeTeam} vs ${match.awayTeam}` 
    : `⚽ My 3-Leg Picks for ${match.homeTeam} vs ${match.awayTeam}!`;

  const shareBody = isWinner
    ? `🏆 3/3 LEGS CORRECT! I predicted ${match.homeTeam} vs ${match.awayTeam} and won the Match Day Prize at Hattrick Cafe (Hawassa)!
🎯 Result: ${outcomeText}
🔢 Scoreline: ${prediction.scoreline}
⭐ Goalscorer: ${prediction.playerName} (${prediction.playerGoals}g)
☕ Play free at Hattrick Cafe:`
    : isSettled
    ? `⚽ Checked my Match Day picks for ${match.homeTeam} vs ${match.awayTeam} at Hattrick Cafe:
📊 Result: ${legsCorrect}/3 legs correct
🎯 Pick: ${outcomeText}
🔢 Scoreline: ${prediction.scoreline}
⭐ Player: ${prediction.playerName} (${prediction.playerGoals}g)
☕ Join next week's free prediction challenge:`
    : `⚽ My official 3-leg picks for ${match.homeTeam} vs ${match.awayTeam} at Hattrick Cafe:
🎯 Outcome: ${outcomeText}
🔢 Scoreline: ${prediction.scoreline}
⭐ Key Player: ${prediction.playerName} (${prediction.playerGoals}g)
Can you predict better? Play free for artisanal Ethiopian coffee & prizes:`;

  const fullShareText = `${shareBody}\n${shareUrl}`;

  // Copy handlers
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(fullShareText);
      setCopiedType("text");
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedType("link");
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      // fallback
    }
  };

  // Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareBody,
          url: shareUrl,
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleCopyText();
        }
      }
    } else {
      handleCopyText();
    }
  };

  // Direct Social Share URLs
  const encodedText = encodeURIComponent(fullShareText);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedBodyOnly = encodeURIComponent(shareBody);

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedBodyOnly}&url=${encodedUrl}&hashtags=HattrickCafe,BunaToGo,Hawassa,PremierLeague`;
  const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedBodyOnly}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#122b1c] via-[#0d2216] to-[#07130b] border-2 border-[#42bd6c]/60 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col text-stone-100 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#295a3d]/80 bg-[#163824]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#42bd6c]/20 border border-[#42bd6c]/40 flex items-center justify-center text-[#42bd6c] shadow-inner">
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5 font-display">
                <span>Share Prediction</span>
                {isWinner && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-mono font-bold">
                    WINNER
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-stone-300 font-mono">
                Hattrick Cafe • Weekly Match Day Challenge
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 text-stone-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Card Preview */}
          <div className={`p-4 rounded-2xl border relative overflow-hidden shadow-xl ${
            isWinner 
              ? "bg-gradient-to-br from-[#2a220b] via-[#1a1405] to-[#122b1c] border-amber-400/70"
              : "bg-[#0b1b11] border-[#295a3d]"
          }`}>
            {/* Ambient Watermark */}
            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full border-4 border-[#42bd6c]/10 pointer-events-none" />

            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-xs font-mono">☕ HATTRICK CAFE</span>
                <span className="text-stone-500">•</span>
                <span className="text-stone-300 text-xs font-mono">HAWASSA</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                isWinner 
                  ? "bg-amber-400 text-stone-950" 
                  : isSettled 
                  ? "bg-[#224e38] text-emerald-300" 
                  : "bg-emerald-500/20 text-emerald-400"
              }`}>
                {isWinner ? "🏆 3/3 Winner" : isSettled ? `${legsCorrect}/3 Legs Correct` : "Locked Entry"}
              </span>
            </div>

            {/* Match Fixture Title */}
            <div className="mb-3">
              <span className="text-[10px] font-mono uppercase text-[#42bd6c] font-bold tracking-wider block">
                {match.competition || "Match Day Challenge"}
              </span>
              <h4 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {match.homeTeam} <span className="text-[#42bd6c]">vs</span> {match.awayTeam}
              </h4>
            </div>

            {/* 3-Leg Prediction Picks */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono mb-2">
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[9px] text-stone-400 uppercase block">1. Outcome</span>
                <strong className="text-white truncate block text-[11px] sm:text-xs">{outcomeText}</strong>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[9px] text-stone-400 uppercase block">2. Scoreline</span>
                <strong className="text-amber-300 truncate block text-[11px] sm:text-xs">{prediction.scoreline}</strong>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[9px] text-stone-400 uppercase block">3. Player</span>
                <strong className="text-cyan-300 truncate block text-[11px] sm:text-xs">{prediction.playerName} ({prediction.playerGoals}g)</strong>
              </div>
            </div>

            {/* Participant Footer */}
            <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 pt-2 border-t border-white/5">
              <span>Picks by: <strong className="text-stone-200">{prediction.displayName || "Participant"}</strong></span>
              <span className="text-[#42bd6c] font-bold">buna-togo.app</span>
            </div>
          </div>

          {/* Social Platform Share Buttons */}
          <div>
            <label className="text-xs font-mono font-bold text-stone-300 uppercase tracking-wider block mb-2.5">
              Share directly to:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              
              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-stone-950 font-bold text-xs transition-all shadow-md hover:scale-105 active:scale-95"
              >
                <MessageCircle size={15} className="shrink-0" />
                <span>WhatsApp</span>
              </a>

              {/* Twitter / X */}
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-black hover:bg-stone-900 border border-stone-700 text-white font-bold text-xs transition-all shadow-md hover:scale-105 active:scale-95"
              >
                <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>X / Twitter</span>
              </a>

              {/* Telegram */}
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1e8ec3] text-white font-bold text-xs transition-all shadow-md hover:scale-105 active:scale-95"
              >
                <Send size={14} className="shrink-0" />
                <span>Telegram</span>
              </a>

              {/* Facebook */}
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs transition-all shadow-md hover:scale-105 active:scale-95"
              >
                <Globe size={14} className="shrink-0" />
                <span>Facebook</span>
              </a>
            </div>
          </div>

          {/* Native Device Share Sheet (Mobile) & Copy Options */}
          <div className="pt-2 border-t border-[#295a3d]/60 flex flex-col sm:flex-row gap-2">
            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-[#42bd6c] hover:from-emerald-400 hover:to-[#42bd6c] text-stone-950 font-bold text-xs font-mono flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <Share2 size={14} />
                <span>Open Device Share Sheet</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyText}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#1a3e29] hover:bg-[#224e38] border border-[#295a3d] text-stone-200 hover:text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedType === "text" ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-300">Picks Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Formatted Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-stone-300 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Copy link to challenge"
            >
              {copiedType === "link" ? (
                <>
                  <Check size={13} className="text-emerald-400" />
                  <span className="text-emerald-300">Link Copied!</span>
                </>
              ) : (
                <>
                  <ExternalLink size={13} />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Modal Footer Note */}
        <div className="p-3 bg-black/50 border-t border-white/5 text-center text-[10px] font-mono text-stone-400">
          <span>Challenge friends to beat your 3-leg football scoreline and goalscorer picks!</span>
        </div>

      </div>
    </div>
  );
}
