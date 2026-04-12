"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GoldCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
  delay?: number;
}

export function GoldCard({
  children,
  className,
  glow = false,
  hover = true,
  delay = 0,
}: GoldCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={hover ? { y: -4, transition: { duration: 0.3 } } : undefined}
      className={cn(
        "relative rounded-none border border-gold-700/20 bg-bg-card/60 backdrop-blur-sm",
        "shadow-card hover:shadow-card-hover transition-shadow duration-400",
        glow && "animate-gold-pulse",
        className
      )}
    >
      {/* Subtle corner accent */}
      <span className="absolute top-0 left-0 w-6 h-6 border-t border-l border-gold-500/40" />
      <span className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-gold-500/40" />
      {children}
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  delay?: number;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, sub, positive = true, delay = 0, icon }: StatCardProps) {
  return (
    <GoldCard delay={delay} className="p-6">
      <div className="flex items-start justify-between mb-3">
        {icon && (
          <div className="w-10 h-10 rounded-sm bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
            {icon}
          </div>
        )}
        {sub && (
          <span className={cn(
            "font-mono text-xs px-2 py-0.5 border",
            positive
              ? "text-emerald border-emerald/30 bg-emerald/5"
              : "text-crimson border-crimson/30 bg-crimson/5"
          )}>
            {sub}
          </span>
        )}
      </div>
      <div className="mt-2">
        <div className="font-display text-3xl font-bold text-white tracking-tight mb-1">
          {value}
        </div>
        <div className="font-mono text-xs text-platinum-500 uppercase tracking-wider">
          {label}
        </div>
      </div>
    </GoldCard>
  );
}
