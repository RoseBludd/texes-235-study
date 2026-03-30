const path = require("path");
const { pool } = require("../lib/db");

const SECTIONS = [
  {
    id: "d2",
    label: "Patterns & Algebra",
    color: "#3b82f6",
    icon: "📐",
    segments: [
      { id: "c004", label: "Comp 004 · Sequences & Series", color: "#3b82f6", icon: "🔢" },
      { id: "c007", label: "Comp 007 · Rational & Radical Fns", color: "#6366f1", icon: "📊" },
      { id: "c008", label: "Comp 008 · Exponential & Logarithmic", color: "#8b5cf6", icon: "📈" },
      { id: "c009", label: "Comp 009 · Trigonometric Functions", color: "#a78bfa", icon: "〰️" },
      { id: "c010", label: "Comp 010 · Differential & Integral Calc", color: "#7c3aed", icon: "∫" },
    ],
  },
  {
    id: "d3",
    label: "Geometry & Measurement",
    color: "#22c55e",
    icon: "📐",
    segments: [
      { id: "c013", label: "Comp 013 · Euclidean Geometry", color: "#22c55e", icon: "⭕" },
      { id: "c014", label: "Comp 014 · Coordinate & Vector Geo", color: "#16a34a", icon: "🧭" },
    ],
  },
  {
    id: "d4",
    label: "Probability & Statistics",
    color: "#f97316",
    icon: "📊",
    segments: [
      { id: "c015", label: "Comp 015 · Data Analysis Techniques", color: "#f97316", icon: "📉" },
    ],
  },
  {
    id: "d5",
    label: "Mathematical Processes",
    color: "#ec4899",
    icon: "💬",
    segments: [
      { id: "c019", label: "Comp 019 · Communicating Math Concepts", color: "#ec4899", icon: "💬" },
    ],
  },
];

function loadSeed() {
  const dataPath = path.join(__dirname, "texes-seed.json");
  const fs = require("fs");
  if (!fs.existsSync(dataPath)) {
    console.error("Missing scripts/texes-seed.json");
    process.exit(1);
  }
  return require(dataPath);
}

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const SEED = loadSeed();
  const client = await pool.connect();
  try {
    let so = 0;
    for (const sec of SECTIONS) {
      await client.query(
        "INSERT INTO sections (id, label, color, icon, sort_order) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING",
        [sec.id, sec.label, sec.color, sec.icon, so++]
      );
      let segOrder = 0;
      for (const seg of sec.segments) {
        await client.query(
          "INSERT INTO segments (id, section_id, label, color, icon, sort_order) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING",
          [seg.id, sec.id, seg.label, seg.color, seg.icon, segOrder++]
        );
      }
    }
    for (const [segId, questions] of Object.entries(SEED)) {
      if (!Array.isArray(questions)) continue;
      for (const q of questions) {
        await client.query(
          "INSERT INTO questions (id, segment_id, q, opts, ans, exp, is_custom) VALUES ($1,$2,$3,$4,$5,$6,FALSE) ON CONFLICT (id) DO NOTHING",
          [q.id, segId, q.q, JSON.stringify(q.opts), q.ans, q.exp]
        );
      }
    }
    console.log("TExES 235 seed data inserted.");
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
