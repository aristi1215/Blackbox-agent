import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Card({
  children,
  className,
  hoverable = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { hoverable?: boolean }) {
  return (
    <div
      {...props}
      className={cn(
        "relative rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]",
        "shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_30px_60px_-30px_rgba(0,0,0,0.6)]",
        hoverable &&
          "transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_40px_80px_-30px_rgba(0,0,0,0.7)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  eyebrow,
  title,
  description,
  action,
}: {
  children?: ReactNode;
  className?: string;
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-white/5 px-5 py-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--color-dim)]">
            {eyebrow}
          </div>
        )}
        {title && <div className="text-[15px] font-semibold text-white/95">{title}</div>}
        {description && (
          <div className="mt-0.5 text-[13px] text-[color:var(--color-muted)]">{description}</div>
        )}
        {children}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-5 py-5", className)}>{children}</div>;
}
