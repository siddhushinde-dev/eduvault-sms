import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "⬡" },
  { to: "/students", label: "Students", icon: "◈" },
  { to: "/grades", label: "Grades", icon: "◆" },
  { to: "/attendance", label: "Attendance", icon: "◉" },
  { to: "/report", label: "Reports", icon: "◧" },
];

export default function Sidebar() {
  const { logout, userProfile } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={styles.sidebar}
    >
      {/* Brand */}
      <div style={styles.brand}>
        <div style={styles.brandIcon}>EV</div>
        <div>
          <div style={styles.brandName}>EduVault</div>
          <div style={styles.brandSub}>v2.0 SaaS</div>
        </div>
      </div>

      {/* Org Badge */}
      {userProfile && (
        <div style={styles.orgBadge}>
          <span style={styles.orgDot} />
          <span style={styles.orgText}>{userProfile.orgId}</span>
          <span style={styles.rolePill}>{userProfile.role}</span>
        </div>
      )}

      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.navLabel}>NAVIGATION</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    style={styles.activeBar}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span style={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={styles.bottom}>
        {userProfile && (
          <div style={styles.userCard}>
            <div style={styles.avatar}>
              {(userProfile.name || "U")[0].toUpperCase()}
            </div>
            <div style={styles.userInfo}>
              <div style={styles.userName}>{userProfile.name || "User"}</div>
              <div style={styles.userEmail}>{userProfile.email}</div>
            </div>
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          style={styles.logoutBtn}
        >
          ⏻ Logout
        </motion.button>
      </div>
    </motion.aside>
  );
}

const styles = {
  sidebar: {
    width: 240,
    minHeight: "100vh",
    background: "rgba(255,255,255,0.03)",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 0",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    backdropFilter: "blur(20px)",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 20px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: "linear-gradient(135deg, #6ee7f7, #a78bfa)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 13,
    color: "#0a0a0f",
    letterSpacing: 1,
  },
  brandName: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 16,
    color: "#f0f0f8",
    letterSpacing: 0.5,
  },
  brandSub: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 10,
    color: "#6ee7f7",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  orgBadge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "16px 20px",
    padding: "8px 12px",
    background: "rgba(110,231,247,0.06)",
    borderRadius: 8,
    border: "1px solid rgba(110,231,247,0.15)",
  },
  orgDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#6ee7f7",
    boxShadow: "0 0 6px #6ee7f7",
  },
  orgText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: "#a0a0b8",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  rolePill: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 9,
    fontWeight: 700,
    color: "#6ee7f7",
    background: "rgba(110,231,247,0.1)",
    border: "1px solid rgba(110,231,247,0.2)",
    borderRadius: 4,
    padding: "2px 6px",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  nav: { flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2 },
  navLabel: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 9,
    fontWeight: 700,
    color: "#3a3a5c",
    letterSpacing: 2,
    padding: "8px 8px 12px",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "11px 14px",
    borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 400,
    color: "#5a5a7a",
    textDecoration: "none",
    position: "relative",
    transition: "color 0.2s, background 0.2s",
  },
  navItemActive: {
    color: "#f0f0f8",
    background: "rgba(255,255,255,0.06)",
    fontWeight: 500,
  },
  activeBar: {
    position: "absolute",
    left: 0,
    top: "20%",
    bottom: "20%",
    width: 3,
    borderRadius: 2,
    background: "linear-gradient(180deg, #6ee7f7, #a78bfa)",
  },
  navIcon: { fontSize: 16, width: 20, textAlign: "center" },
  bottom: { padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" },
  userCard: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "linear-gradient(135deg, #a78bfa, #6ee7f7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    color: "#0a0a0f",
  },
  userInfo: { flex: 1, overflow: "hidden" },
  userName: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: "#d0d0e8",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  userEmail: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 10,
    color: "#4a4a6a",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    width: "100%",
    padding: "9px 0",
    borderRadius: 8,
    border: "1px solid rgba(255,80,80,0.2)",
    background: "rgba(255,80,80,0.05)",
    color: "#f08080",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
    letterSpacing: 0.3,
  },
};
