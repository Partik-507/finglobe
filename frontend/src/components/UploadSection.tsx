"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { GoldButton } from "./GoldButton";
import { GoldCard } from "./GoldCard";
import { useWallet } from "@/hooks/useWallet";
import { uploadToBackend, UploadMetadata, UploadResponse } from "@/lib/api";
import { formatFileSize, truncateHash, formatTimestamp } from "@/lib/utils";
import { BLOCK_EXPLORER } from "@/lib/contract";

const DOC_TYPES = [
  "Annual Report",
  "ESG Disclosure",
  "Financial Statement",
  "Audit Report",
  "Compliance Document",
  "Board Resolution",
  "Sustainability Report",
  "Other",
];

type UploadStep = "idle" | "hashing" | "uploading" | "registering" | "done" | "error";

export function UploadSection() {
  const { state: walletState, registerProof, isCorrectNetwork } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<UploadStep>("idle");
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [txHash, setTxHash] = useState<string>("");
  const [stepError, setStepError] = useState<string>("");

  // Metadata form
  const [meta, setMeta] = useState<UploadMetadata>({
    issuer: "",
    docType: "Annual Report",
    carbonEmissions: undefined,
    renewableEnergyPct: undefined,
    diversityRatio: undefined,
    liquidity: undefined,
    debtToEquity: undefined,
    auditor: "",
    reportingPeriod: "",
    jurisdiction: "",
    antiCorruptionPolicy: false,
    whistleblowerPolicy: false,
    boardIndependencePct: undefined,
  });

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setResult(null);
      setStep("idle");
      setStepError("");
      setTxHash("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    accept: {
      "application/pdf": [".pdf"],
      "application/json": [".json"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  });

  const handleSubmit = async () => {
    if (!file) { toast.error("Please select a file first"); return; }
    if (walletState !== "connected") { toast.error("Connect your wallet first"); return; }
    if (!isCorrectNetwork) { toast.error("Switch to Polygon Amoy Testnet"); return; }

    try {
      // Step 1: Hash + Encrypt + IPFS
      setStep("hashing");
      toast.loading("Computing SHA-256 hash...", { id: "upload" });

      setStep("uploading");
      toast.loading("Encrypting & uploading to IPFS...", { id: "upload" });
      
      const uploadResult = await uploadToBackend(file, meta);
      setResult(uploadResult);

      // Step 2: Register on-chain
      setStep("registering");
      toast.loading("Registering proof on Polygon Amoy...", { id: "upload" });

      const tx = await registerProof(uploadResult.hash, uploadResult.cid);
      setTxHash(tx);

      setStep("done");
      toast.success("Proof registered on-chain!", { id: "upload" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setStepError(msg);
      setStep("error");
      toast.error(msg.slice(0, 80), { id: "upload" });
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setStep("idle");
    setStepError("");
    setTxHash("");
  };

  const stepLabels: Record<UploadStep, string> = {
    idle: "Ready",
    hashing: "Computing SHA-256...",
    uploading: "Uploading to IPFS...",
    registering: "Anchoring to Blockchain...",
    done: "Proof Registered",
    error: "Error",
  };

  return (
    <section id="upload" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-14 max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 border border-gold-700/30 bg-gold-500/5 px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
            <span className="font-mono text-xs text-gold-400 tracking-[0.2em] uppercase">
              Register Proof
            </span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Upload &{" "}
            <span className="bg-gold-gradient bg-clip-text text-transparent">
              Anchor Your Document
            </span>
          </h2>
          <p className="text-platinum-400 text-lg leading-relaxed">
            SHA-256 hash → AES-256-GCM encrypted → IPFS stored → Blockchain anchored.
            The full cryptographic pipeline in one click.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Drop Zone */}
            <GoldCard delay={0.1} hover={false}>
              <div
                {...getRootProps()}
                className={`
                  p-8 border-2 border-dashed cursor-pointer transition-all duration-300
                  ${isDragActive
                    ? "border-gold-400 bg-gold-500/10"
                    : file
                    ? "border-emerald/40 bg-emerald/5"
                    : "border-white/10 hover:border-gold-600/40 hover:bg-gold-500/5"
                  }
                `}
              >
                <input {...getInputProps()} />
                <div className="text-center">
                  {file ? (
                    <>
                      <div className="w-14 h-14 mx-auto mb-4 bg-emerald/10 border border-emerald/30 flex items-center justify-center">
                        <svg className="w-7 h-7 text-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="font-display text-lg text-white font-semibold mb-1">{file.name}</p>
                      <p className="font-mono text-sm text-platinum-500">{formatFileSize(file.size)} · {file.type}</p>
                      <button onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="mt-3 font-mono text-xs text-crimson/60 hover:text-crimson">
                        Remove file ×
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 mx-auto mb-4 bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                        <svg className="w-7 h-7 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="font-display text-lg text-white font-semibold mb-2">
                        {isDragActive ? "Drop your document here" : "Drag & drop your document"}
                      </p>
                      <p className="font-mono text-sm text-platinum-500 mb-4">or click to browse</p>
                      <p className="font-mono text-xs text-platinum-600">PDF, JSON, TXT, CSV, DOC, DOCX · Max 10MB</p>
                    </>
                  )}
                </div>
              </div>
            </GoldCard>

            {/* Metadata Form */}
            <GoldCard delay={0.2} hover={false} className="p-6">
              <h3 className="font-display text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Document Metadata
                <span className="font-mono text-xs text-platinum-600 font-normal">(optional — for compliance)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Issuer */}
                <div>
                  <label className="font-mono text-xs text-platinum-500 mb-1.5 block uppercase tracking-wider">Issuer / Entity</label>
                  <input
                    type="text" value={meta.issuer || ""} placeholder="e.g. Acme Corp Ltd."
                    onChange={(e) => setMeta({ ...meta, issuer: e.target.value })}
                    className="w-full bg-bg-base border border-white/10 px-3 py-2.5 font-mono text-sm text-white placeholder-platinum-700 focus:outline-none focus:border-gold-600/50 transition-colors"
                  />
                </div>

                {/* Doc Type */}
                <div>
                  <label className="font-mono text-xs text-platinum-500 mb-1.5 block uppercase tracking-wider">Document Type</label>
                  <select
                    value={meta.docType || ""}
                    onChange={(e) => setMeta({ ...meta, docType: e.target.value })}
                    className="w-full bg-bg-base border border-white/10 px-3 py-2.5 font-mono text-sm text-white focus:outline-none focus:border-gold-600/50 transition-colors"
                  >
                    {DOC_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Reporting Period */}
                <div>
                  <label className="font-mono text-xs text-platinum-500 mb-1.5 block uppercase tracking-wider">Reporting Period</label>
                  <input
                    type="text" value={meta.reportingPeriod || ""} placeholder="e.g. 2025-Q4"
                    onChange={(e) => setMeta({ ...meta, reportingPeriod: e.target.value })}
                    className="w-full bg-bg-base border border-white/10 px-3 py-2.5 font-mono text-sm text-white placeholder-platinum-700 focus:outline-none focus:border-gold-600/50 transition-colors"
                  />
                </div>

                {/* Auditor */}
                <div>
                  <label className="font-mono text-xs text-platinum-500 mb-1.5 block uppercase tracking-wider">External Auditor</label>
                  <input
                    type="text" value={meta.auditor || ""} placeholder="e.g. Deloitte"
                    onChange={(e) => setMeta({ ...meta, auditor: e.target.value })}
                    className="w-full bg-bg-base border border-white/10 px-3 py-2.5 font-mono text-sm text-white placeholder-platinum-700 focus:outline-none focus:border-gold-600/50 transition-colors"
                  />
                </div>

                {/* Carbon Emissions */}
                <div>
                  <label className="font-mono text-xs text-platinum-500 mb-1.5 block uppercase tracking-wider">Carbon Emissions (tCO₂e)</label>
                  <input
                    type="number" value={meta.carbonEmissions ?? ""} placeholder="e.g. 450"
                    onChange={(e) => setMeta({ ...meta, carbonEmissions: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full bg-bg-base border border-white/10 px-3 py-2.5 font-mono text-sm text-white placeholder-platinum-700 focus:outline-none focus:border-gold-600/50 transition-colors"
                  />
                </div>

                {/* Diversity Ratio */}
                <div>
                  <label className="font-mono text-xs text-platinum-500 mb-1.5 block uppercase tracking-wider">Diversity Ratio (0–1)</label>
                  <input
                    type="number" step="0.01" min="0" max="1" value={meta.diversityRatio ?? ""} placeholder="e.g. 0.45"
                    onChange={(e) => setMeta({ ...meta, diversityRatio: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full bg-bg-base border border-white/10 px-3 py-2.5 font-mono text-sm text-white placeholder-platinum-700 focus:outline-none focus:border-gold-600/50 transition-colors"
                  />
                </div>

                {/* Liquidity */}
                <div>
                  <label className="font-mono text-xs text-platinum-500 mb-1.5 block uppercase tracking-wider">Liquidity Ratio</label>
                  <input
                    type="number" step="0.01" value={meta.liquidity ?? ""} placeholder="e.g. 2.1"
                    onChange={(e) => setMeta({ ...meta, liquidity: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full bg-bg-base border border-white/10 px-3 py-2.5 font-mono text-sm text-white placeholder-platinum-700 focus:outline-none focus:border-gold-600/50 transition-colors"
                  />
                </div>

                {/* Jurisdiction */}
                <div>
                  <label className="font-mono text-xs text-platinum-500 mb-1.5 block uppercase tracking-wider">Jurisdiction</label>
                  <input
                    type="text" value={meta.jurisdiction || ""} placeholder="e.g. EU / US / IN"
                    onChange={(e) => setMeta({ ...meta, jurisdiction: e.target.value })}
                    className="w-full bg-bg-base border border-white/10 px-3 py-2.5 font-mono text-sm text-white placeholder-platinum-700 focus:outline-none focus:border-gold-600/50 transition-colors"
                  />
                </div>

                {/* Toggles */}
                <div className="sm:col-span-2 flex gap-8">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setMeta({ ...meta, antiCorruptionPolicy: !meta.antiCorruptionPolicy })}
                      className={`w-10 h-5 border transition-all ${meta.antiCorruptionPolicy ? "bg-gold-500 border-gold-400" : "bg-bg-base border-white/20"} relative`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white transition-transform ${meta.antiCorruptionPolicy ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                    <span className="font-mono text-xs text-platinum-400">Anti-Corruption Policy</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setMeta({ ...meta, whistleblowerPolicy: !meta.whistleblowerPolicy })}
                      className={`w-10 h-5 border transition-all ${meta.whistleblowerPolicy ? "bg-gold-500 border-gold-400" : "bg-bg-base border-white/20"} relative`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white transition-transform ${meta.whistleblowerPolicy ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                    <span className="font-mono text-xs text-platinum-400">Whistleblower Policy</span>
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="mt-6 pt-5 border-t border-white/5">
                <div className="flex flex-wrap items-center gap-4">
                  <GoldButton
                    onClick={handleSubmit}
                    disabled={!file || step !== "idle"}
                    loading={["hashing", "uploading", "registering"].includes(step)}
                    size="lg"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    }
                  >
                    Register Financial Proof
                  </GoldButton>

                  {step !== "idle" && step !== "done" && (
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${step === "error" ? "bg-crimson" : "bg-gold-400 animate-pulse"}`} />
                      <span className="font-mono text-sm text-platinum-400">{stepLabels[step]}</span>
                    </div>
                  )}

                  {step === "done" && (
                    <button onClick={reset} className="font-mono text-sm text-platinum-500 hover:text-white transition-colors">
                      Register another →
                    </button>
                  )}
                </div>

                {step === "error" && (
                  <div className="mt-4 p-3 border border-crimson/30 bg-crimson/5">
                    <p className="font-mono text-sm text-crimson">{stepError}</p>
                  </div>
                )}

                {walletState !== "connected" && (
                  <p className="mt-4 font-mono text-xs text-platinum-600">
                    ⚠ Connect your MetaMask wallet to register proofs on-chain
                  </p>
                )}
              </div>
            </GoldCard>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {step === "idle" && !result && (
                <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <GoldCard delay={0.3} className="p-6">
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-5 bg-gold-500/5 border border-gold-700/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gold-600/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <p className="font-display text-lg text-white/40 mb-2">Awaiting Document</p>
                      <p className="font-mono text-xs text-platinum-700">Upload and submit to generate your cryptographic proof</p>
                    </div>
                  </GoldCard>
                </motion.div>
              )}

              {result && (
                <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }} className="space-y-4">
                  
                  {/* Status Card */}
                  <GoldCard hover={false} className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald/10 border border-emerald/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-display text-base font-semibold text-white">Proof Registered</div>
                        <div className="font-mono text-xs text-emerald">{result.mockMode ? "Mock Mode" : "On-Chain"} · IPFS Stored</div>
                      </div>
                    </div>

                    {/* Hash */}
                    <div className="mb-3">
                      <div className="font-mono text-xs text-platinum-600 mb-1 uppercase tracking-wider">SHA-256 Hash</div>
                      <div className="font-mono text-xs text-gold-300 bg-bg-base border border-white/5 p-2 break-all">
                        {result.hash}
                      </div>
                    </div>

                    {/* CID */}
                    <div className="mb-3">
                      <div className="font-mono text-xs text-platinum-600 mb-1 uppercase tracking-wider">IPFS CID</div>
                      <a href={result.ipfsUrl} target="_blank" rel="noreferrer"
                        className="font-mono text-xs text-electric hover:text-white bg-bg-base border border-white/5 p-2 break-all block transition-colors">
                        {result.cid}
                      </a>
                    </div>

                    {/* TX Hash */}
                    {txHash && (
                      <div className="mb-3">
                        <div className="font-mono text-xs text-platinum-600 mb-1 uppercase tracking-wider">Transaction Hash</div>
                        <a href={`${BLOCK_EXPLORER}/tx/${txHash}`} target="_blank" rel="noreferrer"
                          className="font-mono text-xs text-electric hover:text-white bg-bg-base border border-white/5 p-2 break-all block transition-colors">
                          {truncateHash(txHash, 8)}
                        </a>
                      </div>
                    )}

                    {/* Encryption */}
                    <div className="bg-bg-base border border-white/5 p-3 mt-3">
                      <div className="font-mono text-xs text-platinum-600 mb-2">Encryption</div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-platinum-500">Algorithm</span>
                        <span className="text-white">{result.encryption.algorithm}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-platinum-500">IV</span>
                        <span className="text-white">{result.encryption.iv.slice(0, 16)}...</span>
                      </div>
                    </div>
                  </GoldCard>

                  {/* Compliance Badges */}
                  <GoldCard hover={false} className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-display font-semibold text-white text-base">Compliance Score</h4>
                      <div className={`font-mono text-xs px-3 py-1 border ${
                        result.compliance.overall === "COMPLIANT" 
                          ? "text-emerald border-emerald/30 bg-emerald/5"
                          : result.compliance.overall === "PARTIAL"
                          ? "text-gold-400 border-gold-700/30 bg-gold-500/5"
                          : "text-crimson border-crimson/30 bg-crimson/5"
                      }`}>
                        {result.compliance.overall}
                      </div>
                    </div>

                    {/* Score Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between font-mono text-xs mb-1.5">
                        <span className="text-platinum-500">Overall Score</span>
                        <span className="text-gold-300">{result.compliance.score}/100</span>
                      </div>
                      <div className="h-1.5 bg-bg-base border border-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${result.compliance.score}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gold-gradient"
                        />
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {result.compliance.badges.slice(0, 8).map((badge) => (
                        <span key={badge}
                          className="font-mono text-[10px] px-2 py-1 border border-gold-700/30 text-gold-400 bg-gold-500/5 uppercase tracking-wide">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </GoldCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
