import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

export function cn(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

// ── Layout ──────────────────────────────────────────────────────────────────

export function Card({
  className,
  children,
  interactive,
  ...props
}: ComponentProps<"section"> & { interactive?: boolean }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-sm)]",
        interactive && "lift sheen group",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="flex min-w-0 gap-3">
        {icon ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-1.5 text-xs font-semibold tracking-[0.14em] text-brand uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
      )}
    >
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-brand uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base text-pretty text-muted sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  image = "/img/empty-box.svg",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  image?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-muted/60 px-6 py-12 text-center">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          width={180}
          height={135}
          className="mx-auto mb-4 opacity-90"
        />
      ) : null}
      <p className="font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

// ── Controls ────────────────────────────────────────────────────────────────

const buttonBase =
  "focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

const buttonVariants = {
  primary:
    "bg-brand text-brand-fg shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-glow)] hover:brightness-110",
  gradient:
    "bg-gradient-to-r from-brand via-accent to-brand bg-[length:200%_auto] text-white shadow-[var(--shadow-sm)] hover:bg-[position:right_center] hover:shadow-[var(--shadow-glow)]",
  secondary:
    "border border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-muted",
  ghost: "text-muted hover:bg-surface-muted hover:text-foreground",
  danger: "bg-risk-critical text-white hover:brightness-110",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(buttonBase, buttonVariants[variant], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return (
    <Link
      className={cn(buttonBase, buttonVariants[variant], className)}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </span>
      {children}
      {hint && !error ? (
        <span className="mt-1.5 block text-xs text-muted">{hint}</span>
      ) : null}
      {error ? (
        <span className="mt-1.5 block text-xs text-risk-critical">{error}</span>
      ) : null}
    </label>
  );
}

const controlClass =
  "focus-ring w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted hover:border-border-strong";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea className={cn(controlClass, "min-h-24", className)} {...props} />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(controlClass, className)} {...props} />;
}

export function Switch({
  label,
  description,
  ...props
}: ComponentProps<"input"> & { label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" {...props} />
        <span className="block h-5 w-9 rounded-full bg-border-strong transition-colors peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand" />
        <span className="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {description ? (
          <span className="block text-xs text-muted">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

// ── Feedback ────────────────────────────────────────────────────────────────

export function Alert({
  tone = "info",
  children,
  title,
}: {
  tone?: "info" | "success" | "error" | "warning";
  children: ReactNode;
  title?: string;
}) {
  const tones = {
    info: "border-brand/25 bg-brand-soft text-foreground",
    success: "border-risk-original/35 bg-risk-original/10 text-risk-original",
    warning: "border-risk-moderate/35 bg-risk-moderate/10 text-risk-moderate",
    error: "border-risk-critical/35 bg-risk-critical/10 text-risk-critical",
  } as const;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-xl border px-3.5 py-2.5 text-sm", tones[tone])}
    >
      {title ? <p className="mb-0.5 font-semibold">{title}</p> : null}
      {children}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "brand" | "success" | "warning" | "danger" | "accent";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: "border-border bg-surface-muted text-muted",
    brand: "border-brand/25 bg-brand-soft text-brand",
    accent: "border-accent/25 bg-accent/10 text-accent",
    success: "border-risk-original/30 bg-risk-original/10 text-risk-original",
    warning: "border-risk-moderate/30 bg-risk-moderate/10 text-risk-moderate",
    danger: "border-risk-critical/30 bg-risk-critical/10 text-risk-critical",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="lift rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">
          {label}
        </p>
        {icon ? <span className="text-muted">{icon}</span> : null}
      </div>
      <p
        className="mt-2 text-2xl font-semibold tabular-nums"
        style={tone ? { color: tone } : undefined}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

/** Circular progress dial used for scores. */
export function ScoreRing({
  value,
  max = 100,
  size = 120,
  label,
  colour = "var(--brand)",
  caption,
}: {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  colour?: string;
  caption?: string;
}) {
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, value / max));

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={10}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={10}
          stroke={colour}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-2xl font-semibold tabular-nums"
          style={{ color: colour }}
        >
          {label ?? Math.round(value)}
        </span>
        {caption ? (
          <span className="text-[11px] text-muted">{caption}</span>
        ) : null}
      </div>
    </div>
  );
}

// ── Tables ──────────────────────────────────────────────────────────────────

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-[var(--shadow-sm)]">
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        {children}
      </table>
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "border-b border-border bg-surface-muted/60 px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "border-b border-border px-4 py-3.5 align-middle transition-colors",
        className,
      )}
      {...props}
    />
  );
}
