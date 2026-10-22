import React, { useState } from "react";
import { Download, Copy, Check, X, Sparkles, Layers, FileCode, Eye, Image as ImageIcon } from "lucide-react";

interface HattrickLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HattrickLogoModal: React.FC<HattrickLogoModalProps> = ({ isOpen, onClose }) => {
  const [activeView, setActiveView] = useState<"emblem" | "full_lockup" | "vector_light" | "vector_dark">("emblem");
  const [copied, setCopied] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);

  if (!isOpen) return null;

  // Handle direct download of raw SVG vector
  const handleDownloadSvg = () => {
    const fileName = activeView === "vector_dark" ? "hattrick-coffee-logo-dark.svg" : "hattrick-coffee-logo.svg";
    const link = document.createElement("a");
    link.href = `/${fileName}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle direct download of image assets
  const handleDownloadAsset = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle PNG generation for vectors
  const handleDownloadPng = async () => {
    if (activeView === "emblem") {
      handleDownloadAsset("/assets/aistudio/hattrick_emblem_cropped.png", "hattrick-coffee-emblem-transparent.png");
      return;
    }
    if (activeView === "full_lockup") {
      handleDownloadAsset("/assets/aistudio/image_6c7db08c.png", "hattrick-coffee-full-lockup.png");
      return;
    }

    setDownloadingPng(true);
    try {
      const fileName = activeView === "vector_dark" ? "hattrick-coffee-logo-dark.svg" : "hattrick-coffee-logo.svg";
      const response = await fetch(`/${fileName}`);
      const svgText = await response.text();

      const img = new Image();
      const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const blobURL = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const width = 2200;
        const height = 880;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          if (activeView === "vector_dark") {
            ctx.fillStyle = "#0c0a09";
          } else {
            ctx.fillStyle = "#faf7f2";
          }
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const pngData = canvas.toDataURL("image/png");
          const dlLink = document.createElement("a");
          dlLink.download = `${fileName.replace(".svg", "")}-hires.png`;
          dlLink.href = pngData;
          document.body.appendChild(dlLink);
          dlLink.click();
          document.body.removeChild(dlLink);
        }
        URL.revokeObjectURL(blobURL);
        setDownloadingPng(false);
      };
      img.src = blobURL;
    } catch (err) {
      console.error("Error exporting PNG:", err);
      setDownloadingPng(false);
    }
  };

  // Copy raw SVG vector code to clipboard
  const handleCopySvgCode = async () => {
    try {
      const fileName = activeView === "vector_dark" ? "hattrick-coffee-logo-dark.svg" : "hattrick-coffee-logo.svg";
      const response = await fetch(`/${fileName}`);
      const svgText = await response.text();
      await navigator.clipboard.writeText(svgText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#111111] border border-amber-500/30 rounded-3xl shadow-[0_0_80px_rgba(212,175,55,0.2)] overflow-hidden my-auto">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-[#161616]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                HATTRICK COFFEE Brand Asset
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Official Asset
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Hawassa, Ethiopia • Coffee Shop & Sports Lounge Corporate Identity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-stone-800 bg-[#141414] text-xs overflow-x-auto">
          <button
            onClick={() => setActiveView("emblem")}
            className={`px-3 py-2 rounded-t-lg font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeView === "emblem"
                ? "bg-[#1f1f1f] text-amber-300 border-t-2 border-amber-400"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <ImageIcon size={14} />
            <span>Exact Attached Emblem</span>
          </button>

          <button
            onClick={() => setActiveView("full_lockup")}
            className={`px-3 py-2 rounded-t-lg font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeView === "full_lockup"
                ? "bg-[#1f1f1f] text-amber-300 border-t-2 border-amber-400"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Eye size={14} />
            <span>Full Lockup (Image)</span>
          </button>

          <button
            onClick={() => setActiveView("vector_light")}
            className={`px-3 py-2 rounded-t-lg font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeView === "vector_light"
                ? "bg-[#1f1f1f] text-amber-300 border-t-2 border-amber-400"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Layers size={14} />
            <span>Light Vector SVG</span>
          </button>

          <button
            onClick={() => setActiveView("vector_dark")}
            className={`px-3 py-2 rounded-t-lg font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeView === "vector_dark"
                ? "bg-[#1f1f1f] text-amber-300 border-t-2 border-amber-400"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Sparkles size={14} />
            <span>Dark Vector SVG</span>
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="p-6 flex flex-col gap-6">
          {/* Main Visual Display Canvas */}
          <div
            className={`w-full rounded-2xl overflow-hidden border-2 border-stone-800 flex items-center justify-center p-6 sm:p-10 transition-colors duration-300 min-h-[300px] ${
              activeView === "vector_dark"
                ? "bg-[#0b0a09]"
                : "bg-[#fbf8f3]"
            }`}
          >
            {activeView === "emblem" && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-mono text-stone-500 uppercase tracking-widest mb-2 font-bold">
                    Official Master JPG
                  </span>
                  <img
                    src="/assets/aistudio/logo_714966a9.jpg"
                    alt="Hattrick Coffee Exact Emblem"
                    className="max-h-64 w-auto object-contain rounded-xl shadow-xl border border-stone-200 select-none"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-mono text-stone-500 uppercase tracking-widest mb-2 font-bold">
                    Extracted Transparent PNG
                  </span>
                  <div className="p-4 rounded-xl bg-black/5 border border-stone-300/40">
                    <img
                      src="/assets/aistudio/hattrick_emblem_cropped.png"
                      alt="Hattrick Coffee Transparent Emblem"
                      className="max-h-56 w-auto object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.3)] select-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeView === "full_lockup" && (
              <img
                src="/assets/aistudio/image_6c7db08c.png"
                alt="Hattrick Coffee Official Reference Logo"
                className="max-h-72 w-auto object-contain filter drop-shadow-md select-none"
              />
            )}

            {activeView === "vector_light" && (
              <img
                src="/hattrick-coffee-logo.svg"
                alt="Hattrick Coffee Light Vector Logo"
                className="max-h-72 w-full object-contain filter drop-shadow-md select-none"
              />
            )}

            {activeView === "vector_dark" && (
              <img
                src="/hattrick-coffee-logo-dark.svg"
                alt="Hattrick Coffee Dark Vector Logo"
                className="max-h-72 w-full object-contain filter drop-shadow-lg select-none"
              />
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeView === "emblem" ? (
              <>
                <button
                  onClick={() => handleDownloadAsset("/assets/aistudio/logo_714966a9.jpg", "hattrick-coffee-emblem-original.jpg")}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Original JPG</span>
                </button>

                <button
                  onClick={() => handleDownloadAsset("/assets/aistudio/hattrick_emblem_cropped.png", "hattrick-coffee-emblem-transparent.png")}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs transition-colors border border-stone-700 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Transparent PNG</span>
                </button>

                <button
                  onClick={handleDownloadSvg}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs transition-colors border border-stone-700 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Vector SVG</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleDownloadSvg}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Vector SVG</span>
                </button>

                <button
                  onClick={handleDownloadPng}
                  disabled={downloadingPng}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs transition-colors border border-stone-700 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadingPng ? "Rendering..." : "Download High-Res PNG"}</span>
                </button>

                <button
                  onClick={handleCopySvgCode}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs transition-colors border border-stone-700 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <FileCode className="w-4 h-4" />}
                  <span>{copied ? "SVG Code Copied!" : "Copy SVG Source Code"}</span>
                </button>
              </>
            )}
          </div>

          {/* Guidelines & Spec Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-300">
            <div className="p-4 rounded-xl bg-[#161616] border border-stone-800">
              <h4 className="font-bold text-white mb-1.5 text-sm flex items-center gap-1.5">
                <span className="text-amber-400">⚽</span> Exact Attached Emblem
              </h4>
              <p className="text-stone-400 leading-relaxed">
                Matches 100% pixel-for-pixel with your uploaded file: authentic 3D faceted espresso panels, alternating cream patches, golden beveled rim, and smooth flowing S-curve fissure.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#161616] border border-stone-800">
              <h4 className="font-bold text-white mb-1.5 text-sm flex items-center gap-1.5">
                <span className="text-amber-400">✨</span> Transparent Cutout
              </h4>
              <p className="text-stone-400 leading-relaxed">
                Cleanly masked with sub-pixel anti-aliasing so the golden rim sits smoothly on dark or light backgrounds with no white borders.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#161616] border border-stone-800">
              <h4 className="font-bold text-white mb-1.5 text-sm flex items-center gap-1.5">
                <span className="text-amber-400">📍</span> Hawassa, Ethiopia
              </h4>
              <p className="text-stone-400 leading-relaxed">
                Bilingual corporate identity featuring English typography and genuine Ethiopian Amharic script (<span className="text-amber-400 font-serif">ሃትሪክ ቡና</span>).
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HattrickLogoModal;
