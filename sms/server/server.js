// ============================================================
// EduVault Backend — Express + Firebase Admin + Firestore
// ============================================================

require("dotenv").config();
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const { db } = require("./firebaseAdmin");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());

// ── Health check ────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "EduVault API is running",
    version: "2.0.0",
    endpoints: ["/register", "/students", "/grades", "/attendance"],
  });
});

// ── Guard: ensure Firestore is available ────────────────────
function requireDb(req, res, next) {
  if (!db) {
    return res.status(503).json({
      error: "Firestore not initialised. Add serviceAccountKey.json to /server.",
    });
  }
  next();
}

// ============================================================
// AUTH / REGISTER
// POST /register
// Body: { uid, email, name, role, orgId }
// ============================================================
app.post("/register", requireDb, async (req, res) => {
  const { uid, email, name, role, orgId } = req.body;

  if (!uid || !email || !name || !role || !orgId) {
    return res.status(400).json({ error: "uid, email, name, role and orgId are all required." });
  }

  const allowed = ["admin", "teacher", "student"];
  if (!allowed.includes(role)) {
    return res.status(400).json({ error: `Role must be one of: ${allowed.join(", ")}` });
  }

  const userRef = db.collection("users").doc(uid);
  const existing = await userRef.get();

  if (existing.exists) {
    return res.status(409).json({ error: "User already registered." });
  }

  const profile = {
    uid,
    email,
    name,
    role,
    orgId: orgId.toLowerCase().replace(/\s+/g, "-"),
    createdAt: new Date().toISOString(),
  };

  await userRef.set(profile);
  res.status(201).json({ message: "User registered successfully.", user: profile });
});

// GET /users/:uid — fetch a single user profile
app.get("/users/:uid", requireDb, async (req, res) => {
  const snap = await db.collection("users").doc(req.params.uid).get();
  if (!snap.exists) return res.status(404).json({ error: "User not found." });
  res.json(snap.data());
});

// ============================================================
// STUDENTS
// GET    /students?orgId=xxx
// POST   /students
// PUT    /students/:id
// DELETE /students/:id
// ============================================================

app.get("/students", requireDb, async (req, res) => {
  const { orgId, search, class: cls } = req.query;
  if (!orgId) return res.status(400).json({ error: "orgId query param is required." });

  let ref = db.collection("students").where("orgId", "==", orgId);

  if (cls) ref = ref.where("class", "==", cls);

  const snap = await ref.orderBy("createdAt", "desc").get();
  let students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (search) {
    const q = search.toLowerCase();
    students = students.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.rollNo?.toLowerCase().includes(q)
    );
  }

  res.json({ total: students.length, students });
});

app.post("/students", requireDb, async (req, res) => {
  const { name, email, phone, class: cls, rollNo, address, orgId } = req.body;

  if (!name || !orgId) {
    return res.status(400).json({ error: "name and orgId are required." });
  }

  const student = {
    name,
    email: email || "",
    phone: phone || "",
    class: cls || "",
    rollNo: rollNo || "",
    address: address || "",
    orgId,
    createdAt: new Date().toISOString(),
  };

  const ref = await db.collection("students").add(student);
  res.status(201).json({ id: ref.id, ...student });
});

app.put("/students/:id", requireDb, async (req, res) => {
  const { name, email, phone, class: cls, rollNo, address } = req.body;
  const ref = db.collection("students").doc(req.params.id);
  const snap = await ref.get();

  if (!snap.exists) return res.status(404).json({ error: "Student not found." });

  const updates = {
    ...(name && { name }),
    ...(email !== undefined && { email }),
    ...(phone !== undefined && { phone }),
    ...(cls && { class: cls }),
    ...(rollNo !== undefined && { rollNo }),
    ...(address !== undefined && { address }),
    updatedAt: new Date().toISOString(),
  };

  await ref.update(updates);
  res.json({ id: req.params.id, ...snap.data(), ...updates });
});

app.delete("/students/:id", requireDb, async (req, res) => {
  const ref = db.collection("students").doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: "Student not found." });
  await ref.delete();
  res.json({ message: "Student deleted.", id: req.params.id });
});

// ============================================================
// GRADES
// GET    /grades?orgId=xxx[&studentId=xxx]
// POST   /grades
// PUT    /grades/:id
// DELETE /grades/:id
// ============================================================

function calcGrade(avg) {
  if (avg >= 80) return "A";
  if (avg >= 65) return "B";
  if (avg >= 50) return "C";
  return "F";
}

function enrichGrade(data) {
  const marks = Object.values(data.subjects || {}).map(Number).filter((v) => !isNaN(v));
  const total = marks.reduce((a, b) => a + b, 0);
  const average = marks.length ? parseFloat((total / marks.length).toFixed(2)) : 0;
  const grade = calcGrade(average);
  return { ...data, total, average, grade };
}

app.get("/grades", requireDb, async (req, res) => {
  const { orgId, studentId } = req.query;
  if (!orgId) return res.status(400).json({ error: "orgId is required." });

  let ref = db.collection("grades").where("orgId", "==", orgId);
  if (studentId) ref = ref.where("studentId", "==", studentId);

  const snap = await ref.orderBy("createdAt", "desc").get();
  const grades = snap.docs.map((d) => enrichGrade({ id: d.id, ...d.data() }));
  res.json({ total: grades.length, grades });
});

app.post("/grades", requireDb, async (req, res) => {
  const { studentId, studentName, subjects, orgId } = req.body;

  if (!studentId || !orgId || !subjects) {
    return res.status(400).json({ error: "studentId, orgId and subjects are required." });
  }

  // Validate marks are 0–100
  for (const [sub, val] of Object.entries(subjects)) {
    const n = Number(val);
    if (isNaN(n) || n < 0 || n > 100) {
      return res.status(400).json({ error: `Invalid mark for ${sub}: must be 0–100.` });
    }
  }

  const gradeData = {
    studentId,
    studentName: studentName || "",
    subjects,
    orgId,
    createdAt: new Date().toISOString(),
  };

  const ref = await db.collection("grades").add(gradeData);
  res.status(201).json(enrichGrade({ id: ref.id, ...gradeData }));
});

app.put("/grades/:id", requireDb, async (req, res) => {
  const { subjects, studentName } = req.body;
  const ref = db.collection("grades").doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: "Grade record not found." });

  const updates = {
    ...(subjects && { subjects }),
    ...(studentName && { studentName }),
    updatedAt: new Date().toISOString(),
  };

  await ref.update(updates);
  const updated = { ...snap.data(), ...updates };
  res.json(enrichGrade({ id: req.params.id, ...updated }));
});

app.delete("/grades/:id", requireDb, async (req, res) => {
  const ref = db.collection("grades").doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: "Grade not found." });
  await ref.delete();
  res.json({ message: "Grade deleted.", id: req.params.id });
});

// ============================================================
// ATTENDANCE
// GET    /attendance?orgId=xxx[&studentId=xxx][&date=YYYY-MM-DD]
// POST   /attendance  — bulk upsert for a date
// DELETE /attendance/:id
// ============================================================

app.get("/attendance", requireDb, async (req, res) => {
  const { orgId, studentId, date } = req.query;
  if (!orgId) return res.status(400).json({ error: "orgId is required." });

  let ref = db.collection("attendance").where("orgId", "==", orgId);
  if (studentId) ref = ref.where("studentId", "==", studentId);
  if (date) ref = ref.where("date", "==", date);

  const snap = await ref.orderBy("date", "desc").get();
  const records = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Compute per-student stats
  const statsMap = {};
  records.forEach((r) => {
    if (!statsMap[r.studentId]) statsMap[r.studentId] = { total: 0, present: 0 };
    statsMap[r.studentId].total++;
    if (r.status === "present") statsMap[r.studentId].present++;
  });
  const stats = Object.entries(statsMap).map(([sid, s]) => ({
    studentId: sid,
    total: s.total,
    present: s.present,
    absent: s.total - s.present,
    percentage: parseFloat(((s.present / s.total) * 100).toFixed(1)),
  }));

  res.json({ total: records.length, records, stats });
});

// Bulk save attendance for a single date
app.post("/attendance", requireDb, async (req, res) => {
  const { orgId, date, entries } = req.body;
  // entries: [{ studentId, studentName, status }]

  if (!orgId || !date || !Array.isArray(entries)) {
    return res.status(400).json({ error: "orgId, date and entries[] are required." });
  }

  if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return res.status(400).json({ error: "date must be YYYY-MM-DD format." });
  }

  const batch = db.batch();

  // Delete existing records for this date + org
  const existing = await db
    .collection("attendance")
    .where("orgId", "==", orgId)
    .where("date", "==", date)
    .get();

  existing.docs.forEach((d) => batch.delete(d.ref));

  // Add new records
  const saved = [];
  entries.forEach((entry) => {
    const { studentId, studentName, status } = entry;
    if (!studentId || !["present", "absent"].includes(status)) return;
    const ref = db.collection("attendance").doc();
    const record = {
      orgId,
      date,
      studentId,
      studentName: studentName || "",
      status,
      createdAt: new Date().toISOString(),
    };
    batch.set(ref, record);
    saved.push({ id: ref.id, ...record });
  });

  await batch.commit();
  res.status(201).json({ message: "Attendance saved.", date, total: saved.length, records: saved });
});

app.delete("/attendance/:id", requireDb, async (req, res) => {
  const ref = db.collection("attendance").doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: "Attendance record not found." });
  await ref.delete();
  res.json({ message: "Record deleted.", id: req.params.id });
});

// ============================================================
// ANALYTICS — GET /analytics?orgId=xxx
// Returns dashboard summary for an org
// ============================================================
app.get("/analytics", requireDb, async (req, res) => {
  const { orgId } = req.query;
  if (!orgId) return res.status(400).json({ error: "orgId is required." });

  const [sSnap, gSnap, aSnap] = await Promise.all([
    db.collection("students").where("orgId", "==", orgId).get(),
    db.collection("grades").where("orgId", "==", orgId).get(),
    db.collection("attendance").where("orgId", "==", orgId).get(),
  ]);

  const totalStudents = sSnap.size;

  // Average marks across all grades
  let allMarks = [];
  const subjectTotals = {};
  const subjectCounts = {};
  const gradeDist = { A: 0, B: 0, C: 0, F: 0 };

  gSnap.docs.forEach((d) => {
    const { subjects } = d.data();
    if (!subjects) return;
    const vals = Object.values(subjects).map(Number).filter((v) => !isNaN(v));
    allMarks = allMarks.concat(vals);
    Object.entries(subjects).forEach(([sub, val]) => {
      subjectTotals[sub] = (subjectTotals[sub] || 0) + Number(val);
      subjectCounts[sub] = (subjectCounts[sub] || 0) + 1;
    });
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    gradeDist[calcGrade(avg)]++;
  });

  const overallAvg = allMarks.length
    ? parseFloat((allMarks.reduce((a, b) => a + b, 0) / allMarks.length).toFixed(2))
    : 0;

  const subjectAverages = Object.keys(subjectTotals).map((sub) => ({
    subject: sub,
    average: parseFloat((subjectTotals[sub] / subjectCounts[sub]).toFixed(2)),
  }));

  // Attendance
  const totalAtt = aSnap.size;
  const presentAtt = aSnap.docs.filter((d) => d.data().status === "present").length;
  const attendancePct = totalAtt
    ? parseFloat(((presentAtt / totalAtt) * 100).toFixed(1))
    : 0;

  res.json({
    orgId,
    totalStudents,
    totalGradeRecords: gSnap.size,
    overallAverage: overallAvg,
    gradeDist,
    subjectAverages,
    attendance: { total: totalAtt, present: presentAtt, percentage: attendancePct },
  });
});

// ── Global error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: err.message || "Internal server error." });
});

// ── Start server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 EduVault API running on http://localhost:${PORT}`);
  console.log(`   Endpoints: GET / | POST /register | /students | /grades | /attendance | /analytics\n`);
});
