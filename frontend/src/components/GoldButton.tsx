"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function GoldButton({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: GoldButtonProps) {
  const base =
    "relative inline-flex items-center justify-center gap-2 font-display font-semibold tracking-wide transition-all duration-300 overflow-hidden select-none border focus:outline-none focus:ring-2 focus:ring-gold-400/50";

  const variants = {
    primary: [
      "bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400",
      "border-gold-400/30",
      "text-bg-base",
      "shadow-gold",
      "hover:shadow-gold-hover hover:scale-[1.02]",
      "active:scale-[0.98]",
      "disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none",
    ],
    secondary: [
      "bg-bg-card border-gold-600/30",
      "text-gold-300",
      "hover:border-gold-400/50 hover:bg-bg-elevated hover:text-gold-200",
      "disabled:opacity-40 disabled:cursor-not-allowed",
    ],
    ghost: [
      "bg-transparent border-white/10",
      "text-platinum-300",
      "hover:border-white/20 hover:bg-white/5 hover:text-white",
      "disabled:opacity-40 disabled:cursor-not-allowed",
    ],
    danger: [
      "bg-crimson/10 border-crimson/30",
      "text-crimson",
      "hover:bg-crimson/20 hover:border-crimson/50",
      "disabled:opacity-40 disabled:cursor-not-allowed",
    ],
  };

  const sizes = {
    sm:  "text-xs px-4 py-2 h-8",
    md:  "text-sm px-6 py-3 h-10",
    lg:  "text-base px-8 py-4 h-12",
    xl:  "text-lg px-12 py-5 h-14",
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {/* Shine overlay for primary */}
      {variant === "primary" && (
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 ease-in-out" />
      )}

      {loading ? (
        <>
          <svg
            className="animate-spin w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
}
