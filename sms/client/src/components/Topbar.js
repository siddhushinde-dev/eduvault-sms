import React from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

const pageTitles = {
  "/dashboard": { title: "Dashboard", sub: "Overview & Analytics" },
  "/students": { title: "Students", sub: "Manage student records" },
  "/grades": { title: "Grades", sub: "Subject-wise marks" },
  "/attendance": { title: "Attendance", sub: "Daily attendance tracker" },
  "/report": { title: "Reports", sub: "Report cards & summaries" },
};

export default function Topbar() {
  const { pathname } = useLocation();
  const page = pageTitles[pathname] || { title: "EduVault", sub: "" };
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "short", day: "numeric" });

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      style={styles.topbar}
    >
      <div>
        <h1 style={styles.title}>{page.title}</h1>
        <p style={styles.sub}>{page.sub}</p>
      </div>
      <div style={styles.right}>
        <div style={styles.dateBadge}>
          <span style={styles.dateIcon}>◷</span>
          <span style={styles.dateText}>{dateStr}</span>
        </div>
        <div style={styles.notifBtn}>
          <span>◉</span>
          <span style={styles.notifDot} />
        </div>
      </div>
    </motion.header>
  );
}

const styles = {
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 32px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(10,10,15,0.6)",
    backdropFilter: "blur(20px)",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 22,
    color: "#f0f0f8",
    letterSpacing: 0.2,
  },
  sub: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "#4a4a6a",
    marginTop: 2,
  },
  right: { display: "flex", alignItems: "center", gap: 12 },
  dateBadge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 14px",
    borderRadius: 8,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  dateIcon: { color: "#6ee7f7", fontSize: 14 },
  dateText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: "#6a6a8a",
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6a6a8a",
    position: "relative",
    cursor: "pointer",
  },
  notifDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#6ee7f7",
    boxShadow: "0 0 6px #6ee7f7",
  },
};
