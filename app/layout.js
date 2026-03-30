import "./globals.css";

/** Canonical URL for link previews (iMessage, WhatsApp, Slack, etc.). */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://texes-235-study.vercel.app";

const title = "TExES Math 7-12 (235) Study";
const description =
  "Texas teacher certification math practice — quizzes, flashcards, spaced repetition, and progress charts. From genius.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | TExES 235",
  },
  description,
  applicationName: "genius. TExES 235",
  authors: [{ name: "genius." }],
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "genius.",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
