import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const SUBJECTS = ["Mathematics", "Science", "English", "History", "Geography", "Computer", "Physics", "Chemistry"];

function calcGrade(avg) {
  if (avg >= 80) return { grade: "A", color: "#34d399" };
  if (avg >= 65) return { grade: "B", color: "#6ee7f7" };
  if (avg >= 50) return { grade: "C", color: "#fbbf24" };
  return { grade: "F", color: "#f87171" };
}

function Modal({ title, onClose, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={overlayStyle}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>{title}</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export default function Grades() {
  const { userProfile } = useAuth();
  const orgId = userProfile?.orgId;
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ studentId: "", subjects: {} });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  async function fetchAll() {
    if (!orgId) return;
    const [sSnap, gSnap] = await Promise.all([
      getDocs(query(collection(db, "students"), where("orgId", "==", orgId))),
      getDocs(query(collection(db, "grades"), where("orgId", "==", orgId))),
    ]);
    setStudents(sSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setGrades(gSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, [orgId]);

  function openAdd() {
    setEditing(null);
    setForm({ studentId: students[0]?.id || "", subjects: {} });
    setShowModal(true);
  }

  function openEdit(g) {
    setEditing(g.id);
    setForm({ studentId: g.studentId, subjects: { ...g.subjects } });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.studentId) return;
    setSaving(true);
    try {
      const studentName = students.find((s) => s.id === form.studentId)?.name || "";
      if (editing) {
        await updateDoc(doc(db, "grades", editing), { ...form, studentName, orgId, updatedAt: new Date().toISOString() });
      } else {
        await addDoc(collection(db, "grades"), { ...form, studentName, orgId, createdAt: new Date().toISOString() });
      }
      await fetchAll();
      setShowModal(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, "grades", id));
    await fetchAll();
  }

  function setMark(subject, val) {
    const n = Math.min(100, Math.max(0, Number(val)));
    setForm((f) => ({ ...f, subjects: { ...f.subjects, [subject]: n } }));
  }

  // Enrich grades
  const enriched = grades.map((g) => {
    const marks = Object.values(g.subjects || {}).map(Number).filter((v) => !isNaN(v));
    const total = marks.reduce((a, b) => a + b, 0);
    const avg = marks.length ? total / marks.length : 0;
    const { grade, color } = calcGrade(avg);
    const student = students.find((s) => s.id === g.studentId);
    return { ...g, total, avg: avg.toFixed(1), grade, gradeColor: color, studentName: student?.name || g.studentName || "Unknown" };
  }).filter((g) =>
    g.studentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        <Topbar />
        <div style={styles.content}>
          <div style={styles.headerRow}>
            <input
              style={styles.searchInput}
              placeholder="Search by student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openAdd} style={styles.addBtn}>
              + Add Grades
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.tableCard}
          >
            {loading ? (
              <div style={styles.empty}>Loading...</div>
            ) : enriched.length === 0 ? (
              <div style={styles.empty}>No grades found. Add grades for your students.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Student", ...SUBJECTS.slice(0, 5), "Total", "Avg", "Grade", "Actions"].map((h) => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enriched.map((g, i) => (
                    <motion.tr
                      key={g.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      style={styles.tr}
                    >
                      <td style={{ ...styles.td, color: "#d0d0e8", fontWeight: 500 }}>{g.studentName}</td>
                      {SUBJECTS.slice(0, 5).map((s) => (
                        <td key={s} style={styles.td}>{g.subjects?.[s] ?? "—"}</td>
                      ))}
                      <td style={{ ...styles.td, color: "#f0f0f8", fontWeight: 600 }}>{g.total}</td>
                      <td style={{ ...styles.td, color: "#6ee7f7" }}>{g.avg}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.gradeBadge, background: `${g.gradeColor}18`, border: `1px solid ${g.gradeColor}40`, color: g.gradeColor }}>
                          {g.grade}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <motion.button whileHover={{ scale: 1.1 }} onClick={() => openEdit(g)} style={styles.editBtn}>Edit</motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleDelete(g.id)} style={styles.delBtn}>Del</motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <Modal title={editing ? "Edit Grades" : "Add Student Grades"} onClose={() => setShowModal(false)}>
            <div style={styles.field}>
              <label style={styles.label}>Student</label>
              <select
                style={styles.input}
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              >
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={styles.subjectGrid}>
              {SUBJECTS.map((sub) => (
                <div key={sub} style={styles.field}>
                  <label style={styles.label}>{sub}</label>
                  <input
                    style={styles.input}
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0–100"
                    value={form.subjects[sub] ?? ""}
                    onChange={(e) => setMark(sub, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancel</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving} style={styles.saveBtn}>
                {saving ? "Saving..." : editing ? "Update" : "Save Grades"}
              </motion.button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
  backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
  justifyContent: "center", zIndex: 200,
};
const modalStyle = {
  width: 560, maxWidth: "94vw", background: "#10101a",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18,
  padding: 28, boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
  maxHeight: "90vh", overflowY: "auto",
};

const styles = {
  layout: { display: "flex", minHeight: "100vh", background: "#0a0a0f" },
  main: { marginLeft: 240, flex: 1, display: "flex", flexDirection: "column" },
  content: { padding: "28px 32px", flex: 1 },
  headerRow: { display: "flex", gap: 12, marginBottom: 24, alignItems: "center" },
  searchInput: {
    flex: 1, padding: "10px 14px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)",
    color: "#d0d0e8", fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none",
  },
  addBtn: {
    padding: "10px 20px", borderRadius: 10, border: "none",
    background: "linear-gradient(135deg, #6ee7f7, #a78bfa)", color: "#0a0a0f",
    fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer",
  },
  tableCard: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16, overflow: "auto",
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 800 },
  th: {
    fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, color: "#3a3a5c",
    letterSpacing: 1.2, textTransform: "uppercase", textAlign: "left",
    padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)",
    background: "rgba(255,255,255,0.01)", whiteSpace: "nowrap",
  },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.03)" },
  td: { fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#7a7a9a", padding: "12px 14px", verticalAlign: "middle", whiteSpace: "nowrap" },
  gradeBadge: {
    padding: "3px 10px", borderRadius: 6,
    fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700,
  },
  actions: { display: "flex", gap: 6 },
  editBtn: { padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.07)", color: "#a78bfa", fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: "pointer" },
  delBtn: { padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.07)", color: "#f87171", fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: "pointer" },
  empty: { fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#3a3a5c", padding: "50px 0", textAlign: "center" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: "#f0f0f8" },
  closeBtn: { width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#5a5a7a", cursor: "pointer", fontSize: 13 },
  subjectGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "16px 0 24px" },
  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 },
  label: { fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: "#5a5a7a", letterSpacing: 0.8, textTransform: "uppercase" },
  input: { padding: "10px 13px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#f0f0f8", fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none" },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 10 },
  cancelBtn: { padding: "10px 20px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#5a5a7a", fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: "pointer" },
  saveBtn: { padding: "10px 24px", borderRadius: 9, border: "none", background: "linear-gradient(135deg, #6ee7f7, #a78bfa)", color: "#0a0a0f", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" },
};
