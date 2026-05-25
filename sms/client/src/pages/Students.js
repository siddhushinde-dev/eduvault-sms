import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const CLASSES = ["Class 9", "Class 10", "Class 11", "Class 12", "Grad 1", "Grad 2", "Grad 3"];
const GRADES_FILTER = ["All", "A", "B", "C", "F"];

function Modal({ title, onClose, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={styles.overlay}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        style={styles.modal}
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

const emptyForm = { name: "", email: "", phone: "", class: "Class 10", rollNo: "", address: "" };

export default function Students() {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const orgId = userProfile?.orgId;

  async function fetchStudents() {
    if (!orgId) return;
    const snap = await getDocs(query(collection(db, "students"), where("orgId", "==", orgId)));
    setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  useEffect(() => { fetchStudents(); }, [orgId]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(s) {
    setEditing(s.id);
    setForm({ name: s.name || "", email: s.email || "", phone: s.phone || "", class: s.class || "Class 10", rollNo: s.rollNo || "", address: s.address || "" });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateDoc(doc(db, "students", editing), { ...form, updatedAt: new Date().toISOString() });
      } else {
        await addDoc(collection(db, "students"), { ...form, orgId, createdAt: new Date().toISOString() });
      }
      await fetchStudents();
      setShowModal(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, "students", id));
    setDeleteConfirm(null);
    await fetchStudents();
  }

  // Filter
  let filtered = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        <Topbar />
        <div style={styles.content}>
          {/* Header row */}
          <div style={styles.headerRow}>
            <div style={styles.searchWrap}>
              <span style={styles.searchIcon}>⌕</span>
              <input
                style={styles.searchInput}
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={styles.filterRow}>
              {GRADES_FILTER.map((g) => (
                <button
                  key={g}
                  onClick={() => setGradeFilter(g)}
                  style={{
                    ...styles.filterBtn,
                    ...(gradeFilter === g ? styles.filterBtnActive : {}),
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={openAdd}
              style={styles.addBtn}
            >
              + Add Student
            </motion.button>
          </div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={styles.tableCard}
          >
            <div style={styles.tableStats}>
              <span style={styles.tableCount}>{filtered.length} students</span>
            </div>
            {loading ? (
              <div style={styles.empty}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={styles.empty}>No students found. Click "+ Add Student" to get started.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["#", "Name", "Email", "Class", "Roll No", "Phone", "Actions"].map((h) => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={styles.tr}
                    >
                      <td style={{ ...styles.td, color: "#3a3a5c", fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{i + 1}</td>
                      <td style={styles.td}>
                        <div style={styles.nameCell}>
                          <div style={{ ...styles.avatar, background: `hsl(${(i * 47) % 360},55%,45%)` }}>
                            {s.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div style={styles.nameText}>{s.name}</div>
                            <div style={styles.addressText}>{s.address || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>{s.email || "—"}</td>
                      <td style={styles.td}>
                        <span style={styles.classBadge}>{s.class || "—"}</span>
                      </td>
                      <td style={styles.td}>{s.rollNo || "—"}</td>
                      <td style={styles.td}>{s.phone || "—"}</td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <motion.button whileHover={{ scale: 1.1 }} onClick={() => openEdit(s)} style={styles.editBtn}>Edit</motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} onClick={() => setDeleteConfirm(s.id)} style={styles.delBtn}>Del</motion.button>
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

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <Modal title={editing ? "Edit Student" : "Add New Student"} onClose={() => setShowModal(false)}>
            <div style={styles.formGrid}>
              {[
                { key: "name", label: "Full Name", placeholder: "Rahul Sharma" },
                { key: "email", label: "Email", placeholder: "rahul@school.edu" },
                { key: "phone", label: "Phone", placeholder: "+91 9876543210" },
                { key: "rollNo", label: "Roll No", placeholder: "2024-001" },
                { key: "address", label: "Address", placeholder: "Mumbai, Maharashtra" },
              ].map((f) => (
                <div key={f.key} style={f.key === "address" ? { ...styles.field, gridColumn: "1/-1" } : styles.field}>
                  <label style={styles.label}>{f.label}</label>
                  <input
                    style={styles.input}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                </div>
              ))}
              <div style={styles.field}>
                <label style={styles.label}>Class</label>
                <select style={styles.input} value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}>
                  {CLASSES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancel</button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving}
                style={styles.saveBtn}
              >
                {saving ? "Saving..." : editing ? "Update Student" : "Add Student"}
              </motion.button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <Modal title="Confirm Delete" onClose={() => setDeleteConfirm(null)}>
            <p style={styles.confirmText}>Are you sure you want to delete this student? This action cannot be undone.</p>
            <div style={styles.modalFooter}>
              <button onClick={() => setDeleteConfirm(null)} style={styles.cancelBtn}>Cancel</button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleDelete(deleteConfirm)}
                style={{ ...styles.saveBtn, background: "linear-gradient(135deg, #f87171, #fb923c)" }}
              >
                Delete
              </motion.button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  layout: { display: "flex", minHeight: "100vh", background: "#0a0a0f" },
  main: { marginLeft: 240, flex: 1, display: "flex", flexDirection: "column" },
  content: { padding: "28px 32px", flex: 1 },
  headerRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" },
  searchWrap: {
    flex: 1,
    minWidth: 200,
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    color: "#4a4a6a",
    fontSize: 18,
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "10px 14px 10px 38px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#d0d0e8",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    outline: "none",
  },
  filterRow: { display: "flex", gap: 6 },
  filterBtn: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "transparent",
    color: "#5a5a7a",
    fontFamily: "'Syne', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: 0.5,
    transition: "all 0.2s",
  },
  filterBtnActive: {
    background: "rgba(110,231,247,0.1)",
    border: "1px solid rgba(110,231,247,0.25)",
    color: "#6ee7f7",
  },
  addBtn: {
    padding: "10px 20px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #6ee7f7, #a78bfa)",
    color: "#0a0a0f",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    letterSpacing: 0.3,
    whiteSpace: "nowrap",
  },
  tableCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    overflow: "hidden",
  },
  tableStats: {
    padding: "14px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  tableCount: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "#4a4a6a",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    color: "#3a3a5c",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "left",
    padding: "12px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    background: "rgba(255,255,255,0.01)",
  },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.03)" },
  td: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "#7a7a9a",
    padding: "13px 16px",
    verticalAlign: "middle",
  },
  nameCell: { display: "flex", alignItems: "center", gap: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    color: "#0a0a0f",
    flexShrink: 0,
  },
  nameText: { color: "#d0d0e8", fontWeight: 500, fontSize: 14 },
  addressText: { color: "#3a3a5c", fontSize: 11, marginTop: 2 },
  classBadge: {
    padding: "3px 10px",
    borderRadius: 6,
    background: "rgba(110,231,247,0.08)",
    border: "1px solid rgba(110,231,247,0.15)",
    color: "#6ee7f7",
    fontFamily: "'Syne', sans-serif",
    fontSize: 11,
    fontWeight: 600,
  },
  actions: { display: "flex", gap: 6 },
  editBtn: {
    padding: "5px 12px",
    borderRadius: 6,
    border: "1px solid rgba(167,139,250,0.3)",
    background: "rgba(167,139,250,0.07)",
    color: "#a78bfa",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    cursor: "pointer",
  },
  delBtn: {
    padding: "5px 12px",
    borderRadius: 6,
    border: "1px solid rgba(248,113,113,0.3)",
    background: "rgba(248,113,113,0.07)",
    color: "#f87171",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    cursor: "pointer",
  },
  empty: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "#3a3a5c",
    padding: "50px 0",
    textAlign: "center",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
  },
  modal: {
    width: 520,
    maxWidth: "94vw",
    background: "#10101a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 18,
    padding: 28,
    boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 18,
    color: "#f0f0f8",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent",
    color: "#5a5a7a",
    cursor: "pointer",
    fontSize: 13,
  },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: "#5a5a7a", letterSpacing: 0.8, textTransform: "uppercase" },
  input: {
    padding: "10px 13px",
    borderRadius: 9,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#f0f0f8",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    outline: "none",
  },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 10 },
  cancelBtn: {
    padding: "10px 20px",
    borderRadius: 9,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent",
    color: "#5a5a7a",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    cursor: "pointer",
  },
  saveBtn: {
    padding: "10px 24px",
    borderRadius: 9,
    border: "none",
    background: "linear-gradient(135deg, #6ee7f7, #a78bfa)",
    color: "#0a0a0f",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  confirmText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "#7a7a9a",
    marginBottom: 24,
    lineHeight: 1.6,
  },
};
