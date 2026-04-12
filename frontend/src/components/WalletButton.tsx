"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/hooks/useWallet";
import { GoldButton } from "./GoldButton";
import { truncateAddress } from "@/lib/utils";
import { useState } from "react";

export function WalletButton() {
  const { state, wallet, error, connect, disconnect, switchToAmoy, isCorrectNetwork } =
    useWallet();
  const [showMenu, setShowMenu] = useState(false);

  if (state === "disconnected" || state === "connecting") {
    return (
      <GoldButton
        onClick={connect}
        loading={state === "connecting"}
        size="sm"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
      >
        Connect Wallet
      </GoldButton>
    );
  }

  if (state === "wrong_network") {
    return (
      <GoldButton variant="danger" size="sm" onClick={switchToAmoy}
        icon={<span className="w-2 h-2 rounded-full bg-crimson animate-pulse" />}
      >
        Switch to Amoy
      </GoldButton>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu((v) => !v)}
        className="flex items-center gap-3 px-4 py-2 border border-gold-700/30 bg-bg-card hover:border-gold-500/40 hover:bg-bg-elevated transition-all duration-200"
      >
        <span className="w-2 h-2 rounded-full bg-emerald animate-pulse shrink-0" />
        <span className="font-mono text-sm text-gold-300">
          {wallet?.shortAddress}
        </span>
        <span className="font-mono text-xs text-platinum-500 hidden sm:block">
          {wallet?.balance} MATIC
        </span>
        <svg className="w-4 h-4 text-platinum-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-72 border border-gold-700/20 bg-bg-elevated shadow-gold z-50"
          >
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-sm bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="font-mono text-sm text-white">{wallet?.shortAddress}</div>
                  <div className="font-mono text-xs text-platinum-500">{wallet?.chainName}</div>
                </div>
              </div>
              <div className="font-mono text-xs text-platinum-400 break-all bg-bg-card p-2 border border-white/5">
                {wallet?.address}
              </div>
            </div>
            <div className="p-3 space-y-1">
              <div className="flex justify-between px-2 py-1.5">
                <span className="font-mono text-xs text-platinum-500">Balance</span>
                <span className="font-mono text-xs text-gold-300">{wallet?.balance} MATIC</span>
              </div>
              <div className="flex justify-between px-2 py-1.5">
                <span className="font-mono text-xs text-platinum-500">Network</span>
                <span className="font-mono text-xs text-emerald">{wallet?.chainName}</span>
              </div>
              {!isCorrectNetwork && (
                <div className="flex justify-between px-2 py-1.5">
                  <span className="font-mono text-xs text-crimson">Wrong Network</span>
                  <button onClick={switchToAmoy} className="font-mono text-xs text-gold-400 hover:text-gold-300">
                    Switch →
                  </button>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-white/5">
              <button
                onClick={() => { disconnect(); setShowMenu(false); }}
                className="w-full font-mono text-xs text-crimson/70 hover:text-crimson py-2 border border-crimson/20 hover:border-crimson/40 transition-colors"
              >
                Disconnect Wallet
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-crimson/10 border border-crimson/30 p-3">
          <p className="font-mono text-xs text-crimson">{error}</p>
        </div>
      )}
    </div>
  );
}
