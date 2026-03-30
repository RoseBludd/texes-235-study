"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchSections,
  fetchQuestions,
  fetchProgress,
  fetchDaily,
  saveProgress,
  saveDaily,
  saveCustomQuestions,
} from "../lib/api";
import Texes235App from "./components/Texes235App";

const CLIENT_ID_KEY = "texes_235_client_id";

let memoryFallback = null;

function getStorageItem(key) {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return key === CLIENT_ID_KEY ? memoryFallback : null;
    }
  }
}

function setStorageItem(key, value) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
    return;
  } catch {
    try {
      sessionStorage.setItem(key, value);
      return;
    } catch {
      if (key === CLIENT_ID_KEY) memoryFallback = value;
    }
  }
}

function getClientId() {
  if (typeof window === "undefined") return "";
  let id = getStorageItem(CLIENT_ID_KEY);
  if (!id || typeof id !== "string") {
    id = "texes235_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    setStorageItem(CLIENT_ID_KEY, id);
  }
  return id;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function Page() {
  const [sections, setSections] = useState([]);
  const [progress, setProgress] = useState({});
  const [daily, setDaily] = useState({});
  const [questionsBySeg, setQuestionsBySeg] = useState({});
  const [activeSeg, setActiveSeg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const clientIdRef = useRef(null);

  useEffect(() => {
    clientIdRef.current = getClientId();
    const cid = clientIdRef.current;
    Promise.all([
      fetchSections(),
      fetchProgress(cid),
      fetchDaily(cid),
    ])
      .then(([secs, prog, d]) => {
        setSections(secs || []);
        setProgress(prog || {});
        setDaily(d || {});
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const loadQuestionsForSegment = useCallback(async (segmentId) => {
    if (questionsBySeg[segmentId]) return questionsBySeg[segmentId];
    const cid = clientIdRef.current || getClientId();
    const qs = await fetchQuestions(segmentId, cid);
    setQuestionsBySeg((prev) => ({ ...prev, [segmentId]: qs }));
    return qs;
  }, [questionsBySeg]);

  const handleUpdate = useCallback(async (segId, qId, stat) => {
    const cid = clientIdRef.current || getClientId();
    setProgress((prev) => ({
      ...prev,
      [segId]: { ...prev[segId], [qId]: stat },
    }));
    try {
      await saveProgress(cid, segId, qId, stat);
    } catch (e) {
      console.error("Save progress failed", e);
    }
  }, []);

  const handleCustomSave = useCallback(async (segId, newQs) => {
    const cid = clientIdRef.current || getClientId();
    await saveCustomQuestions(cid, segId, newQs);
    const qs = await fetchQuestions(segId, cid);
    setQuestionsBySeg((prev) => ({ ...prev, [segId]: qs }));
    setProgress((prev) => {
      const seg = { ...prev[segId] };
      newQs.forEach((q) => {
        if (!seg[q.id]) seg[q.id] = { attempts: 0, correct: 0, streak: 0, notes: "" };
      });
      return { ...prev, [segId]: seg };
    });
  }, []);

  const handleLog = useCallback(async (ok) => {
    const key = todayKey();
    setDaily((prev) => {
      const t = prev[key] || { attempts: 0, correct: 0 };
      return {
        ...prev,
        [key]: { attempts: t.attempts + 1, correct: t.correct + (ok ? 1 : 0) },
      };
    });
    const cid = clientIdRef.current || getClientId();
    try {
      await saveDaily(cid, key, 1, ok ? 1 : 0);
    } catch (e) {
      console.error("Save daily failed", e);
    }
  }, []);

  const onSelectSeg = useCallback(async (seg) => {
    await loadQuestionsForSegment(seg.id);
    setActiveSeg(seg.id);
  }, [loadQuestionsForSegment]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#020617",
          color: "#64748b",
        }}
      >
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 24,
          background: "#020617",
          color: "#ef4444",
          minHeight: "100vh",
        }}
      >
        Error: {error}. Ensure DATABASE_URL is set and migrations/seed have been run.
    </div>
  );
  }

    return (
    <Texes235App
      sections={sections}
      progress={progress}
      daily={daily}
      questionsBySeg={questionsBySeg}
      activeSeg={activeSeg}
      setActiveSeg={setActiveSeg}
      onSelectSeg={onSelectSeg}
      onUpdate={handleUpdate}
      onCustomSave={handleCustomSave}
      onLog={handleLog}
    />
  );
}
