import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";
import {
  collection, getCountFromServer, getDocs, query, where, orderBy, limit,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

function StatCard({ label, value, icon, color, index }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      style={{ ...styles.statCard, borderColor: `${color}22` }}
    >
      <div style={{ ...styles.statIcon, background: `${color}14`, color }}>{icon}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statAccent, background: color }} />
    </motion.div>
  );
}

export default function Dashboard() {
  const { userProfile } = useAuth();
  const [recentStudents, setRecentStudents] = useState([]);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.orgId) return;
    async function fetchData() {
      try {
        const orgId = userProfile.orgId;
        const studentCountQuery = query(collection(db, "students"), where("orgId", "==", orgId));
        const recentStudentsQuery = query(
          collection(db, "students"),
          where("orgId", "==", orgId),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const [countSnap, recentSnap, gSnap, aSnap] = await Promise.all([
          getCountFromServer(studentCountQuery),
          getDocs(recentStudentsQuery),
          getDocs(query(collection(db, "grades"), where("orgId", "==", orgId))),
          getDocs(query(collection(db, "attendance"), where("orgId", "==", orgId))),
        ]);
        setTotalStudentsCount(countSnap.data().count || 0);
        setRecentStudents(recentSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setGrades(gSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setAttendance(aSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    fetchData();
  }, [userProfile]);

  // Analytics
  const totalStudents = totalStudentsCount;

  const allMarks = grades.flatMap((g) =>
    Object.values(g.subjects || {}).map((v) => Number(v))
  );
  const avgMarks = allMarks.length
    ? (allMarks.reduce((a, b) => a + b, 0) / allMarks.length).toFixed(1)
    : "—";

  const presentDays = attendance.filter((a) => a.status === "present").length;
  const attendancePct = attendance.length
    ? ((presentDays / attendance.length) * 100).toFixed(1)
    : "—";

  // Bar chart: average per subject across all grades
  const subjectMap = {};
  grades.forEach((g) => {
    Object.entries(g.subjects || {}).forEach(([sub, val]) => {
      if (!subjectMap[sub]) subjectMap[sub] = [];
      subjectMap[sub].push(Number(val));
    });
  });
  const chartData = Object.entries(subjectMap).map(([sub, vals]) => ({
    subject: sub,
    avg: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)),
  }));

  // Grade distribution
  const gradeDist = { A: 0, B: 0, C: 0, F: 0 };
  grades.forEach((g) => {
    const vals = Object.values(g.subjects || {}).map(Number);
    if (!vals.length) return;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg >= 80) gradeDist.A++;
    else if (avg >= 65) gradeDist.B++;
    else if (avg >= 50) gradeDist.C++;
    else gradeDist.F++;
  });
  const gradeChartData = Object.entries(gradeDist).map(([g, count]) => ({ grade: g, count }));

  // Recent students
  const stats = [
    { label: "Total Students", value: totalStudents, icon: "◈", color: "#6ee7f7" },
    { label: "Avg. Marks", value: avgMarks, icon: "◆", color: "#a78bfa" },
    { label: "Attendance %", value: attendancePct + "%", icon: "◉", color: "#34d399" },
    { label: "Total Grades", value: grades.length, icon: "◧", color: "#fbbf24" },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={styles.tooltip}>
          <div style={styles.tooltipLabel}>{label}</div>
          <div style={styles.tooltipVal}>{payload[0].value}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        <Topbar />
        <div style={styles.content}>
          {loading ? (
            <div style={styles.loadingWrap}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                style={styles.spinner}
              />
              <p style={styles.loadingText}>Loading analytics...</p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div style={styles.statsGrid}>
                {stats.map((s, i) => (
                  <StatCard key={s.label} {...s} index={i} />
                ))}
              </div>

              {/* Charts Row */}
              <div style={styles.chartsRow}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  style={styles.chartCard}
                >
                  <div style={styles.chartHeader}>
                    <div style={styles.chartTitle}>Subject Performance</div>
                    <div style={styles.chartSub}>Average marks per subject</div>
                  </div>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="subject" tick={{ fill: "#5a5a7a", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#5a5a7a", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="avg" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                        <defs>
                          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6ee7f7" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.5} />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={styles.empty}>No grade data yet. Add grades for students.</div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  style={styles.chartCard}
                >
                  <div style={styles.chartHeader}>
                    <div style={styles.chartTitle}>Grade Distribution</div>
                    <div style={styles.chartSub}>Students per grade band</div>
                  </div>
                  {gradeChartData.some((d) => d.count > 0) ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={gradeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="grade" tick={{ fill: "#5a5a7a", fontSize: 13, fontFamily: "Syne" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#5a5a7a", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="url(#barGrad2)" radius={[6, 6, 0, 0]} />
                        <defs>
                          <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#34d399" stopOpacity={0.5} />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={styles.empty}>No grade distribution data yet.</div>
                  )}
                </motion.div>
              </div>

              {/* Recent Students */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                style={styles.tableCard}
              >
                <div style={styles.chartHeader}>
                  <div style={styles.chartTitle}>Recent Students</div>
                  <div style={styles.chartSub}>Latest enrollments in your organization</div>
                </div>
                {recentStudents.length > 0 ? (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {["Name", "Email", "Class", "Roll No", "Joined"].map((h) => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentStudents.map((s, i) => (
                        <motion.tr
                          key={s.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + i * 0.05 }}
                          style={styles.tr}
                        >
                          <td style={styles.td}>
                            <div style={styles.nameCell}>
                              <div style={{ ...styles.studentAvatar, background: `hsl(${(i * 60) % 360},60%,50%)` }}>
                                {s.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              {s.name}
                            </div>
                          </td>
                          <td style={styles.td}>{s.email || "—"}</td>
                          <td style={styles.td}>{s.class || "—"}</td>
                          <td style={styles.td}>{s.rollNo || "—"}</td>
                          <td style={styles.td}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={styles.empty}>No students enrolled yet. Go to Students to add some.</div>
                )}
              </motion.div>
            </>
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
  loadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, gap: 16 },
  spinner: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "3px solid rgba(110,231,247,0.2)",
    borderTopColor: "#6ee7f7",
  },
  loadingText: { fontFamily: "'DM Sans', sans-serif", color: "#4a4a6a", fontSize: 14 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 24 },
  statCard: {
    position: "relative",
    padding: "24px 22px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    overflow: "hidden",
    backdropFilter: "blur(10px)",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    marginBottom: 14,
  },
  statValue: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 32,
    color: "#f0f0f8",
    letterSpacing: -0.5,
    lineHeight: 1,
    marginBottom: 6,
  },
  statLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "#4a4a6a",
    fontWeight: 400,
  },
  statAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 3,
    height: "100%",
    borderRadius: "2px 0 0 2px",
    opacity: 0.6,
  },
  chartsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 24 },
  chartCard: {
    padding: "24px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
  },
  chartHeader: { marginBottom: 20 },
  chartTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 16,
    color: "#d0d0e8",
    marginBottom: 4,
  },
  chartSub: { fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#4a4a6a" },
  tooltip: {
    padding: "8px 12px",
    background: "#12121a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
  },
  tooltipLabel: { fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6a6a8a", marginBottom: 2 },
  tooltipVal: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: "#6ee7f7" },
  tableCard: {
    padding: 24,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
  },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 8 },
  th: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 11,
    fontWeight: 600,
    color: "#3a3a5c",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.15s" },
  td: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "#8a8aaa",
    padding: "12px 12px",
    verticalAlign: "middle",
  },
  nameCell: { display: "flex", alignItems: "center", gap: 10, color: "#d0d0e8", fontWeight: 500 },
  studentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 7,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 12,
    color: "#0a0a0f",
    flexShrink: 0,
  },
  empty: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "#3a3a5c",
    padding: "30px 0",
    textAlign: "center",
  },
};
