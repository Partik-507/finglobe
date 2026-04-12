"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { WalletButton } from "@/components/WalletButton";
import { UploadSection } from "@/components/UploadSection";
import { VerifySection } from "@/components/VerifySection";
import { GoldCard, StatCard } from "@/components/GoldCard";
import { GoldButton } from "@/components/GoldButton";
import { fetchPlatformStats, checkBackendHealth, PlatformStats } from "@/lib/api";

// ── Floating Particles Canvas ──────────────────────────────────────
function ParticlesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const PARTICLE_COUNT = 90;
    interface Particle {
      x: number; y: number; vx: number; vy: number;
      r: number; alpha: number; color: string;
    }
    const particles: Particle[] = [];
    const colors = [
      "rgba(212,160,23,",
      "rgba(252,211,77,",
      "rgba(255,255,255,",
      "rgba(0,212,255,",
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.4 + 0.05,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ")";
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} id="particles-canvas" />;
}

// ── Navbar ─────────────────────────────────────────────────────────
function Navbar({ backendOnline }: { backendOnline: boolean | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    return scrollY.on("change", (y) => setScrolled(y > 40));
  }, [scrollY]);

  const links = [
    { href: "#products", label: "Products" },
    { href: "#upload", label: "Register Proof" },
    { href: "#verify", label: "Verify" },
    { href: "#compliance", label: "Compliance" },
    { href: "#ledger", label: "Ledger" },
  ];

  return (
    <motion.nav
      className={`fixed w-full z-[100] top-0 transition-all duration-500 ${
        scrolled ? "bg-bg-base/95 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_32px_rgba(0,0,0,0.5)]" : ""
      }`}
    >
      {/* Top announcement bar */}
      <div className="bg-gold-500/8 border-b border-gold-700/20 py-2 px-4 text-center hidden md:block">
        <p className="font-mono text-[11px] text-gold-400/80 tracking-[0.15em]">
          <span className="text-gold-300">✦</span>&nbsp; FINGLOBE v1.0 — Polygon Amoy Testnet &nbsp;
          <span className="text-platinum-600">·</span>&nbsp;
          <span className={backendOnline === true ? "text-emerald" : backendOnline === false ? "text-crimson" : "text-platinum-600"}>
            {backendOnline === null ? "Checking services..." : backendOnline ? "All systems operational" : "Backend offline — start with npm run dev"}
          </span>
          &nbsp;<span className="text-gold-300">✦</span>
        </p>
      </div>

      <div className="max-w-[1440px] mx-auto px-5 lg:px-10">
        <div className="flex items-center justify-between h-[68px]">
          {/* Logo */}
          <a href="#" className="flex items-center gap-4 group">
            <div className="relative w-11 h-11 flex items-center justify-center">
              <div className="absolute inset-0 bg-gold-gradient opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="w-11 h-11 border border-gold-600/40 bg-bg-elevated flex items-center justify-center relative z-10">
                <span className="font-display font-black text-xl bg-gold-gradient bg-clip-text text-transparent">F</span>
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gold-400 animate-pulse" />
            </div>
            <div>
              <div className="font-display font-black text-xl tracking-tight text-white leading-none">FINGLOBE</div>
              <div className="font-mono text-[9px] text-platinum-600 tracking-[0.35em] uppercase leading-none mt-0.5">Proof Engine v1.0</div>
            </div>
          </a>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {links.map((link) => (
              <a key={link.href} href={link.href}
                className="font-mono text-[13px] text-platinum-500 hover:text-gold-300 px-4 py-2 transition-colors duration-200 relative group">
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-gold-400 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 border border-white/10 px-3 py-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? "bg-emerald animate-pulse" : "bg-crimson"}`} />
              <span className="font-mono text-[11px] text-platinum-500">
                {backendOnline ? "LIVE" : "OFFLINE"}
              </span>
            </div>
            <WalletButton />
            <button className="lg:hidden p-2 text-platinum-400 hover:text-white" onClick={() => setMobileOpen(v => !v)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
            className="lg:hidden border-t border-white/5 bg-bg-base/98 backdrop-blur-xl overflow-hidden">
            <div className="px-5 py-4 space-y-1">
              {links.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  className="block font-mono text-sm text-platinum-400 hover:text-gold-300 py-3 border-b border-white/5 transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

// ── Hero Section ──────────────────────────────────────────────────
function HeroSection({ stats }: { stats: PlatformStats | null }) {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, -60]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-24 overflow-hidden">
      {/* BG Effects */}
      <div className="absolute inset-0 bg-grid opacity-100" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gold-500/6 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-electric/3 blur-[100px] pointer-events-none" />

      <motion.div
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-10 w-full text-center"
      >
        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-3 border border-gold-700/30 bg-gold-500/5 px-6 py-2.5 mb-10"
        >
          <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
          <span className="font-mono text-xs text-gold-400 tracking-[0.2em] uppercase">
            Paper-Based · Polygon Amoy · IPFS · ESRS/ISSB
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-black text-6xl md:text-7xl lg:text-8xl xl:text-9xl leading-[0.9] tracking-tight mb-8"
        >
          <span className="text-white">The Verifiable</span>
          <br />
          <span className="text-gold-shine">Finance Network</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.8 }}
          className="text-platinum-400 text-xl md:text-2xl max-w-3xl mx-auto mb-14 leading-relaxed"
        >
          Cryptographic proof infrastructure for financial records, ESG disclosures, and audit trails.
          <br className="hidden md:block" />
          <span className="text-gold-300/80">SHA-256 · AES-256-GCM · IPFS · Polygon blockchain.</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-20"
        >
          <GoldButton size="xl"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>}
            onClick={() => document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" })}
          >
            Register a Proof
          </GoldButton>
          <GoldButton variant="secondary" size="xl"
            onClick={() => document.getElementById("verify")?.scrollIntoView({ behavior: "smooth" })}
          >
            Verify a Document
          </GoldButton>
        </motion.div>

        {/* Live Stats Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {[
            { label: "Proofs Registered", value: stats?.totalProofs?.toLocaleString() ?? "...", sub: "On-chain" },
            { label: "Verified Today", value: stats?.verifiedToday?.toLocaleString() ?? "...", sub: "Real-time" },
            { label: "Avg Verification", value: stats ? `${stats.avgVerificationMs}ms` : "...", sub: "Latency" },
            { label: "Uptime", value: stats?.uptime ?? "...", sub: "SLA" },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 + i * 0.08 }}
              className="border border-white/5 bg-bg-card/40 backdrop-blur-sm p-5"
            >
              <div className="font-display text-2xl md:text-3xl font-bold text-white mb-1">{s.value}</div>
              <div className="font-mono text-[11px] text-platinum-600 uppercase tracking-wider mb-0.5">{s.label}</div>
              <div className="font-mono text-[10px] text-gold-600">{s.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[10px] text-platinum-700 tracking-[0.3em] uppercase">Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="w-px h-10 bg-gradient-to-b from-gold-600/40 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── Ticker Bar ─────────────────────────────────────────────────────
function TickerBar() {
  const items = [
    { label: "FGL/USD",     value: "$4.72",   change: "▲12.4%",  up: true },
    { label: "TVL",          value: "$8.9B",   change: "▲8.2%",   up: true },
    { label: "Verifications",value: "1.2M/day",change: "▲34.1%",  up: true },
    { label: "Staking APY",  value: "14.2%",   change: "Locked",  up: true },
    { label: "Gas (Amoy)",   value: "$0.0012", change: "Average", up: true },
    { label: "Validators",   value: "4,829",   change: "▲127",    up: true },
    { label: "ESG Reports",  value: "15,420",  change: "▲892",    up: true },
    { label: "Chains",       value: "15",      change: "Active",   up: true },
  ];
  const double = [...items, ...items];

  return (
    <div className="border-y border-white/5 bg-bg-surface/30 py-4 overflow-hidden relative">
      <div className="absolute left-0 inset-y-0 w-16 bg-gradient-to-r from-bg-base to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 inset-y-0 w-16 bg-gradient-to-l from-bg-base to-transparent z-10 pointer-events-none" />
      <div className="ticker-track">
        {double.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-8 border-r border-white/5 last:border-0 shrink-0">
            <span className="font-mono text-[11px] text-platinum-600 uppercase tracking-wider">{item.label}</span>
            <span className="font-mono text-sm font-bold text-white">{item.value}</span>
            <span className={`font-mono text-[11px] ${item.up ? "text-emerald" : "text-crimson"}`}>{item.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Products Section ───────────────────────────────────────────────
function ProductsSection() {
  const products = [
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      color: "from-electric/20 to-electric/5",
      borderColor: "border-electric/20",
      iconColor: "text-electric",
      badge: "Active",
      badgeColor: "text-emerald border-emerald/30 bg-emerald/5",
      title: "Financial Proof",
      desc: "Cryptographically verifiable proof of financial records with instant on-chain validation and sub-2s verification latency.",
      stat: "<1s",
      statLabel: "Verification",
      foot: "TVL Secured",
      footVal: "$2.4B",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "from-emerald/20 to-emerald/5",
      borderColor: "border-emerald/20",
      iconColor: "text-emerald",
      badge: "Active",
      badgeColor: "text-emerald border-emerald/30 bg-emerald/5",
      title: "ESG Verification",
      desc: "Eliminate greenwashing with blockchain-verified environmental, social, and governance metrics mapped to ESRS & ISSB.",
      stat: "100%",
      statLabel: "Anti-Greenwashing",
      foot: "Reports Verified",
      footVal: "15,420",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: "from-gold-500/20 to-gold-500/5",
      borderColor: "border-gold-600/20",
      iconColor: "text-gold-400",
      badge: "Active",
      badgeColor: "text-gold-400 border-gold-600/30 bg-gold-500/5",
      title: "Compliance Engine",
      desc: "Automated regulatory compliance engine mapping document metadata to ESRS E1/S1/G1, ISSB S1/S2, and SEC disclosure frameworks.",
      stat: "6+",
      statLabel: "Frameworks",
      foot: "Compliance Rate",
      footVal: "99.99%",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      color: "from-platinum-400/20 to-platinum-400/5",
      borderColor: "border-platinum-400/15",
      iconColor: "text-platinum-300",
      badge: "Beta",
      badgeColor: "text-platinum-300 border-platinum-400/30 bg-platinum-400/5",
      title: "DID Identity",
      desc: "Decentralized Identity via did:ethr:{wallet_address}. Message signing for issuer proof, zero-trust verification of document origins.",
      stat: "did:ethr",
      statLabel: "Standard",
      foot: "Identity Method",
      footVal: "W3C DID",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      color: "from-electric/15 to-transparent",
      borderColor: "border-electric/15",
      iconColor: "text-electric",
      badge: "Live",
      badgeColor: "text-electric border-electric/30 bg-electric/5",
      title: "IPFS Archival",
      desc: "AES-256-GCM encrypted documents stored permanently on IPFS via Pinata. Immutable content-addressed storage with CID tracking.",
      stat: "∞",
      statLabel: "Persistence",
      foot: "Storage",
      footVal: "Pinata IPFS",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: "from-gold-400/15 to-transparent",
      borderColor: "border-gold-600/20",
      iconColor: "text-gold-300",
      badge: "Fast",
      badgeColor: "text-gold-300 border-gold-600/30 bg-gold-500/5",
      title: "Instant Anchoring",
      desc: "Sub-2 second verification on Polygon Amoy testnet. Gas-optimized bytes32 mappings keep costs near-zero for mass adoption.",
      stat: "<2s",
      statLabel: "Anchoring Speed",
      foot: "Network",
      footVal: "Polygon Amoy",
    },
  ];

  return (
    <section id="products" className="py-28 relative">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 border border-gold-700/30 bg-gold-500/5 px-5 py-2 mb-7">
            <span className="font-mono text-xs text-gold-400 tracking-[0.2em] uppercase">Product Suite</span>
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold text-white mb-5">
            Engineered for<br />
            <span className="text-gold-shine">Financial Institutions</span>
          </h2>
          <p className="text-platinum-400 text-lg max-w-2xl mx-auto">
            Six production-grade modules covering every layer of financial document verification, 
            from cryptographic hashing to regulatory compliance.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p, i) => (
            <GoldCard key={p.title} delay={i * 0.07} className="p-7">
              <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 border ${p.borderColor} bg-gradient-to-br ${p.color} flex items-center justify-center ${p.iconColor}`}>
                  {p.icon}
                </div>
                <span className={`font-mono text-[11px] px-3 py-1 border ${p.badgeColor} uppercase tracking-wider`}>
                  {p.badge}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-3">{p.title}</h3>
              <p className="text-platinum-500 text-sm leading-relaxed mb-6">{p.desc}</p>
              <div className="mb-5">
                <div className="font-display text-4xl font-bold text-white mb-0.5">{p.stat}</div>
                <div className="font-mono text-xs text-platinum-600 uppercase tracking-wider">{p.statLabel}</div>
              </div>
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="font-mono text-xs text-platinum-600">{p.foot}</span>
                <span className="font-mono text-sm font-bold text-white">{p.footVal}</span>
              </div>
            </GoldCard>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ───────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Upload Document",
      desc: "Drag & drop your financial document. All file types supported up to 10MB.",
      icon: "📄",
    },
    {
      num: "02",
      title: "SHA-256 Fingerprint",
      desc: "Backend computes a unique SHA-256 cryptographic hash — any modification changes it completely.",
      icon: "🔐",
    },
    {
      num: "03",
      title: "AES-256-GCM Encrypt",
      desc: "Document is encrypted with AES-256-GCM before IPFS upload, ensuring confidential storage.",
      icon: "🔒",
    },
    {
      num: "04",
      title: "IPFS Storage",
      desc: "Encrypted document uploaded to Pinata IPFS. Content-addressed, immutable, decentralized.",
      icon: "📦",
    },
    {
      num: "05",
      title: "Blockchain Anchor",
      desc: "Hash + CID registered on Polygon Amoy via registerProof(). Tamper-proof, timestamped forever.",
      icon: "⛓",
    },
    {
      num: "06",
      title: "Instant Verification",
      desc: "Anyone can verify by recomputing the hash and calling getProof() — authentic or tampered in <2s.",
      icon: "✅",
    },
  ];

  return (
    <section id="ledger" className="py-28 bg-bg-surface/20 relative">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 border border-gold-700/30 bg-gold-500/5 px-5 py-2 mb-7">
            <span className="font-mono text-xs text-gold-400 tracking-[0.2em] uppercase">Cryptographic Pipeline</span>
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold text-white mb-5">
            How It Works
          </h2>
          <p className="text-platinum-400 text-lg max-w-2xl mx-auto">
            A 6-step cryptographic pipeline that takes your document from plaintext to blockchain-anchored immutable proof.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map((step, i) => (
            <GoldCard key={step.num} delay={i * 0.08}>
              <div className="p-7">
                <div className="flex items-center gap-4 mb-5">
                  <span className="font-display text-4xl font-black text-gold-600/20">{step.num}</span>
                  <span className="text-2xl">{step.icon}</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-platinum-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </GoldCard>
          ))}
        </div>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 border border-gold-700/20 bg-bg-card/40 backdrop-blur-sm p-8 overflow-x-auto"
        >
          <div className="font-mono text-xs text-gold-400 mb-4 uppercase tracking-wider">System Architecture</div>
          <pre className="font-mono text-xs text-platinum-400 leading-relaxed whitespace-pre">
{`┌────────────────┐   POST /api/upload   ┌─────────────────────┐   Pinata API   ┌──────────────────┐
│   Browser UI   │ ──────────────────▶  │   Express Backend   │ ─────────────▶ │   Pinata IPFS    │
│  (Next.js 14)  │                      │   Node.js + TS      │               │   Encrypted CID  │
└───────┬────────┘                      └──────────┬──────────┘               └──────────────────┘
        │                                          │
        │  ethers.js                               │  SHA-256 + AES-256-GCM
        │  registerProof(hash, cid)                │  Compliance Engine
        ▼                                          ▼
┌────────────────┐                      ┌─────────────────────┐
│    MetaMask    │                      │  Document Metadata  │
│    Wallet      │                      │  ESRS / ISSB / SEC  │
└───────┬────────┘                      └─────────────────────┘
        │
        │ Polygon Amoy Testnet (chainId: 80002)
        ▼
┌────────────────────────────────────────────────────────────────┐
│   ProofRegistry.sol — bytes32 mapping                         │
│   registerProof(bytes32 hash, string cid) → ProofRegistered   │
│   getProof(bytes32 hash) → (exists, cid, timestamp, issuer)   │
└────────────────────────────────────────────────────────────────┘`}
          </pre>
        </motion.div>
      </div>
    </section>
  );
}

// ── Compliance Section ─────────────────────────────────────────────
function ComplianceSection() {
  const frameworks = [
    { name: "ESRS E1", full: "European Sustainability Reporting — Climate", color: "text-emerald", border: "border-emerald/20", fields: ["carbonEmissions", "renewableEnergyPct", "waterUsage"] },
    { name: "ESRS S1", full: "ESRS — Social Disclosure", color: "text-electric", border: "border-electric/20", fields: ["diversityRatio", "employeeSafetyRate", "genderPayGap"] },
    { name: "ESRS G1", full: "ESRS — Governance", color: "text-platinum-300", border: "border-platinum-400/20", fields: ["boardIndependencePct", "antiCorruptionPolicy", "whistleblowerPolicy"] },
    { name: "ISSB S1", full: "IFRS S1 — General Financial Disclosures", color: "text-gold-300", border: "border-gold-600/20", fields: ["liquidity", "debtToEquity", "auditor", "reportingPeriod"] },
    { name: "ISSB S2", full: "IFRS S2 — Climate Disclosure", color: "text-gold-400", border: "border-gold-500/20", fields: ["carbonEmissions", "renewableEnergyPct", "reportingPeriod"] },
    { name: "SEC GD", full: "SEC General Disclosure", color: "text-platinum-400", border: "border-platinum-400/15", fields: ["issuer", "reportingPeriod", "auditor", "jurisdiction"] },
  ];

  return (
    <section id="compliance" className="py-28 relative">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-2 border border-gold-700/30 bg-gold-500/5 px-5 py-2 mb-7">
            <span className="font-mono text-xs text-gold-400 tracking-[0.2em] uppercase">Compliance Engine</span>
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold text-white mb-5">
            Multi-Framework<br />
            <span className="text-gold-shine">Regulatory Compliance</span>
          </h2>
          <p className="text-platinum-400 text-lg max-w-2xl leading-relaxed">
            Document metadata is automatically scored and badged against 6 regulatory frameworks. 
            Missing fields trigger actionable warnings for auditors.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {frameworks.map((f, i) => (
            <GoldCard key={f.name} delay={i * 0.07} className="p-6">
              <div className={`font-mono text-xs ${f.color} border ${f.border} px-3 py-1.5 w-fit mb-4 uppercase tracking-wider`}>
                {f.name}
              </div>
              <h3 className="font-display text-lg font-bold text-white mb-2">{f.full}</h3>
              <div className="space-y-1.5 mt-4">
                {f.fields.map((field) => (
                  <div key={field} className="flex items-center gap-2 font-mono text-xs text-platinum-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${f.color.replace("text-", "bg-")}`} />
                    {field}
                  </div>
                ))}
              </div>
            </GoldCard>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Section ────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[400px] bg-gold-500/6 blur-[120px] rounded-full" />
      </div>
      <div className="max-w-5xl mx-auto px-6 lg:px-10 relative z-10">
        <GoldCard glow className="p-14 md:p-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 border border-gold-700/30 bg-gold-500/5 px-5 py-2 mb-8">
              <span className="font-mono text-xs text-gold-400 tracking-[0.2em] uppercase">Institutional Access</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl font-bold text-gold-shine mb-6">
              Not All Ledgers Are Equal
            </h2>
            <p className="text-platinum-400 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Like the finest instruments of finance, access to FINGLOBE&apos;s institutional-grade 
              proof infrastructure is reserved for those who understand verified truth.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <GoldButton size="xl"
                onClick={() => document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" })}
              >
                Start Registering Proofs
              </GoldButton>
              <GoldButton variant="secondary" size="xl"
                onClick={() => document.getElementById("verify")?.scrollIntoView({ behavior: "smooth" })}
              >
                Verify a Document
              </GoldButton>
            </div>
            <p className="font-mono text-platinum-700 text-xs tracking-wider">
              Enterprise SLA · SHA-256 · AES-256-GCM · ESRS/ISSB Compliant · Polygon Amoy
            </p>
          </motion.div>
        </GoldCard>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────
function Footer() {
  const cols = [
    {
      title: "Platform",
      links: ["Register Proof", "Verify Document", "Compliance Engine", "IPFS Archival"],
    },
    {
      title: "Developers",
      links: ["Documentation", "API Reference", "GitHub", "Smart Contract"],
    },
    {
      title: "Company",
      links: ["About", "Research Paper", "Careers", "Contact"],
    },
    { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Security", "Compliance"] },
  ];

  return (
    <footer className="border-t border-white/5 bg-bg-surface/40 py-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-10 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 border border-gold-600/30 bg-bg-elevated flex items-center justify-center">
                <span className="font-display font-black text-lg bg-gold-gradient bg-clip-text text-transparent">F</span>
              </div>
              <div>
                <div className="font-display font-black text-lg text-white">FINGLOBE</div>
                <div className="font-mono text-[9px] text-platinum-700 tracking-[0.3em]">PROOF ENGINE v1.0</div>
              </div>
            </div>
            <p className="text-platinum-600 text-sm leading-relaxed max-w-xs mb-6">
              Cryptographically verifiable, tamper-proof financial and ESG proof infrastructure 
              for banks, enterprises, auditors, and regulators.
            </p>
            <div className="flex gap-3">
              {["Twitter", "GitHub", "Discord"].map((social) => (
                <a key={social} href="#"
                  className="w-9 h-9 border border-white/10 flex items-center justify-center text-platinum-600 hover:text-gold-400 hover:border-gold-700/40 transition-all">
                  <span className="font-mono text-[9px] uppercase">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="font-mono text-[11px] text-platinum-500 uppercase tracking-[0.2em] mb-5">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="font-mono text-sm text-platinum-600 hover:text-gold-300 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="section-divider mb-8" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-platinum-700">© 2026 FINGLOBE Network. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
              <span className="font-mono text-xs text-platinum-600">All systems operational</span>
            </div>
            <span className="font-mono text-xs text-platinum-700">Polygon Amoy Testnet</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── ROOT PAGE ──────────────────────────────────────────────────────
export default function HomePage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkBackendHealth().then((h) => setBackendOnline(h.online));
    fetchPlatformStats()
      .then(setStats)
      .catch(() => {}); // Silently fail — stats are cosmetic
  }, []);

  return (
    <>
      <ParticlesCanvas />
      <Navbar backendOnline={backendOnline} />

      <main className="relative z-10">
        <HeroSection stats={stats} />
        <TickerBar />
        <ProductsSection />
        <UploadSection />
        <VerifySection />
        <HowItWorksSection />
        <ComplianceSection />
        <CTASection />
      </main>

      <Footer />
    </>
  );
}
