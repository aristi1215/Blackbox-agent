import { motion } from "motion/react";

export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* dot grid */}
      <div className="absolute inset-0 dot-grid opacity-60 mask-fade-b" />
      {/* radial gradient halo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4 }}
        className="absolute -top-40 left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(214,255,60,0.18) 0%, rgba(214,255,60,0.04) 40%, transparent 70%)",
        }}
      />
      {/* moving orbs */}
      <motion.div
        className="orb-anim absolute left-[6%] top-[18%] h-[380px] w-[380px] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(110,168,255,0.45), transparent)" }}
      />
      <motion.div
        className="orb-anim absolute right-[8%] top-[40%] h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
        style={{
          background: "radial-gradient(closest-side, rgba(178,137,255,0.38), transparent)",
          animationDelay: "-6s",
        }}
      />
      <motion.div
        className="orb-anim absolute left-1/2 top-[55%] h-[260px] w-[260px] -translate-x-1/2 rounded-full opacity-45 blur-3xl"
        style={{
          background: "radial-gradient(closest-side, rgba(214,255,60,0.40), transparent)",
          animationDelay: "-3s",
        }}
      />
      {/* grid lines */}
      <div
        className="absolute inset-0 mask-fade-b opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
        }}
      />
      {/* horizon */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[40%]"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(214,255,60,0.05) 60%, rgba(214,255,60,0.10) 100%)",
        }}
      />
    </div>
  );
}
