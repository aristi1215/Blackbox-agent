import type { ButtonHTMLAttributes, ReactNode, AnchorHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-acid)]/40 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-[color:var(--color-acid)] text-black hover:brightness-110 active:scale-[0.98] shadow-[0_8px_30px_-8px_rgba(214,255,60,0.55)] hover:shadow-[0_12px_40px_-8px_rgba(214,255,60,0.65)]",
  secondary:
    "bg-white/10 text-white hover:bg-white/15 border border-white/10",
  ghost:
    "text-white/70 hover:text-white hover:bg-white/5",
  outline:
    "border border-white/15 text-white hover:bg-white/5 hover:border-white/25",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & CommonProps) {
  return (
    <button {...props} className={cn(base, variants[variant], sizes[size], className)}>
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  className,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & CommonProps) {
  return (
    <a {...props} className={cn(base, variants[variant], sizes[size], className)}>
      {iconLeft}
      {children}
      {iconRight}
    </a>
  );
}
