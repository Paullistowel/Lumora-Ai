import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Lume AI — AI-Powered Academic Integrity & Peer Review Platform",
    template: "%s · Lume AI",
  },
  description:
    "Intelligent document analysis, semantic plagiarism detection, academic writing feedback and structured peer review for higher education.",
  applicationName: "Lume AI",
  keywords: [
    "academic integrity",
    "semantic plagiarism detection",
    "peer review",
    "sentence transformers",
    "higher education",
    "KNUST",
  ],
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Lume AI — AI-Powered Academic Integrity & Peer Review Platform",
    description:
      "Semantic plagiarism detection, academic writing analysis and structured peer review for higher education. Research prototype · Group 4 · KNUST · 2026.",
    siteName: "Lume AI",
    images: ["/img/og.svg"],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#080a0f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Apply the saved theme before first paint so dark mode never flashes. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('lume-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="focus-ring sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:shadow-[var(--shadow-lg)]"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
