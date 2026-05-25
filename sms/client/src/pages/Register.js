import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin", orgId: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.orgId.trim()) return setError("Organization ID is required.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await register(form.email, form.password, form.name, form.role, form.orgId.toLowerCase().replace(/\s+/g, "-"));
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.grid} />
      <div style={styles.glow1} />
      <div style={styles.glow2} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={styles.card}
      >
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>EV</div>
          <div>
            <div style={styles.logoName}>EduVault</div>
            <div style={styles.logoSub}>Create your organization</div>
          </div>
        </div>

        <h2 style={styles.heading}>Get started</h2>
        <p style={styles.subHeading}>Set up your institution on EduVault</p>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.error}>
            ⚠ {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {[
            { name: "name", label: "Full Name", placeholder: "Dr. Jane Smith", type: "text" },
            { name: "email", label: "Email Address", placeholder: "admin@school.edu", type: "email" },
            { name: "password", label: "Password", placeholder: "Min. 6 characters", type: "password" },
            { name: "orgId", label: "Organization ID", placeholder: "my-school-2024", type: "text" },
          ].map((f) => (
            <div key={f.name} style={styles.field}>
              <label style={styles.label}>{f.label}</label>
              <input
                style={styles.input}
                type={f.type}
                name={f.name}
                placeholder={f.placeholder}
                value={form[f.name]}
                onChange={handleChange}
                required
              />
            </div>
          ))}

          <div style={styles.field}>
            <label style={styles.label}>Role</label>
            <select style={styles.input} name="role" value={form.role} onChange={handleChange}>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            style={styles.btn}
          >
            {loading ? "Creating account..." : "Create Account →"}
          </motion.button>
        </form>

        <p style={styles.switch}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Sign in</Link>
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
    padding: "40px 20px",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage: `linear-gradient(rgba(167,139,250,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(167,139,250,0.03) 1px, transparent 1px)`,
    backgroundSize: "40px 40px",
  },
  glow1: {
    position: "absolute",
    top: -150,
    right: -150,
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)",
  },
  glow2: {
    position: "absolute",
    bottom: -150,
    left: -150,
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(110,231,247,0.06) 0%, transparent 70%)",
  },
  card: {
    width: 440,
    maxWidth: "100%",
    padding: 40,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    backdropFilter: "blur(20px)",
    position: "relative",
    zIndex: 1,
  },
  logoRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 28 },
  logoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: "linear-gradient(135deg, #a78bfa, #6ee7f7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 14,
    color: "#0a0a0f",
  },
  logoName: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: "#f0f0f8" },
  logoSub: { fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#4a4a6a" },
  heading: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 26, color: "#f0f0f8", marginBottom: 6 },
  subHeading: { fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#4a4a6a", marginBottom: 24 },
  error: {
    padding: "10px 14px",
    borderRadius: 8,
    background: "rgba(255,80,80,0.08)",
    border: "1px solid rgba(255,80,80,0.2)",
    color: "#f08080",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    marginBottom: 18,
  },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: "#6a6a8a", letterSpacing: 0.5, textTransform: "uppercase" },
  input: {
    padding: "11px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#f0f0f8",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    outline: "none",
  },
  btn: {
    marginTop: 6,
    padding: "13px 0",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #a78bfa, #6ee7f7)",
    color: "#0a0a0f",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    letterSpacing: 0.5,
  },
  switch: { marginTop: 22, textAlign: "center", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#4a4a6a" },
  link: { color: "#a78bfa", textDecoration: "none", fontWeight: 500 },
};
