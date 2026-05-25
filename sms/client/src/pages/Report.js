import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

function calcGrade(avg) {
  if (avg >= 80) return { grade: "A", label: "Excellent", color: "#34d399" };
  if (avg >= 65) return { grade: "B", label: "Good", color: "#6ee7f7" };
  if (avg >= 50) return { grade: "C", label: "Average", color: "#fbbf24" };
  return { grade: "F", label: "Fail", color: "#f87171" };
}

export default function Report() {
  const { userProfile } = useAuth();
  const orgId = userProfile?.orgId;
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!orgId) return;
    async function fetch() {
      const [sSnap, gSnap, aSnap] = await Promise.all([
        getDocs(query(collection(db, "students"), where("orgId", "==", orgId))),
        getDocs(query(collection(db, "grades"), where("orgId", "==", orgId))),
        getDocs(query(collection(db, "attendance"), where("orgId", "==", orgId))),
      ]);
      setStudents(sSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setGrades(gSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setAttendance(aSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetch();
  }, [orgId]);

  function getStudentReport(student) {
    const grade = grades.find((g) => g.studentId === student.id);
    const attRecs = attendance.filter((a) => a.studentId === student.id);
    const present = attRecs.filter((a) => a.status === "present").length;
    const attPct = attRecs.length ? ((present / attRecs.length) * 100).toFixed(1) : 0;

    const subjects = grade?.subjects || {};
    const marks = Object.values(subjects).map(Number).filter((v) => !isNaN(v));
    const total = marks.reduce((a, b) => a + b, 0);
    const avg = marks.length ? total / marks.length : 0;
    const { grade: g, label, color } = calcGrade(avg);

    const radarData = Object.entries(subjects).map(([sub, val]) => ({
      subject: sub.slice(0, 4),
      marks: Number(val),
      fullMark: 100,
    }));

    return { grade, subjects, total, avg: avg.toFixed(1), gradeLabel: g, gradeDesc: label, gradeColor: color, attPct, present, totalAtt: attRecs.length, radarData };
  }

  const selectedStudent = selected ? students.find((s) => s.id === selected) : null;
  const report = selectedStudent ? getStudentReport(selectedStudent) : null;

  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        <Topbar />
        <div style={styles.content}>
          {loading ? (
            <div style={styles.empty}>Loading...</div>
          ) : (
            <div style={styles.twoCol}>
              {/* Student list */}
              <div style={styles.listCard}>
                <div style={styles.listHeader}>
                  <div style={styles.listTitle}>Students</div>
                  <div style={styles.listCount}>{students.length}</div>
                </div>
                {students.length === 0 ? (
                  <div style={styles.empty}>No students found.</div>
                ) : (
                  <div style={styles.list}>
                    {students.map((s, i) => {
                      const r = getStudentReport(s);
                      return (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => setSelected(s.id)}
                          style={{
                            ...styles.listItem,
                            background: selected === s.id ? "rgba(110,231,247,0.07)" : "transparent",
                            borderColor: selected === s.id ? "rgba(110,231,247,0.2)" : "transparent",
                          }}
                        >
                          <div style={{ ...styles.listAvatar, background: `hsl(${(i * 55) % 360},55%,45%)` }}>
                            {s.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div style={styles.listInfo}>
                            <div style={styles.listName}>{s.name}</div>
                            <div style={styles.listSub}>{s.class || "—"} · Roll {s.rollNo || "—"}</div>
                          </div>
                          <div style={{ ...styles.gradePill, background: `${r.gradeColor}18`, color: r.gradeColor, border: `1px solid ${r.gradeColor}40` }}>
                            {r.gradeLabel}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Report card */}
              {report && selectedStudent ? (
                <motion.div
                  key={selected}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={styles.reportCard}
                >
                  {/* Header */}
                  <div style={styles.reportHeader}>
                    <div style={styles.reportLogoRow}>
                      <div style={styles.reportLogo}>EV</div>
                      <div>
                        <div style={styles.reportLogoName}>EduVault</div>
                        <div style={styles.reportLogoSub}>{userProfile?.orgId}</div>
                      </div>
                    </div>
                    <div style={styles.reportTitle}>Student Report Card</div>
                  </div>

                  {/* Student info */}
                  <div style={styles.infoGrid}>
                    {[
                      { label: "Student Name", val: selectedStudent.name },
                      { label: "Class", val: selectedStudent.class || "—" },
                      { label: "Roll No", val: selectedStudent.rollNo || "—" },
                      { label: "Email", val: selectedStudent.email || "—" },
                    ].map((f) => (
                      <div key={f.label} style={styles.infoField}>
                        <div style={styles.infoLabel}>{f.label}</div>
                        <div style={styles.infoVal}>{f.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Subjects */}
                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>Subject-Wise Marks</div>
                    {Object.keys(report.subjects).length === 0 ? (
                      <div style={styles.noData}>No grades recorded yet.</div>
                    ) : (
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            {["Subject", "Marks", "Max", "Status"].map((h) => (
                              <th key={h} style={styles.th}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(report.subjects).map(([sub, val], i) => {
                            const v = Number(val);
                            const { grade: sg, color: sc } = calcGrade(v);
                            return (
                              <tr key={sub} style={styles.tr}>
                                <td style={{ ...styles.td, color: "#d0d0e8", fontWeight: 500 }}>{sub}</td>
                                <td style={{ ...styles.td, color: "#6ee7f7", fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{v}</td>
                                <td style={styles.td}>100</td>
                                <td style={styles.td}>
                                  <div style={styles.progressWrap}>
                                    <div style={styles.progressBar}>
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${v}%` }}
                                        transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                                        style={{ ...styles.progressFill, background: sc }}
                                      />
                                    </div>
                                    <span style={{ ...styles.gradeTag, color: sc }}>{sg}</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Radar + Summary */}
                  <div style={styles.bottomRow}>
                    {report.radarData.length > 0 && (
                      <div style={styles.radarWrap}>
                        <div style={styles.sectionTitle}>Performance Radar</div>
                        <ResponsiveContainer width="100%" height={200}>
                          <RadarChart data={report.radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.06)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: "#5a5a7a", fontSize: 11, fontFamily: "DM Sans" }} />
                            <Radar dataKey="marks" stroke="#6ee7f7" fill="#6ee7f7" fillOpacity={0.15} strokeWidth={2} />
                            <Tooltip contentStyle={{ background: "#12121a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontFamily: "DM Sans", fontSize: 12, color: "#d0d0e8" }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    <div style={styles.summaryCard}>
                      <div style={styles.sectionTitle}>Final Summary</div>
                      <div style={styles.summaryItems}>
                        {[
                          { label: "Total Marks", val: report.total },
                          { label: "Average", val: report.avg },
                          { label: "Attendance", val: `${report.attPct}%` },
                          { label: `${report.present}/${report.totalAtt} days`, val: "" },
                        ].map((s) => (
                          <div key={s.label} style={styles.summaryRow}>
                            <span style={styles.sumLabel}>{s.label}</span>
                            {s.val && <span style={styles.sumVal}>{s.val}</span>}
                          </div>
                        ))}
                      </div>
                      <div style={{ ...styles.finalGrade, background: `${report.gradeColor}12`, border: `1px solid ${report.gradeColor}40` }}>
                        <div style={{ ...styles.gradeChar, color: report.gradeColor }}>{report.gradeLabel}</div>
                        <div style={{ color: report.gradeColor, fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>{report.gradeDesc}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div style={styles.placeholder}>
                  <div style={styles.placeholderIcon}>◧</div>
                  <div style={styles.placeholderText}>Select a student to view their report card</div>
                </div>
              )}
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
  twoCol: { display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" },
  listCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden", position: "sticky", top: 90 },
  listHeader: { padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" },
  listTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#d0d0e8" },
  listCount: { width: 24, height: 24, borderRadius: 6, background: "rgba(110,231,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: "#6ee7f7" },
  list: { maxHeight: "70vh", overflowY: "auto" },
  listItem: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer", border: "1px solid transparent", margin: 4, borderRadius: 10, transition: "all 0.15s" },
  listAvatar: { width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: "#0a0a0f", flexShrink: 0 },
  listInfo: { flex: 1, overflow: "hidden" },
  listName: { fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, color: "#d0d0e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  listSub: { fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#3a3a5c" },
  gradePill: { padding: "2px 8px", borderRadius: 6, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, flexShrink: 0 },
  reportCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 28 },
  reportHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.06)" },
  reportLogoRow: { display: "flex", alignItems: "center", gap: 10 },
  reportLogo: { width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #6ee7f7, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 12, color: "#0a0a0f" },
  reportLogoName: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: "#f0f0f8" },
  reportLogoSub: { fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#4a4a6a" },
  reportTitle: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: "#4a4a6a", letterSpacing: 1.5, textTransform: "uppercase" },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24, padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)" },
  infoField: { display: "flex", flexDirection: "column", gap: 3 },
  infoLabel: { fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#3a3a5c", textTransform: "uppercase", letterSpacing: 1 },
  infoVal: { fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 500, color: "#d0d0e8" },
  section: { marginBottom: 22 },
  sectionTitle: { fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 13, color: "#5a5a7a", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 700, color: "#3a3a5c", letterSpacing: 1.2, textTransform: "uppercase", textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.03)" },
  td: { fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#6a6a8a", padding: "10px 12px" },
  progressWrap: { display: "flex", alignItems: "center", gap: 10 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  gradeTag: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, minWidth: 14 },
  bottomRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 },
  radarWrap: {},
  summaryCard: { padding: 18, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)" },
  summaryItems: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  sumLabel: { fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#5a5a7a" },
  sumVal: { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: "#d0d0e8" },
  finalGrade: { padding: "14px", borderRadius: 10, textAlign: "center" },
  gradeChar: { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 42, lineHeight: 1, marginBottom: 4 },
  noData: { fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#3a3a5c", padding: "20px 0" },
  placeholder: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, gap: 14 },
  placeholderIcon: { fontSize: 48, color: "#2a2a3a" },
  placeholderText: { fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#3a3a5c" },
  empty: { fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#3a3a5c", padding: "50px 0", textAlign: "center" },
};
