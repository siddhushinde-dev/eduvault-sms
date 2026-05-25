import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  collection, getDocs, addDoc, query, where, deleteDoc, doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function Attendance() {
  const { userProfile } = useAuth();
  const orgId = userProfile?.orgId;
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");

  async function fetchAll() {
    if (!orgId) return;
    const [sSnap, aSnap] = await Promise.all([
      getDocs(query(collection(db, "students"), where("orgId", "==", orgId))),
      getDocs(query(collection(db, "attendance"), where("orgId", "==", orgId))),
    ]);
    const studs = sSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const att = aSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setStudents(studs);
    setAttendance(att);
    // Pre-fill today's marks
    const todayAtt = att.filter((a) => a.date === date);
    const m = {};
    todayAtt.forEach((a) => { m[a.studentId] = a.status; });
    setMarks(m);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, [orgId]);

  useEffect(() => {
    const todayAtt = attendance.filter((a) => a.date === date);
    const m = {};
    todayAtt.forEach((a) => { m[a.studentId] = a.status; });
    setMarks(m);
    setSaved(false);
  }, [date, attendance]);

  function toggle(sid) {
    setMarks((prev) => ({
      ...prev,
      [sid]: prev[sid] === "present" ? "absent" : "present",
    }));
  }

  async function saveAttendance() {
    setSaving(true);
    // Delete existing for this date
    const existing = attendance.filter((a) => a.date === date);
    await Promise.all(existing.map((a) => deleteDoc(doc(db, "attendance", a.id))));
    // Add new
    await Promise.all(
      students.map((s) =>
        addDoc(collection(db, "attendance"), {
          orgId,
          studentId: s.id,
          studentName: s.name,
          date,
          status: marks[s.id] || "absent",
          createdAt: new Date().toISOString(),
        })
      )
    );
    await fetchAll();
    setSaved(true);
    setSaving(false);
  }

  // Stats per student
  function getAttStats(sid) {
    const recs = attendance.filter((a) => a.studentId === sid);
    const present = recs.filter((a) => a.status === "present").length;
    const pct = recs.length ? ((present / recs.length) * 100).toFixed(0) : 0;
    return { total: recs.length, present, pct };
  }

  const filtered = students.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPresent = Object.values(marks).filter((v) => v === "present").length;
  const totalAbsent = students.length - totalPresent;

  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        <Topbar />
        <div style={styles.content}>
          {/* Controls */}
          <div style={styles.controlRow}>
            <div style={styles.dateWrap}>
              <label style={styles.dateLabel}>Attendance Date</label>
              <input
                type="date"
                style={styles.dateInput}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <input
              style={styles.searchInput}
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={saveAttendance}
              disabled={saving || students.length === 0}
              style={styles.saveBtn}
            >
              {saving ? "Saving..." : saved ? "✓ Saved" : "Save Attendance"}
            </motion.button>
          </div>

          {/* Stats row */}
          <div style={styles.statsRow}>
            {[
              { label: "Total Students", val: students.length, color: "#6ee7f7" },
              { label: "Present Today", val: totalPresent, color: "#34d399" },
              { label: "Absent Today", val: totalAbsent, color: "#f87171" },
              { label: "Attendance %", val: students.length ? `${((totalPresent / students.length) * 100).toFixed(0)}%` : "—", color: "#a78bfa" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={styles.statCard}
              >
                <div style={{ ...styles.statVal, color: s.color }}>{s.val}</div>
                <div style={styles.statLabel}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Student grid */}
          {loading ? (
            <div style={styles.empty}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={styles.empty}>No students found. Add students first.</div>
          ) : (
            <div style={styles.grid}>
              {filtered.map((s, i) => {
                const status = marks[s.id] || "absent";
                const isPresent = status === "present";
                const stats = getAttStats(s.id);
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => toggle(s.id)}
                    style={{
                      ...styles.studentCard,
                      borderColor: isPresent ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.06)",
                      background: isPresent ? "rgba(52,211,153,0.05)" : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ ...styles.avatar, background: isPresent ? "#34d399" : "#2a2a3a" }}>
                      {s.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div style={styles.cardName}>{s.name}</div>
                    <div style={styles.cardClass}>{s.class || "—"}</div>
                    <div style={styles.attRow}>
                      <div style={styles.attPct}>
                        <span style={{ color: "#6ee7f7", fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{stats.pct}%</span>
                        <span style={{ color: "#3a3a5c", fontSize: 10, marginLeft: 4 }}>overall</span>
                      </div>
                    </div>
                    <div style={{ ...styles.statusBadge, background: isPresent ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.1)", color: isPresent ? "#34d399" : "#f87171", border: `1px solid ${isPresent ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.2)"}` }}>
                      {isPresent ? "✓ Present" : "✕ Absent"}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout: { display: "flex", minHeight: "100vh", background: "#0a0a0f" },
  main: { marginLeft: 240, flex: 1, display: "flex", flexDirection: "column" },
  content: { padding: "28px 32px", flex: 1 },
  controlRow: { display: "flex", gap: 14, alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap" },
  dateWrap: { display: "flex", flexDirection: "column", gap: 6 },
  dateLabel: { fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#5a5a7a", letterSpacing: 0.8, textTransform: "uppercase" },
  dateInput: { padding: "10px 13px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#d0d0e8", fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none" },
  searchInput: { flex: 1, minWidth: 180, padding: "10px 13px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#d0d0e8", fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none" },
  saveBtn: { padding: "10px 22px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #34d399, #6ee7f7)", color: "#0a0a0f", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 },
  statCard: { padding: "18px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 },
  statVal: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, marginBottom: 4 },
  statLabel: { fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#4a4a6a" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 },
  studentCard: {
    padding: 18,
    border: "1px solid",
    borderRadius: 14,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    userSelect: "none",
    transition: "all 0.2s",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 18,
    color: "#0a0a0f",
    transition: "background 0.2s",
  },
  cardName: { fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 13, color: "#d0d0e8", textAlign: "center" },
  cardClass: { fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#3a3a5c" },
  attRow: { display: "flex", alignItems: "center" },
  attPct: { fontFamily: "'DM Sans', sans-serif", fontSize: 12 },
  statusBadge: { padding: "4px 10px", borderRadius: 6, fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700 },
  empty: { fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#3a3a5c", padding: "60px 0", textAlign: "center" },
};
