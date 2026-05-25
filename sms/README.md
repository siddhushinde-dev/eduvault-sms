# EduVault — SaaS Student Management System

A modern, multi-tenant SaaS Student Management System built with React, Node.js, Express, and Firebase Firestore.

---

## ✨ Features

- 🔐 **Authentication** — Firebase Auth (Login / Register / Logout)
- 👥 **Role-Based** — Admin, Teacher, Student roles stored in Firestore
- 🏫 **Multi-Tenant SaaS** — Data isolated by `orgId` per institution
- 👨‍🎓 **Student Management** — Add, Edit, Delete, Search students
- 📊 **Grading System** — Subject-wise marks, auto grade (A/B/C/F), totals, averages
- 📄 **Report Card** — Per-student report with radar chart and subject table
- 📅 **Attendance** — Daily attendance, mark present/absent, percentage tracking
- 📈 **Dashboard Analytics** — Stats cards + Recharts bar charts
- 🎨 **Premium Dark UI** — Glassmorphism, Framer Motion animations, Syne + DM Sans fonts
- 🔍 **Search & Filter** — Search students by name/email/roll, filter by grade

---

## 🗂 Project Structure

```
eduvault/
├── client/                    # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.js     # Navigation sidebar
│   │   │   ├── Topbar.js      # Top header bar
│   │   │   └── PrivateRoute.js
│   │   ├── context/
│   │   │   └── AuthContext.js # Firebase Auth + user profile
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js   # Analytics + charts
│   │   │   ├── Students.js    # Full CRUD
│   │   │   ├── Grades.js      # Subject marks + grading
│   │   │   ├── Attendance.js  # Daily attendance tracker
│   │   │   └── Report.js      # Report cards
│   │   ├── firebase.js        # Firebase client config
│   │   ├── App.js
│   │   ├── index.js
│   │   └── styles.css
│   └── package.json
│
├── server/                    # Node.js backend
│   ├── server.js              # Express API (all routes)
│   ├── firebaseAdmin.js       # Firebase Admin SDK init
│   ├── serviceAccountKey.PLACEHOLDER.txt
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Step 1 — Firebase Setup (Required)

1. Go to [Firebase Console](https://console.firebase.google.com) and create a project
2. Enable **Authentication** → Email/Password provider
3. Enable **Firestore Database** (start in test mode for development)
4. Create Firestore indexes if prompted (Firebase will show a link)

### Step 2 — Frontend Firebase Config

Edit `client/src/firebase.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

Find these values at: Firebase Console → Project Settings → Your Apps → Web App

### Step 3 — Backend Service Account

1. Firebase Console → Project Settings → Service Accounts
2. Click **"Generate new private key"**
3. Save the downloaded file as `server/serviceAccountKey.json`

### Step 4 — Install & Run

#### Frontend (React)
```bash
cd client
npm install
npm start
# Runs on http://localhost:3000
```

#### Backend (Node.js)
```bash
cd server
npm install
node server.js
# Runs on http://localhost:5000
```

> **Note:** The frontend talks directly to Firebase Firestore via the client SDK. The Express backend is available as an alternative API layer (useful for server-side operations, webhooks, or if you want to move all DB calls server-side).

---

## 🔌 Backend API Reference

All endpoints require `orgId` to enforce multi-tenant data isolation.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register user profile in Firestore |
| GET | `/users/:uid` | Get user profile |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/students?orgId=xxx` | List all students (supports `?search=` and `?class=`) |
| POST | `/students` | Add a new student |
| PUT | `/students/:id` | Update student details |
| DELETE | `/students/:id` | Remove a student |

### Grades
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/grades?orgId=xxx` | List all grade records (supports `?studentId=`) |
| POST | `/grades` | Add subject marks for a student |
| PUT | `/grades/:id` | Update grade record |
| DELETE | `/grades/:id` | Delete grade record |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/attendance?orgId=xxx` | List records (supports `?date=` and `?studentId=`) |
| POST | `/attendance` | Bulk save attendance for a date |
| DELETE | `/attendance/:id` | Delete a single record |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics?orgId=xxx` | Dashboard summary stats for an org |

---

## 🗄 Firestore Data Structure

```
users/{uid}
  ├── uid
  ├── email
  ├── name
  ├── role         ("admin" | "teacher" | "student")
  ├── orgId        (e.g. "springfield-high")
  └── createdAt

students/{id}
  ├── name
  ├── email
  ├── phone
  ├── class
  ├── rollNo
  ├── address
  ├── orgId        ← multi-tenant key
  └── createdAt

grades/{id}
  ├── studentId
  ├── studentName
  ├── subjects     { Mathematics: 88, Science: 76, ... }
  ├── orgId
  └── createdAt

attendance/{id}
  ├── studentId
  ├── studentName
  ├── date         "YYYY-MM-DD"
  ├── status       "present" | "absent"
  ├── orgId
  └── createdAt
```

---

## 🛡 Firestore Security Rules (Recommended)

Add these in Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read/write their own profile
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Students, Grades, Attendance — only users of the same org
    match /students/{id} {
      allow read, write: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.orgId
           == resource.data.orgId;
    }

    match /grades/{id} {
      allow read, write: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.orgId
           == resource.data.orgId;
    }

    match /attendance/{id} {
      allow read, write: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.orgId
           == resource.data.orgId;
    }
  }
}
```

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Animations | Framer Motion |
| Charts | Recharts |
| HTTP | Axios |
| Auth + DB | Firebase Auth + Firestore |
| Backend | Node.js, Express |
| Admin SDK | Firebase Admin |
| Fonts | Syne (display), DM Sans (body) |

---

## 📦 Deploying

### Frontend → Vercel / Netlify
```bash
cd client
npm run build
# Upload the /build folder
```

### Backend → Railway / Render / Heroku
- Set environment variable `PORT`
- Add `serviceAccountKey.json` content as env var or use secret file mounting
- `node server.js` as the start command

---

## 🧑‍💻 Built for

- College final year projects
- Portfolio showcase
- SaaS product prototyping
- Learning Firebase + React architecture

---


