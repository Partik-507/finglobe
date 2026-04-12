"use client";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { GoldButton } from "./GoldButton";
import { GoldCard } from "./GoldCard";
import { useWallet, ProofData } from "@/hooks/useWallet";
import { computeHashClientSide } from "@/lib/api";
import { formatFileSize, formatTimestamp } from "@/lib/utils";
import { BLOCK_EXPLORER } from "@/lib/contract";

type VerifyStep = "idle" | "hashing" | "querying" | "done" | "error";

interface VerifyResult {
  hash: string;
  proofData: ProofData;
  filename: string;
  fileSize: number;
}

export function VerifySection() {
  const { state: walletState, verifyProof } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<VerifyStep>("idle");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [stepError, setStepError] = useState("");
  const [manualHash, setManualHash] = useState("");
  const [mode, setMode] = useState<"file" | "hash">("file");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => {
      if (accepted[0]) {
        setFile(accepted[0]);
        setResult(null);
        setStep("idle");
        setStepError("");
      }
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
  });

  const handleVerify = async () => {
    if (walletState !== "connected") {
      toast.error("Connect your wallet to verify proofs");
      return;
    }

    try {
      let hash: string;

      if (mode === "file") {
        if (!file) { toast.error("Please select a file"); return; }
        setStep("hashing");
        toast.loading("Computing hash...", { id: "verify" });
        hash = await computeHashClientSide(file);
      } else {
        hash = manualHash.trim();
        if (!hash) { toast.error("Please enter a hash"); return; }
        if (!hash.startsWith("0x")) hash = "0x" + hash;
      }

      setStep("querying");
      toast.loading("Querying blockchain...", { id: "verify" });
      const proofData = await verifyProof(hash);

      if (!proofData) throw new Error("Could not retrieve proof data");

      setResult({
        hash,
        proofData,
        filename: file?.name || "Manual Hash",
        fileSize: file?.size || 0,
      });
      setStep("done");
      
      if (proofData.exists) {
        toast.success("✓ Document verified — AUTHENTIC", { id: "verify" });
      } else {
        toast.error("✗ Hash not found — TAMPERED or UNREGISTERED", { id: "verify" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setStepError(msg);
      setStep("error");
      toast.error(msg.slice(0, 80), { id: "verify" });
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setStep("idle");
    setStepError("");
    setManualHash("");
  };

  return (
    <section id="verify" className="py-24 relative bg-bg-surface/40">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-14 max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 border border-gold-700/30 bg-gold-500/5 px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
            <span className="font-mono text-xs text-gold-400 tracking-[0.2em] uppercase">
              Verify Proof
            </span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Detect{" "}
            <span className="bg-gold-gradient bg-clip-text text-transparent">
              Tampering Instantly
            </span>
          </h2>
          <p className="text-platinum-400 text-lg leading-relaxed">
            Upload the same document or paste its hash. We query the blockchain in real time — 
            any modification renders the hash invalid.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Input */}
          <div className="space-y-5">
            {/* Mode Toggle */}
            <div className="flex border border-white/10 p-0.5 w-fit">
              <button
                onClick={() => setMode("file")}
                className={`font-mono text-xs px-5 py-2.5 transition-all ${
                  mode === "file" ? "bg-gold-600/20 text-gold-300 border border-gold-700/30" : "text-platinum-500 hover:text-white"
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setMode("hash")}
                className={`font-mono text-xs px-5 py-2.5 transition-all ${
                  mode === "hash" ? "bg-gold-600/20 text-gold-300 border border-gold-700/30" : "text-platinum-500 hover:text-white"
                }`}
              >
                Enter Hash
              </button>
            </div>

            <GoldCard delay={0.1} hover={false} className="overflow-hidden">
              {mode === "file" ? (
                <div
                  {...getRootProps()}
                  className={`p-8 border-2 border-dashed cursor-pointer transition-all duration-300 ${
                    isDragActive ? "border-gold-400 bg-gold-500/10"
                    : file ? "border-emerald/40 bg-emerald/5"
                    : "border-white/10 hover:border-gold-600/40 hover:bg-gold-500/5"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="text-center">
                    {file ? (
                      <>
                        <div className="w-12 h-12 mx-auto mb-3 bg-emerald/10 border border-emerald/30 flex items-center justify-center">
                          <svg className="w-6 h-6 text-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="font-display text-base font-semibold text-white mb-1">{file.name}</p>
                        <p className="font-mono text-xs text-platinum-500">{formatFileSize(file.size)}</p>
                        <button onClick={(e) => { e.stopPropagation(); setFile(null); }}
                          className="mt-2 font-mono text-xs text-crimson/60 hover:text-crimson">Remove ×</button>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 mx-auto mb-3 bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <p className="font-display text-base font-semibold text-white mb-1">
                          {isDragActive ? "Drop here..." : "Drop the document to verify"}
                        </p>
                        <p className="font-mono text-xs text-platinum-600">Or click to browse any file type</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <label className="font-mono text-xs text-platinum-500 mb-2 block uppercase tracking-wider">
                    Document Hash (0x-prefixed bytes32)
                  </label>
                  <textarea
                    value={manualHash}
                    onChange={(e) => setManualHash(e.target.value)}
                    placeholder="0x1a2b3c4d5e6f..."
                    rows={3}
                    className="w-full bg-bg-base border border-white/10 px-3 py-2.5 font-mono text-sm text-white placeholder-platinum-700 focus:outline-none focus:border-gold-600/50 resize-none transition-colors"
                  />
                  <p className="font-mono text-xs text-platinum-700 mt-2">
                    Paste the SHA-256 hash returned from your upload receipt
                  </p>
                </div>
              )}
            </GoldCard>

            <GoldButton
              onClick={handleVerify}
              disabled={step === "hashing" || step === "querying"}
              loading={step === "hashing" || step === "querying"}
              size="lg"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
            >
              {step === "hashing" ? "Computing Hash..." : step === "querying" ? "Querying Blockchain..." : "Verify Document"}
            </GoldButton>

            {step === "error" && (
              <div className="p-3 border border-crimson/30 bg-crimson/5">
                <p className="font-mono text-sm text-crimson">{stepError}</p>
              </div>
            )}

            {walletState !== "connected" && (
              <p className="font-mono text-xs text-platinum-600">⚠ Connect your wallet to verify proofs on-chain</p>
            )}
          </div>

          {/* Right: Result */}
          <div>
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <GoldCard delay={0.3} className="p-8 h-full min-h-[360px]">
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <div className="w-20 h-20 mx-auto mb-6 border border-white/10 flex items-center justify-center">
                        <svg className="w-10 h-10 text-platinum-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.75}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <p className="font-display text-xl text-white/30 mb-3">Verification Result</p>
                      <p className="font-mono text-xs text-platinum-700 max-w-xs">
                        Submit a document or hash to query the blockchain for its registered proof
                      </p>
                    </div>
                  </GoldCard>
                </motion.div>
              ) : (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}>
                  <GoldCard hover={false} className={`p-7 border-2 ${
                    result.proofData.exists ? "border-emerald/30" : "border-crimson/30"
                  }`}>
                    {/* Verdict */}
                    <div className="text-center mb-8">
                      <div className={`w-20 h-20 mx-auto mb-5 border-2 flex items-center justify-center ${
                        result.proofData.exists
                          ? "border-emerald/40 bg-emerald/10"
                          : "border-crimson/40 bg-crimson/10"
                      }`}>
                        {result.proofData.exists ? (
                          <svg className="w-10 h-10 text-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-10 h-10 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>

                      <div className={`font-display text-3xl font-bold mb-2 ${
                        result.proofData.exists ? "text-emerald" : "text-crimson"
                      }`}>
                        {result.proofData.exists ? "AUTHENTIC" : "TAMPERED"}
                      </div>
                      <div className="font-mono text-sm text-platinum-500">
                        {result.proofData.exists
                          ? "Hash found on blockchain — document is unmodified"
                          : "Hash not registered — document may have been tampered with"}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      <div className="bg-bg-base border border-white/5 p-3">
                        <div className="font-mono text-xs text-platinum-600 mb-1 uppercase tracking-wider">Queried Hash</div>
                        <div className="font-mono text-xs text-gold-300 break-all">{result.hash}</div>
                      </div>

                      {result.proofData.exists && (
                        <>
                          <div className="bg-bg-base border border-white/5 p-3">
                            <div className="font-mono text-xs text-platinum-600 mb-1 uppercase tracking-wider">IPFS CID</div>
                            <div className="font-mono text-xs text-electric break-all">{result.proofData.cid}</div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-bg-base border border-white/5 p-3">
                              <div className="font-mono text-xs text-platinum-600 mb-1 uppercase tracking-wider">Registered</div>
                              <div className="font-mono text-xs text-white">
                                {formatTimestamp(Number(result.proofData.timestamp))}
                              </div>
                            </div>
                            <div className="bg-bg-base border border-white/5 p-3">
                              <div className="font-mono text-xs text-platinum-600 mb-1 uppercase tracking-wider">Issuer</div>
                              <div className="font-mono text-xs text-white">
                                {result.proofData.issuer.slice(0, 10)}...
                              </div>
                              <a href={`${BLOCK_EXPLORER}/address/${result.proofData.issuer}`}
                                target="_blank" rel="noreferrer"
                                className="font-mono text-[10px] text-electric hover:text-white transition-colors">
                                View on Explorer →
                              </a>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-5 flex gap-3">
                      <GoldButton variant="secondary" size="sm" onClick={reset}>
                        Verify Another
                      </GoldButton>
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
