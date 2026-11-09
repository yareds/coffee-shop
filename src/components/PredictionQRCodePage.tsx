import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { 
  QrCode, Copy, Check, Download, Printer, ArrowLeft, ExternalLink, 
  Sparkles, Coffee, Trophy, Smartphone, ShieldCheck, Maximize2, Minimize2,
  Share2
} from "lucide-react";
import BunaLogo from "./BunaLogo";

interface PredictionQRCodePageProps {
  onBack: () => void;
  targetUrl?: string;
}

export const PredictionQRCodePage: React.FC<PredictionQRCodePageProps> = ({
  onBack,
  targetUrl: propTargetUrl
}) => {
  const [copied, setCopied] = useState(false);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute the live prediction slip URL
  const [resolvedUrl, setResolvedUrl] = useState<string>(() => {
    if (propTargetUrl) return propTargetUrl;
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      // In production or preview, point directly to the #prize matchday slip
      return `${origin}/#prize`;
    }
    return "https://hattrick-cafe.web.app/#prize";
  });

  useEffect(() => {
    if (typeof window !== "undefined" && !propTargetUrl) {
      setResolvedUrl(`${window.location.origin}/#prize`);
    }
  }, [propTargetUrl]);

  // Generate QR Code with high error correction and optional center emblem
  useEffect(() => {
    let isCancelled = false;

    const generateQR = async () => {
      try {
        const canvas = document.createElement("canvas");
        const qrSize = 720;
        canvas.width = qrSize;
        canvas.height = qrSize;

        // Level 'H' allows ~30% error correction, safe for central logo emblem
        await QRCode.toCanvas(canvas, resolvedUrl, {
          width: qrSize,
          margin: 3,
          errorCorrectionLevel: "H",
          color: {
            dark: "#0e1e14", // Deep rich espresso highland green
            light: "#ffffff",
          },
        });

        if (includeLogo) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const logo = new Image();
            logo.crossOrigin = "anonymous";
            logo.src = "/assets/aistudio/hattrick_emblem_cropped.png";

            await new Promise((resolve) => {
              logo.onload = () => {
                const logoSize = qrSize * 0.22; // ~158px
                const x = (qrSize - logoSize) / 2;
                const y = (qrSize - logoSize) / 2;

                // Circular white background backing with gold ring
                ctx.save();
                ctx.beginPath();
                ctx.arc(qrSize / 2, qrSize / 2, logoSize / 2 + 8, 0, Math.PI * 2);
                ctx.fillStyle = "#ffffff";
                ctx.fill();
                ctx.lineWidth = 4;
                ctx.strokeStyle = "#c89d7c"; // Warm Ethiopian coffee gold
                ctx.stroke();

                // Draw soccer ball emblem
                ctx.beginPath();
                ctx.arc(qrSize / 2, qrSize / 2, logoSize / 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(logo, x, y, logoSize, logoSize);
                ctx.restore();
                resolve(true);
              };
              logo.onerror = () => {
                // If logo load fails, keep raw QR
                resolve(true);
              };
            });
          }
        }

        if (!isCancelled) {
          const url = canvas.toDataURL("image/png");
          setQrDataUrl(url);

          // If canvas ref exists, draw onto it
          if (canvasRef.current) {
            const displayCtx = canvasRef.current.getContext("2d");
            if (displayCtx) {
              canvasRef.current.width = qrSize;
              canvasRef.current.height = qrSize;
              displayCtx.drawImage(canvas, 0, 0);
            }
          }
        }
      } catch (err) {
        console.error("Failed to generate QR code:", err);
      }
    };

    generateQR();
    return () => {
      isCancelled = true;
    };
  }, [resolvedUrl, includeLogo]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resolvedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "hattrick-cafe-matchday-qr.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 sm:py-8 text-stone-100 print:p-0 print:m-0 print:max-w-none">
      
      {/* Print-specific style overrides */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, footer, nav, .no-print {
            display: none !important;
          }
          .print-card {
            border: 2px solid #333 !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            page-break-inside: avoid;
            margin: 0 auto !important;
            max-width: 500px !important;
            padding: 24px !important;
          }
          .print-card * {
            color: black !important;
          }
          .print-qr-image {
            max-width: 320px !important;
            margin: 0 auto !important;
          }
        }
      `}</style>

      {/* Top Header & Back Navigation */}
      <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8 no-print">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#122b1c] hover:bg-[#1a3e29] border border-[#295a3d] text-stone-200 hover:text-amber-300 text-xs sm:text-sm font-semibold transition-all shadow-md group cursor-pointer"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1 text-[#42bd6c]" />
          <span>Back to Match Day</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE SCANNER
          </span>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-[#122b1c] hover:bg-[#1a3e29] border border-[#295a3d] text-stone-300 hover:text-white transition-all cursor-pointer shadow-md"
            title={isFullscreen ? "Exit kiosk presentation" : "Counter tablet kiosk mode"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* MAIN QR PRESENTATION CARD */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#132c1e] via-[#0d2015] to-[#07130c] border-2 border-[#295a3d] shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-6 sm:p-10 text-center print-card">
        
        {/* Subtle Ambient Background Corner Glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[#42bd6c]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-[#c89d7c]/10 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center relative z-10 mb-6">
          <div className="mb-3">
            <BunaLogo size="lg" onClick={onBack} />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Trophy size={13} className="text-amber-400 shrink-0" />
            <span>Weekly Match Day Challenge</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black font-display text-white tracking-tight leading-tight">
            Scan to Open Prediction Slip
          </h1>
          <p className="font-serif font-bold text-amber-400 text-sm sm:text-base mt-1">
            በስልክዎ ስካን በማድረግ የጨዋታ ግምቶችን ይሳተፉ
          </p>
          <p className="text-xs sm:text-sm text-stone-300 max-w-md mx-auto mt-2 leading-relaxed">
            Point your phone camera at the QR code below to jump directly to this weekend's 3-leg football challenge. 100% free entry!
          </p>
        </div>

        {/* QR CODE CONTAINER - HIGH CONTRAST & CLEARLY VISIBLE */}
        <div className="relative z-10 flex flex-col items-center justify-center my-4">
          <div className="relative p-4 sm:p-6 rounded-3xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.7)] border-4 border-amber-400/80 transition-transform duration-300 hover:scale-[1.01] print:border-2 print:border-black">
            
            {/* Visual Corner Finder Guides */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-600 rounded-tl" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-600 rounded-tr" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-600 rounded-bl" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-600 rounded-br" />

            {/* Scannable QR Code Image */}
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Hattrick Cafe Match Day Prediction Slip QR Code"
                className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 object-contain select-none print-qr-image"
              />
            ) : (
              <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center bg-stone-100 text-stone-600">
                <span className="font-mono text-sm animate-pulse">Generating High-Res QR...</span>
              </div>
            )}

            {/* Quiet-zone Bottom Tag for In-Store Counter Placement */}
            <div className="mt-2 text-center text-stone-800 font-mono font-bold text-[10px] tracking-wider uppercase border-t border-stone-200 pt-1.5 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>HATTRICK CAFE • PREDICTION SLIP</span>
            </div>
          </div>

          {/* Quick Scanner Helper Badge */}
          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#183a25] border border-[#2d824d]/60 text-xs text-stone-200 shadow-md">
            <Smartphone size={14} className="text-[#42bd6c] shrink-0" />
            <span>Camera ready • Works on iOS & Android</span>
          </div>
        </div>

        {/* 3 Simple In-Store Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6 text-left max-w-xl mx-auto">
          <div className="p-3 rounded-xl bg-[#0a1a11]/80 border border-[#295a3d]/60 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#1a3e29] text-[#42bd6c] font-black font-mono text-sm flex items-center justify-center shrink-0 border border-[#42bd6c]/40">
              1
            </div>
            <div>
              <p className="text-xs font-bold text-white">Open Camera</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Point phone at code</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0a1a11]/80 border border-[#295a3d]/60 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#1a3e29] text-[#42bd6c] font-black font-mono text-sm flex items-center justify-center shrink-0 border border-[#42bd6c]/40">
              2
            </div>
            <div>
              <p className="text-xs font-bold text-white">Tap Notification</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Opens prediction slip</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0a1a11]/80 border border-[#295a3d]/60 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#1a3e29] text-[#42bd6c] font-black font-mono text-sm flex items-center justify-center shrink-0 border border-[#42bd6c]/40">
              3
            </div>
            <div>
              <p className="text-xs font-bold text-white">Win Rewards</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Free Buna in Hawassa</p>
            </div>
          </div>
        </div>

        {/* Target URL Display with Direct Link */}
        <div className="max-w-xl mx-auto my-4 p-3 rounded-xl bg-black/40 border border-[#295a3d] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 shrink-0">URL:</span>
            <span className="font-mono text-amber-300 truncate text-[11px] select-all">
              {resolvedUrl}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a3e29] hover:bg-[#235338] border border-[#42bd6c]/40 text-stone-200 text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-400" />
                  <span className="text-emerald-300 font-mono">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} className="text-stone-300" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <a
              href={resolvedUrl}
              onClick={(e) => {
                e.preventDefault();
                onBack();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <span>Open Slip</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* ACTION UTILITY BUTTONS (DOWNLOAD, PRINT, LOGO TOGGLE) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6 pt-6 border-t border-[#295a3d]/70 no-print">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
          >
            <Download size={15} />
            <span>Download High-Res PNG</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a3e29] hover:bg-[#235338] border border-[#2d824d] text-stone-200 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md"
          >
            <Printer size={15} className="text-amber-400" />
            <span>Print Counter Standee</span>
          </button>

          <button
            type="button"
            onClick={() => setIncludeLogo(!includeLogo)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-black/40 hover:bg-black/60 border border-stone-700 text-stone-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <Sparkles size={14} className={includeLogo ? "text-amber-400" : "text-stone-500"} />
            <span>{includeLogo ? "Center Logo: ON" : "Center Logo: OFF"}</span>
          </button>
        </div>

      </div>

      {/* In-Cafe Counter Display Guide */}
      <div className="mt-8 p-5 rounded-2xl bg-[#0f2519]/70 border border-[#295a3d]/50 text-xs text-stone-300 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1a3e29] border border-[#42bd6c]/30 flex items-center justify-center shrink-0 text-amber-400">
            <Coffee size={20} />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Cafe Table Stand & Counter Use</h4>
            <p className="text-stone-300 mt-0.5 leading-relaxed text-xs">
              Print this code on acrylic counter displays, table tents, or to-go cup sleeves for patrons watching weekend matches live on DSTV at Hattrick Cafe Hawassa.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="shrink-0 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs transition-colors cursor-pointer"
        >
          Print Now
        </button>
      </div>

    </div>
  );
};

export default PredictionQRCodePage;
