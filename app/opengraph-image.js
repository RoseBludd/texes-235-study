import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "TExES Math 7-12 (235) Study — genius. Quizzes, flashcards, and progress tracking.";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #020617 0%, #0f172a 45%, #1c1917 100%)",
          padding: 72,
          border: "1px solid #334155",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 900,
              color: "#f1f5f9",
              letterSpacing: -3,
              lineHeight: 1.05,
            }}
          >
            genius<span style={{ color: "#f97316" }}>.</span>
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: "#e2e8f0",
              lineHeight: 1.2,
              maxWidth: 900,
            }}
          >
            TExES Math 7-12 (235) Study
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: "#94a3b8",
              lineHeight: 1.45,
              maxWidth: 920,
            }}
          >
            Texas teacher certification math practice — quizzes, flashcards, and
            progress tracking.
          </div>
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "#64748b",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          texes-235-study.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
