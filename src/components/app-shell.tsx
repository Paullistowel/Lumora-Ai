"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BarChart3, Bell, BookOpen, Building2, ClipboardList, FileText,
  FlaskConical, GitCompare, GraduationCap, LayoutDashboard, LineChart, LogOut,
  FolderOpen, Menu, ScanSearch, ScrollText, Settings, ShieldCheck, Sparkles,
  Users, X,
} from "lucide-react";
import type { Role, SessionUser } from "@/lib/auth";
import { ThemeToggle } from "./theme-toggle";
import { LumeLogo, LumeMark } from "./brand";
import { cn } from "./ui";
import { initials } from "@/lib/format";
import { OnboardingTour } from "./onboarding/tour";

const ICONS = {
  dashboard: LayoutDashboard,
  analyse: ScanSearch,
  reports: FileText,
  documents: FolderOpen,
  assignments: ClipboardList,
  submissions: FileText,
  reviews: Users,
  courses: BookOpen,
  students: GraduationCap,
  departments: Building2,
  integrity: ShieldCheck,
  audit: ScrollText,
  settings: Settings,
  tools: Sparkles,
  analytics: BarChart3,
  progress: LineChart,
  research: FlaskConical,
  compare: GitCompare,
} as const;

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  /** Anchor id for the onboarding tour spotlight. */
  tour?: string;
};

const NAV: Record<Role, NavItem[]> = {
  STUDENT: [
    { href: "/student", label: "Dashboard", icon: "dashboard" },
    { href: "/analyse", label: "Analyse", icon: "analyse", tour: "nav-analyse" },
    { href: "/student/assignments", label: "Assignments", icon: "assignments", tour: "nav-assignments" },
    { href: "/student/submissions", label: "My submissions", icon: "submissions", tour: "nav-submissions" },
    { href: "/reports", label: "Reports", icon: "reports" },
    { href: "/documents", label: "Documents", icon: "documents" },
    { href: "/student/peer-review", label: "Peer review", icon: "reviews", tour: "nav-reviews" },
    { href: "/student/progress", label: "Writing progress", icon: "progress" },
    { href: "/student/courses", label: "Courses", icon: "courses" },
    { href: "/student/integrity", label: "Integrity guide", icon: "integrity", tour: "nav-integrity" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ],
  LECTURER: [
    { href: "/lecturer", label: "Dashboard", icon: "dashboard" },
    { href: "/analyse", label: "Analyse", icon: "analyse", tour: "nav-analyse" },
    { href: "/reports", label: "My reports", icon: "reports" },
    { href: "/documents", label: "Documents", icon: "documents" },
    { href: "/lecturer/submissions", label: "Submissions & reports", icon: "submissions" },
    { href: "/lecturer/analytics", label: "Analytics", icon: "analytics" },
    { href: "/lecturer/compare", label: "Compare documents", icon: "compare" },
    { href: "/lecturer/courses", label: "Courses", icon: "courses", tour: "nav-courses" },
    { href: "/lecturer/assignments", label: "Assignments", icon: "assignments", tour: "nav-assignments" },
    { href: "/lecturer/rubrics", label: "Rubrics", icon: "reports", tour: "nav-rubrics" },
    { href: "/research", label: "Research", icon: "research" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ],
  ADMIN: [
    { href: "/admin", label: "Dashboard", icon: "dashboard" },
    { href: "/analyse", label: "Analyse", icon: "analyse" },
    { href: "/admin/users", label: "Users", icon: "students", tour: "nav-users" },
    { href: "/admin/departments", label: "Departments", icon: "departments", tour: "nav-departments" },
    { href: "/admin/courses", label: "Courses", icon: "courses" },
    { href: "/admin/audit", label: "Audit log", icon: "audit", tour: "nav-audit" },
    { href: "/research", label: "Research", icon: "research" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Student",
  LECTURER: "Lecturer",
  ADMIN: "Administrator",
};

export function AppShell({
  user,
  unreadCount,
  showTour,
  children,
}: {
  user: SessionUser;
  unreadCount: number;
  showTour: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = NAV[user.role];

  const activeHref = items
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const nav = (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        // Longest matching href wins, so /analyse/history highlights "My
        // reports" rather than both it and "Analyse".
        const active = item.href === activeHref;

        return (
          <Link
            key={item.href}
            href={item.href}
            data-tour={item.tour}
            onClick={() => setMobileOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-ring group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors",
              active
                ? "font-medium text-brand"
                : "text-muted hover:bg-surface-muted hover:text-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 -z-10 rounded-xl bg-brand-soft"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            ) : null}
            <Icon className="size-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {showTour ? <OnboardingTour role={user.role} /> : null}

      <div className="flex min-h-dvh">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface p-4 lg:flex">
          <LumeLogo className="mb-7 px-2" />
          {nav}
          <div className="mt-auto pt-4">
            <UserCard user={user} />
          </div>
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 lg:hidden"
            >
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                className="relative flex h-full w-72 max-w-[84vw] flex-col border-r border-border bg-surface p-4"
              >
                <div className="mb-6 flex items-center justify-between px-2">
                  <span className="flex items-center gap-2 font-semibold tracking-tight">
                    <LumeMark className="size-6" />
                    Lume AI
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                    className="focus-ring rounded-lg p-1.5 text-muted hover:bg-surface-muted"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                {nav}
                <div className="mt-auto pt-4">
                  <UserCard user={user} />
                </div>
              </motion.aside>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="surface-glass sticky top-0 z-30 flex items-center gap-3 border-b border-border px-4 py-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="focus-ring rounded-lg p-2 text-muted hover:bg-surface-muted lg:hidden"
            >
              <Menu className="size-4" />
            </button>

            <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-muted">
              {ROLE_LABEL[user.role]}
            </span>

            <div className="ml-auto flex items-center gap-1">
              <Link
                href="/notifications"
                data-tour="notifications"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                className="focus-ring relative rounded-lg p-2 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                <Bell className="size-4" />
                {unreadCount > 0 ? (
                  <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-brand-fg">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Link>
              <ThemeToggle />
              <form action="/api/logout" method="post">
                <button
                  type="submit"
                  aria-label="Sign out"
                  className="focus-ring rounded-lg p-2 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                >
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
          </header>

          <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

function UserCard({ user }: { user: SessionUser }) {
  return (
    <Link
      href="/settings"
      className="focus-ring flex items-center gap-3 rounded-xl border border-border bg-surface-muted px-3 py-2.5 transition-colors hover:border-border-strong"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-xs font-semibold text-white">
        {initials(user.fullName)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{user.fullName}</span>
        <span className="block truncate text-xs text-muted">{user.email}</span>
      </span>
    </Link>
  );
}
