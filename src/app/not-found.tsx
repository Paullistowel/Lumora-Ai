import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Home, LifeBuoy, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui";

export const metadata = { title: "Page not found · AI-AIMS" };

const SUGGESTIONS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tools", label: "Free writing tools", icon: Search },
  { href: "/help", label: "Help centre", icon: LifeBuoy },
] as const;

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-16 text-center">
      <div className="aurora" aria-hidden />
      <div className="grid-lines" aria-hidden />

      <div className="relative">
        <Image
          src="/img/not-found.svg"
          alt=""
          width={420}
          height={260}
          className="float mx-auto"
          priority
        />

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          We couldn&apos;t find that page
        </h1>
        <p className="mx-auto mt-3 max-w-md text-pretty text-muted">
          The link may be out of date, or the page may have moved. Nothing is
          broken on your end.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" variant="gradient" className="px-5 py-2.5">
            <ArrowLeft className="size-4" />
            Back to home
          </ButtonLink>
        </div>

        <div className="mt-10">
          <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
            Or try
          </p>
          <ul className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm transition-colors hover:border-border-strong hover:bg-surface-muted"
                >
                  <item.icon className="size-4 text-brand" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
