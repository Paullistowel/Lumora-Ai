"use client";

import {
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useScroll,
  type Variants,
} from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "./ui";

/**
 * Motion primitives shared across the marketing site and the app.
 *
 * Every component here degrades to a static, fully legible state when the user
 * prefers reduced motion — the animation is decoration, never the content.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

// ── Reveal on scroll ────────────────────────────────────────────────────────

type Direction = "up" | "down" | "left" | "right" | "none";

const OFFSET: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 26 },
  down: { x: 0, y: -26 },
  left: { x: 32, y: 0 },
  right: { x: -32, y: 0 },
  none: { x: 0, y: 0 },
};

export function Reveal({
  children,
  delay = 0,
  direction = "up",
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const reduced = useReducedMotion();
  const offset = OFFSET[direction];
  const Component = motion[as];

  return (
    <Component
      className={className}
      initial={reduced ? false : { opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay, ease: EASE }}
    >
      {children}
    </Component>
  );
}

/** Staggers direct children as the container scrolls into view. */
export function Stagger({
  children,
  className,
  gap = 0.08,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
}) {
  const reduced = useReducedMotion();
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : gap } },
  };

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const item: Variants = {
    hidden: reduced ? { opacity: 1 } : { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
  };
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}

// ── 3D tilt ─────────────────────────────────────────────────────────────────

/**
 * Tilts toward the pointer in 3D and tracks a spotlight to the cursor.
 * Pointer-driven only, so touch and keyboard users get the flat card.
 */
export function TiltCard({
  children,
  className,
  intensity = 9,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const config = { stiffness: 180, damping: 18, mass: 0.4 };
  const rotateX = useSpring(
    useTransform(py, [0, 1], [intensity, -intensity]),
    config,
  );
  const rotateY = useSpring(
    useTransform(px, [0, 1], [-intensity, intensity]),
    config,
  );
  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);
  // useMotionTemplate keeps the gradient tracking the pointer; interpolating
  // with .get() would freeze it at its first-render value.
  const glareBackground = useMotionTemplate`radial-gradient(240px circle at ${glareX} ${glareY}, color-mix(in srgb, var(--foreground) 10%, transparent), transparent 70%)`;

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || reduced) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((event.clientX - rect.left) / rect.width);
    py.set((event.clientY - rect.top) / rect.height);
  }

  function reset() {
    px.set(0.5);
    py.set(0.5);
  }

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <div className="perspective">
      <motion.div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={reset}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={cn("relative", className)}
      >
        {children}
        {glare ? (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: glareBackground }}
          />
        ) : null}
      </motion.div>
    </div>
  );
}

/** Lifts a layer toward the viewer inside a TiltCard. */
export function Layer3D({
  children,
  z = 40,
  className,
}: {
  children: ReactNode;
  z?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <div
      className={className}
      style={reduced ? undefined : { transform: `translateZ(${z}px)` }}
    >
      {children}
    </div>
  );
}

// ── Spotlight that follows the cursor ───────────────────────────────────────

export function Spotlight({
  children,
  className,
  size = 340,
}: {
  children: ReactNode;
  className?: string;
  size?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -9999, y: -9999 });
  const reduced = useReducedMotion();

  return (
    <div
      ref={ref}
      className={cn("group relative", className)}
      onPointerMove={(event) => {
        if (reduced) return;
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        setPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      }}
      onPointerLeave={() => setPos({ x: -9999, y: -9999 })}
    >
      {!reduced ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(${size}px circle at ${pos.x}px ${pos.y}px, color-mix(in srgb, var(--brand) 14%, transparent), transparent 65%)`,
          }}
        />
      ) : null}
      {children}
    </div>
  );
}

// ── Animated counter ────────────────────────────────────────────────────────

export function Counter({
  to,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 1.6,
  className,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced ? to : 0);

  useEffect(() => {
    if (!inView || reduced) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      // easeOutExpo — fast start, gentle settle
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(to * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, to, duration, reduced]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// ── Marquee ─────────────────────────────────────────────────────────────────

export function Marquee({
  children,
  duration = 34,
  className,
}: {
  children: ReactNode;
  duration?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "marquee-host relative overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,#000_9%,#000_91%,transparent)]",
        className,
      )}
    >
      <div
        className="marquee-track flex w-max items-center gap-12"
        style={{ ["--marquee-duration" as keyof CSSProperties]: `${duration}s` }}
      >
        {children}
        <span aria-hidden className="contents">
          {children}
        </span>
      </div>
    </div>
  );
}

// ── Parallax ────────────────────────────────────────────────────────────────

export function Parallax({
  children,
  strength = 60,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [strength, -strength]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduced ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

// ── Reading progress bar ────────────────────────────────────────────────────

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 26,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-brand via-accent to-accent-2"
    />
  );
}

// ── Word-by-word headline ───────────────────────────────────────────────────

export function AnimatedHeading({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");

  if (reduced) return <h1 className={className}>{text}</h1>;

  return (
    <h1 className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline">
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            className="inline-block"
            initial={{ opacity: 0, y: "0.5em", filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: delay + i * 0.06, ease: EASE }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        ))}
      </span>
    </h1>
  );
}

export { motion, useReducedMotion };
