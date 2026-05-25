import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div style={styles.page}>
      {/* Background grid */}
      <div style={styles.grid} />
      <div style={styles.glow1} />
      <div style={styles.glow2} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={styles.card}
      >
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>EV</div>
          <div>
            <div style={styles.logoName}>EduVault</div>
            <div style={styles.logoSub}>Student Management System</div>
          </div>
        </div>

        <h2 style={styles.heading}>Welcome back</h2>
        <p style={styles.subHeading}>Sign in to your organization account</p>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            style={styles.error}
          >
            ⚠ {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              style={styles.input}
              type="email"
              placeholder="admin@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            style={styles.btn}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </motion.button>
        </form>

        <p style={styles.switch}>
          New organization?{" "}
          <Link to="/register" style={styles.link}>Create account</Link>
        </p>
      </motion.div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage: `linear-gradient(rgba(110,231,247,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(110,231,247,0.03) 1px, transparent 1px)`,
    backgroundSize: "40px 40px",
  },
  glow1: {
    position: "absolute",
    top: -200,
    left: -200,
    width: 600,
    height: 600,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(110,231,247,0.06) 0%, transparent 70%)",
  },
  glow2: {
    position: "absolute",
    bottom: -200,
    right: -200,
    width: 600,
    height: 600,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)",
  },
  card: {
    width: 420,
    padding: 40,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    backdropFilter: "blur(20px)",
    position: "relative",
    zIndex: 1,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  logoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "linear-gradient(135deg, #6ee7f7, #a78bfa)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 14,
    color: "#0a0a0f",
  },
  logoName: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 18,
    color: "#f0f0f8",
  },
  logoSub: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: "#4a4a6a",
  },
  heading: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 26,
    color: "#f0f0f8",
    marginBottom: 6,
  },
  subHeading: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "#4a4a6a",
    marginBottom: 28,
  },
  error: {
    padding: "10px 14px",
    borderRadius: 8,
    background: "rgba(255,80,80,0.08)",
    border: "1px solid rgba(255,80,80,0.2)",
    color: "#f08080",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    marginBottom: 20,
  },
  form: { display: "flex", flexDirection: "column", gap: 18 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 500,
    color: "#6a6a8a",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  input: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#f0f0f8",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
  },
  btn: {
    marginTop: 8,
    padding: "13px 0",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #6ee7f7, #a78bfa)",
    color: "#0a0a0f",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    letterSpacing: 0.5,
  },
  switch: {
    marginTop: 24,
    textAlign: "center",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "#4a4a6a",
  },
  link: {
    color: "#6ee7f7",
    textDecoration: "none",
    fontWeight: 500,
  },
};
