import "./globals.css";

export const metadata = {
  title: "TExES 235 Math 7–12 Study",
  description: "TExES Math 7–12 (235) practice — genius.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
