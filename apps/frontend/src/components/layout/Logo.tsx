import { Link } from "react-router-dom";
import { motion } from "motion/react";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <div className="relative" style={{ width: size, height: size }}>
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-[8px] bg-[color:var(--color-acid)] blur-md opacity-40"
          animate={{ opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <svg
          viewBox="0 0 32 32"
          width={size}
          height={size}
          className="relative"
        >
          <rect
            x="3"
            y="3"
            width="26"
            height="26"
            rx="7"
            fill="#0a0a0f"
            stroke="url(#lg)"
            strokeWidth="1.6"
          />
          <circle cx="16" cy="16" r="3.2" fill="#d6ff3c" />
          <circle cx="16" cy="16" r="6.5" fill="none" stroke="#d6ff3c" strokeOpacity="0.45" strokeWidth="1" />
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d6ff3c" />
              <stop offset="100%" stopColor="#7cf000" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-serif text-[19px] tracking-tight text-white transition-colors group-hover:text-[color:var(--color-acid)]">
          blackbox
        </span>
        <span className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-[color:var(--color-dim)]">
          observability for agents
        </span>
      </div>
    </Link>
  );
}
