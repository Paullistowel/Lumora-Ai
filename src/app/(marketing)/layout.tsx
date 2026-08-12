import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { CookieConsent } from "@/components/marketing/cookie-consent";
import { ScrollProgress } from "@/components/motion";

export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollProgress />
      <SiteNav signedIn={Boolean(user)} />
      <main className="flex-1 pt-20">{children}</main>
      <SiteFooter />
      <CookieConsent />
    </div>
  );
}
