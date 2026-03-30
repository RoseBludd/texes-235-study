"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function calcMastery(s) {
  if (!s || s.attempts === 0) return 0;
  return Math.min(
    Math.round(
      (s.correct / s.attempts) * 0.75 + Math.min(s.streak * 0.05, 0.25) * 100
    ),
    100
  );
}

function segStats(progress, segId, questions) {
  const qs = questions || [];
  let ta = 0,
    tc = 0,
    m = 0;
  qs.forEach((q) => {
    const s = progress?.[segId]?.[q.id];
    if (!s) return;
    ta += s.attempts;
    tc += s.correct;
    if (calcMastery(s) >= 80) m++;
  });
  return {
    totalAttempts: ta,
    accuracy: ta > 0 ? Math.round((tc / ta) * 100) : 0,
    mastered: m,
    total: qs.length,
    masteryPct: qs.length > 0 ? Math.round((m / qs.length) * 100) : 0,
  };
}

function buildQueue(progress, segId, questions) {
  const qs = questions || [];
  return [...qs].sort((a, b) => {
    const sa = progress?.[segId]?.[a.id] || {};
    const sb = progress?.[segId]?.[b.id] || {};
    const ma = calcMastery(sa),
      mb = calcMastery(sb);
    if (ma !== mb) return ma - mb;
    if (!sa.lastSeen) return -1;
    if (!sb.lastSeen) return 1;
    return new Date(sa.lastSeen) - new Date(sb.lastSeen);
  });
}

function last14() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 13 + i);
    return d.toISOString().slice(0, 10);
  });
}

const btnStyle = (color, ex = {}) => ({
  background: color,
  border: "none",
  borderRadius: 10,
  padding: "11px 18px",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  ...ex,
});
const inpStyle = (ex = {}) => ({
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 8,
  padding: "10px 12px",
  color: "#f1f5f9",
  fontSize: 13,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  ...ex,
});

function MBar({ pct, color, h = 8 }) {
  return (
    <div
      style={{
        background: "#1e293b",
        borderRadius: 99,
        height: h,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 99,
          width: `${pct}%`,
          background:
            pct >= 80 ? "#22c55e" : pct >= 50 ? color : "#64748b",
          transition: "width 0.6s",
        }}
      />
    </div>
  );
}

function WeeklyChart({ daily }) {
  const days = last14();
  const data = days.map((d) => {
    const e = daily?.[d] || {};
    return {
      day: d.slice(5),
      attempts: e.attempts || 0,
      accuracy:
        (e.attempts || 0) > 0
          ? Math.round(((e.correct || 0) / e.attempts) * 100)
          : null,
    };
  });
  const wk = days.slice(7);
  const wa = wk.reduce((a, d) => a + (daily?.[d]?.attempts || 0), 0);
  const wc = wk.reduce((a, d) => a + (daily?.[d]?.correct || 0), 0);
  const ad = wk.filter((d) => (daily?.[d]?.attempts || 0) > 0).length;
  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 14,
        padding: 20,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#f1f5f9",
          marginBottom: 12,
        }}
      >
        📈 14-Day Activity
      </div>
      <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
        {[
          { v: wa, l: "This week", c: "#f97316" },
          {
            v: wa > 0 ? `${Math.round((wc / wa) * 100)}%` : "0%",
            l: "Accuracy",
            c: "#22c55e",
          },
          { v: `${ad}/7`, l: "Active days", c: "#a78bfa" },
        ].map(({ v, l, c }) => (
          <div key={l}>
            <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{l}</div>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <ComposedChart
          data={data}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickLine={false}
          />
          <YAxis
            yAxisId="l"
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickLine={false}
          />
          <YAxis
            yAxisId="r"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickLine={false}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(v, n) =>
              [n === "accuracy" ? `${v}%` : v, n === "accuracy" ? "Accuracy" : "Attempts"]
            }
          />
          <Bar
            yAxisId="l"
            dataKey="attempts"
            fill="#f9731640"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="r"
            dataKey="accuracy"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 3, fill: "#22c55e" }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function Notes({ qId, segId, progress, onSave }) {
  const saved = progress?.[segId]?.[qId]?.notes || "";
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(saved);
  useEffect(() => {
    setText(saved);
  }, [saved]);
  function save() {
    onSave(segId, qId, {
      ...(progress?.[segId]?.[qId] || { attempts: 0, correct: 0, streak: 0 }),
      notes: text,
    });
    setEditing(false);
  }
  return (
    <div style={{ marginTop: 8 }}>
      {!editing ? (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div
            style={{
              flex: 1,
              fontSize: 12,
              color: saved ? "#94a3b8" : "#475569",
              fontStyle: saved ? "normal" : "italic",
            }}
          >
            {saved || "No notes yet"}
          </div>
          <button
            onClick={() => {
              setText(saved);
              setEditing(true);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#f97316",
              cursor: "pointer",
              fontSize: 11,
              flexShrink: 0,
            }}
          >
            ✏️ {saved ? "Edit" : "Add"}
          </button>
        </div>
      ) : (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            autoFocus
            style={{ ...inpStyle(), resize: "vertical", marginBottom: 6 }}
            placeholder="Your personal notes..."
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={save}
              style={btnStyle("#22c55e", { fontSize: 12, padding: "7px 14px" })}
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              style={btnStyle("#475569", { fontSize: 12, padding: "7px 14px" })}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddModal({ segId, sections, onSave, onClose }) {
  const [tab, setTab] = useState("manual");
  const [form, setForm] = useState({
    q: "",
    opts: ["", "", "", ""],
    ans: 0,
    exp: "",
  });
  const [jsonText, setJsonText] = useState("");
  const [jsonErr, setJsonErr] = useState("");
  const allSegs = (sections || []).flatMap((s) => s.segments || []);
  const [target, setTarget] = useState(segId || (allSegs[0]?.id ?? ""));
  function updOpt(i, v) {
    const o = [...form.opts];
    o[i] = v;
    setForm((f) => ({ ...f, opts: o }));
  }
  function saveManual() {
    if (!form.q.trim() || form.opts.some((o) => !o.trim())) return;
    onSave(target, [
      {
        id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        ...form,
      },
    ]);
  }
  function saveJson() {
    setJsonErr("");
    try {
      let p = JSON.parse(jsonText);
      if (!Array.isArray(p)) p = [p];
      const v = p.filter(
        (q) =>
          q.q &&
          Array.isArray(q.opts) &&
          q.opts.length === 4 &&
          typeof q.ans === "number" &&
          q.exp
      );
      if (!v.length) {
        setJsonErr("No valid questions. Each needs: q, opts[4], ans (0-3), exp.");
        return;
      }
      onSave(
        target,
        v.map((q, i) => ({ ...q, id: q.id || `custom_${Date.now()}_${i}` }))
      );
    } catch (e) {
      setJsonErr("Invalid JSON: " + e.message);
    }
  }
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#00000099",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: 16,
          padding: 24,
          width: "100%",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
            Add Custom Question
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              fontSize: 20,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 11,
              color: "#64748b",
              fontWeight: 600,
              marginBottom: 5,
              textTransform: "uppercase",
            }}
          >
            Segment
          </div>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            style={{ ...inpStyle(), paddingTop: 9, paddingBottom: 9 }}
          >
            {(sections || []).map((sec) => (
              <optgroup key={sec.id} label={`${sec.icon} ${sec.label}`}>
                {(sec.segments || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {["manual", "json"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...btnStyle(tab === t ? "#f97316" : "#1e293b"),
                flex: 1,
                fontSize: 12,
              }}
            >
              {t === "manual" ? "✏️ Manual" : "📥 JSON Import"}
            </button>
          ))}
        </div>
        {tab === "manual" && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                Question
              </div>
              <textarea
                value={form.q}
                onChange={(e) => setForm((f) => ({ ...f, q: e.target.value }))}
                rows={3}
                style={{ ...inpStyle(), resize: "vertical" }}
                placeholder="Enter question..."
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                Options — click circle to mark correct
              </div>
              {form.opts.map((o, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <button
                    onClick={() => setForm((f) => ({ ...f, ans: i }))}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: `2px solid ${form.ans === i ? "#22c55e" : "#334155"}`,
                      background: form.ans === i ? "#22c55e" : "transparent",
                      cursor: "pointer",
                      flexShrink: 0,
                      color: "#fff",
                      fontSize: 10,
                    }}
                  >
                    {form.ans === i ? "✓" : ["A", "B", "C", "D"][i]}
                  </button>
                  <input
                    value={o}
                    onChange={(e) => updOpt(i, e.target.value)}
                    style={inpStyle()}
                    placeholder={`Option ${["A", "B", "C", "D"][i]}`}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                Explanation
              </div>
              <textarea
                value={form.exp}
                onChange={(e) => setForm((f) => ({ ...f, exp: e.target.value }))}
                rows={2}
                style={{ ...inpStyle(), resize: "vertical" }}
                placeholder="Why is this correct?"
              />
            </div>
            <button
              onClick={saveManual}
              disabled={
                !form.q.trim() || form.opts.some((o) => !o.trim())
              }
              style={btnStyle("#22c55e", {
                width: "100%",
                opacity:
                  !form.q.trim() || form.opts.some((o) => !o.trim()) ? 0.5 : 1,
              })}
            >
              ✓ Add Question
            </button>
          </>
        )}
        {tab === "json" && (
          <>
            <div
              style={{
                background: "#020617",
                border: "1px solid #1e293b",
                borderRadius: 8,
                padding: 12,
                marginBottom: 10,
                fontSize: 11,
                color: "#64748b",
                lineHeight: 1.8,
              }}
            >
              Format:{" "}
              <code style={{ color: "#94a3b8" }}>
                {'[{"q":"...","opts":["A","B","C","D"],"ans":0,"exp":"..."}]'}
              </code>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setJsonErr("");
              }}
              rows={8}
              style={{
                ...inpStyle(),
                resize: "vertical",
                fontFamily: "monospace",
                marginBottom: 8,
              }}
              placeholder='[{"q":"...","opts":["A","B","C","D"],"ans":0,"exp":"..."}]'
            />
            {jsonErr && (
              <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 8 }}>
                {jsonErr}
              </div>
            )}
            <button
              onClick={saveJson}
              style={btnStyle("#3b82f6", { width: "100%" })}
            >
              📥 Import Questions
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function QuizMode({ seg, progress, questions, onUpdate, onBack, onLog }) {
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const queue = buildQueue(progress, seg.id, questions);
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState(null);
  const [showExp, setShowExp] = useState(false);
  const [ss, setSS] = useState({ c: 0, w: 0, t: 0 });
  const [done, setDone] = useState(false);
  const q = queue[idx];
  function answer(i) {
    if (sel !== null || !q) return;
    setSel(i);
    setShowExp(true);
    const ok = i === q.ans;
    const prev =
      progressRef.current?.[seg.id]?.[q.id] ||
      { attempts: 0, correct: 0, streak: 0, notes: "" };
    onUpdate(seg.id, q.id, {
      ...prev,
      attempts: prev.attempts + 1,
      correct: prev.correct + (ok ? 1 : 0),
      streak: ok ? prev.streak + 1 : 0,
      lastSeen: new Date().toISOString(),
    });
    onLog(ok);
    setSS((s) => ({
      c: s.c + (ok ? 1 : 0),
      w: s.w + (ok ? 0 : 1),
      t: s.t + 1,
    }));
  }
  function next() {
    if (idx + 1 >= queue.length) {
      setDone(true);
      return;
    }
    setIdx((i) => i + 1);
    setSel(null);
    setShowExp(false);
  }
  function restart() {
    setIdx(0);
    setSel(null);
    setShowExp(false);
    setSS({ c: 0, w: 0, t: 0 });
    setDone(false);
  }
  if (done)
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#f1f5f9",
            marginBottom: 8,
          }}
        >
          Session Complete!
        </div>
        <div
          style={{
            fontSize: 15,
            color: "#94a3b8",
            marginBottom: 24,
          }}
        >
          {ss.c}/{ss.t} correct (
          {ss.t > 0 ? Math.round((ss.c / ss.t) * 100) : 0}%)
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={restart} style={btnStyle(seg.color)}>
            Study Again
          </button>
          <button onClick={onBack} style={btnStyle("#475569")}>
            Back
          </button>
        </div>
      </div>
    );
  if (!q)
    return (
      <div
        style={{
          color: "#64748b",
          textAlign: "center",
          padding: 40,
        }}
      >
        No questions available.
      </div>
    );
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          ← Back
        </button>
        <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
          <span style={{ color: "#22c55e" }}>✓ {ss.c}</span>
          <span style={{ color: "#ef4444" }}>✗ {ss.w}</span>
          <span style={{ color: "#64748b" }}>
            {idx + 1}/{queue.length}
          </span>
        </div>
      </div>
      <div
        style={{
          height: 4,
          background: "#1e293b",
          borderRadius: 99,
          marginBottom: 18,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${((idx + 1) / queue.length) * 100}%`,
            background: seg.color,
            transition: "width 0.4s",
          }}
        />
      </div>
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: 14,
          padding: 22,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: seg.color,
            fontWeight: 600,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {seg.label}
        </div>
        <div style={{ fontSize: 15, color: "#f1f5f9", lineHeight: 1.7 }}>
          {q.q}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {q.opts.map((opt, i) => {
          let bg = "#0f172a",
            border = "#1e293b",
            color = "#cbd5e1";
          if (sel !== null) {
            if (i === q.ans) {
              bg = "#14532d";
              border = "#22c55e";
              color = "#86efac";
            } else if (i === sel) {
              bg = "#450a0a";
              border = "#ef4444";
              color = "#fca5a5";
            }
          }
          return (
            <button
              key={i}
              onClick={() => answer(i)}
              style={{
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 10,
                padding: "13px 16px",
                color,
                fontSize: 13,
                textAlign: "left",
                cursor: sel !== null ? "default" : "pointer",
                transition: "all 0.2s",
              }}
            >
              <span style={{ marginRight: 8, fontWeight: 700, opacity: 0.5 }}>
                {["A", "B", "C", "D"][i]}.
              </span>
              {opt}
            </button>
          );
        })}
      </div>
      {showExp && (
        <div
          style={{
            background:
              sel === q.ans ? "#14532d30" : "#450a0a30",
            border: `1px solid ${sel === q.ans ? "#22c55e40" : "#ef444440"}`,
            borderRadius: 10,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: sel === q.ans ? "#22c55e" : "#ef4444",
              marginBottom: 6,
            }}
          >
            {sel === q.ans ? "✓ Correct!" : "✗ Incorrect"}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#94a3b8",
              lineHeight: 1.6,
              marginBottom: 10,
            }}
          >
            {q.exp}
          </div>
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 10 }}>
            <div
              style={{
                fontSize: 10,
                color: "#475569",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              📝 NOTES
            </div>
            <Notes
              qId={q.id}
              segId={seg.id}
              progress={progress}
              onSave={onUpdate}
            />
          </div>
        </div>
      )}
      {sel !== null && (
        <button
          onClick={next}
          style={btnStyle(seg.color, { width: "100%" })}
        >
          {idx + 1 >= queue.length ? "Finish Session →" : "Next Question →"}
        </button>
      )}
    </div>
  );
}

function FlashMode({ seg, progress, questions, onUpdate, onBack, onLog }) {
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const queue = buildQueue(progress, seg.id, questions);
  const [idx, setIdx] = useState(0);
  const [flip, setFlip] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const q = queue[idx];
  if (!q)
    return (
      <div
        style={{
          color: "#64748b",
          textAlign: "center",
          padding: 40,
        }}
      >
        No questions available.
      </div>
    );
  const stat =
    progressRef.current?.[seg.id]?.[q.id] || {
      attempts: 0,
      correct: 0,
      streak: 0,
      notes: "",
    };
  const m = calcMastery(stat);
  function rate(ok) {
    const s =
      progressRef.current?.[seg.id]?.[q.id] || {
        attempts: 0,
        correct: 0,
        streak: 0,
        notes: "",
      };
    onUpdate(seg.id, q.id, {
      ...s,
      attempts: s.attempts + 1,
      correct: s.correct + (ok ? 1 : 0),
      streak: ok ? s.streak + 1 : 0,
      lastSeen: new Date().toISOString(),
    });
    onLog(ok);
    setFlip(false);
    setShowNote(false);
    setTimeout(() => setIdx((i) => (i + 1) % queue.length), 50);
  }
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          ← Back
        </button>
        <span style={{ fontSize: 12, color: "#64748b" }}>
          {idx + 1}/{queue.length}
        </span>
      </div>
      <div
        onClick={() => setFlip((f) => !f)}
        style={{
          background: flip ? `${seg.color}15` : "#0f172a",
          border: `1px solid ${flip ? seg.color : "#1e293b"}`,
          borderRadius: 16,
          padding: "36px 28px",
          minHeight: 200,
          cursor: "pointer",
          transition: "all 0.3s",
          marginBottom: 12,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            fontSize: 11,
            color: "#475569",
          }}
        >
          {flip ? "Answer" : "Tap to flip"}
        </div>
        {!flip ? (
          <>
            <div
              style={{
                fontSize: 11,
                color: seg.color,
                fontWeight: 600,
                marginBottom: 10,
                textTransform: "uppercase",
              }}
            >
              Question
            </div>
            <div style={{ fontSize: 15, color: "#f1f5f9", lineHeight: 1.7 }}>
              {q.q}
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: 11,
                color: "#22c55e",
                fontWeight: 600,
                marginBottom: 10,
                textTransform: "uppercase",
              }}
            >
              Answer
            </div>
            <div
              style={{
                fontSize: 15,
                color: "#86efac",
                lineHeight: 1.7,
                marginBottom: 10,
              }}
            >
              {q.opts[q.ans]}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#94a3b8",
                lineHeight: 1.6,
              }}
            >
              {q.exp}
            </div>
          </>
        )}
        <div style={{ marginTop: 20 }}>
          <MBar pct={m} color={seg.color} h={4} />
          <div
            style={{
              fontSize: 11,
              color: "#475569",
              marginTop: 4,
            }}
          >
            Mastery {m}% · Streak {stat.streak} 🔥
          </div>
        </div>
      </div>
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 10,
          cursor: "pointer",
        }}
        onClick={() => setShowNote((n) => !n)}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "#64748b" }}>
            📝{" "}
            {stat.notes
              ? stat.notes.slice(0, 45) + (stat.notes.length > 45 ? "…" : "")
              : "Add notes"}
          </span>
          <span style={{ fontSize: 11, color: "#475569" }}>
            {showNote ? "▲" : "▼"}
          </span>
        </div>
        {showNote && (
          <div style={{ marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
            <Notes
              qId={q.id}
              segId={seg.id}
              progress={progress}
              onSave={onUpdate}
            />
          </div>
        )}
      </div>
      {flip && (
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => rate(false)}
            style={{ ...btnStyle("#ef4444"), flex: 1 }}
          >
            ✗ Hard
          </button>
          <button
            onClick={() => rate(true)}
            style={{ ...btnStyle("#22c55e"), flex: 1 }}
          >
            ✓ Got It
          </button>
        </div>
      )}
    </div>
  );
}

function SegDetail({
  seg,
  progress,
  questionsBySeg,
  sections,
  onBack,
  onUpdate,
  onCustomSave,
  onLog,
}) {
  const [mode, setMode] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const questions = questionsBySeg[seg.id] || [];
  const stats = segStats(progress, seg.id, questions);

  if (mode === "quiz")
    return (
      <QuizMode
        seg={seg}
        progress={progress}
        questions={questions}
        onUpdate={onUpdate}
        onBack={() => setMode(null)}
        onLog={onLog}
      />
    );
  if (mode === "flash")
    return (
      <FlashMode
        seg={seg}
        progress={progress}
        questions={questions}
        onUpdate={onUpdate}
        onBack={() => setMode(null)}
        onLog={onLog}
      />
    );

  return (
    <div>
      {showAdd && (
        <AddModal
          segId={seg.id}
          sections={sections}
          onSave={(sid, qs) => {
            onCustomSave(sid, qs);
            setShowAdd(false);
          }}
          onClose={() => setShowAdd(false)}
        />
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: "#f1f5f9",
            letterSpacing: "-0.5px",
          }}
        >
          genius<span style={{ color: "#f97316" }}>.</span>
        </div>
      </div>
      <div
        style={{
          fontSize: 10,
          color: "#475569",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: 16,
        }}
      >
        TExES Math 7–12 (235)
      </div>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "#64748b",
          cursor: "pointer",
          fontSize: 13,
          marginBottom: 16,
          padding: 0,
        }}
      >
        ← Back
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 26 }}>{seg.icon}</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9" }}>
              {seg.label}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {stats.mastered}/{stats.total} mastered
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={btnStyle("#f97316", { fontSize: 12, padding: "8px 12px" })}
        >
          + Add Q
        </button>
      </div>
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: 12,
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          {[
            ["Mastery", `${stats.masteryPct}%`, seg.color],
            ["Accuracy", `${stats.accuracy}%`, "#f1f5f9"],
            ["Attempts", stats.totalAttempts, "#f1f5f9"],
          ].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: c }}>
                {v}
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{l}</div>
            </div>
          ))}
        </div>
        <MBar pct={stats.masteryPct} color={seg.color} h={10} />
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 22 }}>
        <button
          onClick={() => setMode("quiz")}
          style={{ ...btnStyle(seg.color), flex: 1, padding: 14 }}
        >
          📝 Quiz Mode
        </button>
        <button
          onClick={() => setMode("flash")}
          style={{ ...btnStyle("#8b5cf6"), flex: 1, padding: 14 }}
        >
          🃏 Flashcards
        </button>
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#64748b",
          marginBottom: 10,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Questions
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {questions.map((q) => {
          const s =
            progress?.[seg.id]?.[q.id] || {
              attempts: 0,
              correct: 0,
              streak: 0,
              notes: "",
            };
          const m = calcMastery(s);
          return (
            <div
              key={q.id}
              style={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 10,
                padding: "12px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "#cbd5e1",
                    lineHeight: 1.5,
                    flex: 1,
                  }}
                >
                  {q.q}
                </div>
                {q.id.startsWith("custom_") && (
                  <span
                    style={{
                      fontSize: 10,
                      background: "#1e293b",
                      color: "#64748b",
                      borderRadius: 4,
                      padding: "2px 6px",
                      flexShrink: 0,
                    }}
                  >
                    custom
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <div style={{ flex: 1 }}>
                  <MBar pct={m} color={seg.color} h={6} />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: m >= 80 ? "#22c55e" : "#64748b",
                    minWidth: 70,
                    textAlign: "right",
                  }}
                >
                  {s.attempts > 0 ? `${m}% · ${s.streak}🔥` : "Unseen"}
                </span>
              </div>
              <div
                style={{
                  borderTop: "1px solid #ffffff08",
                  marginTop: 10,
                  paddingTop: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#475569",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  📝 NOTES
                </div>
                <Notes
                  qId={q.id}
                  segId={seg.id}
                  progress={progress}
                  onSave={onUpdate}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Dashboard({
  sections,
  progress,
  daily,
  questionsBySeg,
  onSelectSeg,
}) {
  const allSegs = (sections || []).flatMap((s) => s.segments || []);
  const overall = allSegs.reduce(
    (a, s) => {
      const qs = questionsBySeg[s.id] || [];
      const st = segStats(progress, s.id, qs);
      a.m += st.mastered;
      a.t += st.total;
      a.at += st.totalAttempts;
      return a;
    },
    { m: 0, t: 0, at: 0 }
  );
  const op = overall.t > 0 ? Math.round((overall.m / overall.t) * 100) : 0;

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: "#f1f5f9",
            letterSpacing: "-1px",
          }}
        >
          genius<span style={{ color: "#f97316" }}>.</span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#475569",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginTop: 3,
          }}
        >
          TExES Math 7–12 (235)
        </div>
      </div>
      <div
        style={{
          background: "linear-gradient(135deg,#1c1917,#0f172a)",
          border: "1px solid #c2410c",
          borderRadius: 14,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "#fed7aa", marginBottom: 2 }}>
              Overall Mastery
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#f1f5f9" }}>
              {op}%
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {overall.m}/{overall.t} mastered
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {overall.at} attempts
            </div>
          </div>
        </div>
        <MBar pct={op} color="#f97316" h={10} />
      </div>
      <WeeklyChart daily={daily} />
      {(sections || []).map((sec) => {
        const segs = sec.segments || [];
        let secMastered = 0,
          secTotal = 0;
        segs.forEach((sg) => {
          const st = segStats(progress, sg.id, questionsBySeg[sg.id] || []);
          secMastered += st.mastered;
          secTotal += st.total;
        });
        const ssPct =
          secTotal > 0 ? Math.round((secMastered / secTotal) * 100) : 0;
        return (
          <div key={sec.id} style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{sec.icon}</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
                  {sec.label}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 80 }}>
                  <MBar pct={ssPct} color={sec.color} h={6} />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    minWidth: 36,
                    textAlign: "right",
                  }}
                >
                  {ssPct}%
                </span>
              </div>
            </div>
            <div className="dashboard-segment-grid">
              {segs.map((seg) => {
                const st = segStats(
                  progress,
                  seg.id,
                  questionsBySeg[seg.id] || []
                );
                return (
                  <div
                    key={seg.id}
                    onClick={() => onSelectSeg(seg)}
                    style={{
                      background: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: 12,
                      padding: 14,
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: `${st.masteryPct}%`,
                        height: 3,
                        background: seg.color,
                        transition: "width 0.6s",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{seg.icon}</span>
                      <span
                        style={{
                          fontSize: 10,
                          color:
                            st.masteryPct >= 80 ? "#22c55e" : "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        {st.mastered}/{st.total}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#f1f5f9",
                        marginBottom: 6,
                        lineHeight: 1.4,
                      }}
                    >
                      {seg.label}
                    </div>
                    <MBar pct={st.masteryPct} color={seg.color} h={5} />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 5,
                        fontSize: 10,
                        color: "#64748b",
                      }}
                    >
                      <span>{st.masteryPct}%</span>
                      <span>
                        {st.totalAttempts > 0
                          ? `${st.accuracy}% acc`
                          : "Start"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div
        style={{
          padding: 14,
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: 10,
          fontSize: 12,
          color: "#64748b",
          lineHeight: 1.7,
        }}
      >
        💡 <strong style={{ color: "#94a3b8" }}>TExES 235 tip:</strong> Domain
        II (Patterns and Algebra) is the heaviest at 33% of the exam.
        Questions are sorted by lowest mastery first. Use{" "}
        <strong style={{ color: "#94a3b8" }}>+ Add Q</strong> to import questions
        from your study materials via JSON.
      </div>
    </div>
  );
}

export default function Texes235App({
  sections,
  progress,
  daily,
  questionsBySeg,
  activeSeg,
  setActiveSeg,
  onSelectSeg,
  onUpdate,
  onCustomSave,
  onLog,
}) {
  const allSegs = (sections || []).flatMap((s) => s.segments || []);
  const seg = activeSeg
    ? allSegs.find((s) => s.id === activeSeg)
    : null;

  return (
    <div
      className="app-container"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {!activeSeg || !seg ? (
        <Dashboard
          sections={sections}
          progress={progress}
          daily={daily}
          questionsBySeg={questionsBySeg}
          onSelectSeg={onSelectSeg}
        />
      ) : (
        <SegDetail
          seg={seg}
          progress={progress}
          questionsBySeg={questionsBySeg}
          sections={sections}
          onBack={() => setActiveSeg(null)}
          onUpdate={onUpdate}
          onCustomSave={onCustomSave}
          onLog={onLog}
        />
      )}
    </div>
  );
}
