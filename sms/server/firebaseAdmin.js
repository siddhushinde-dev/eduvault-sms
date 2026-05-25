// ============================================================
// FIREBASE ADMIN SDK CONFIGURATION
// 
// SETUP INSTRUCTIONS:
// 1. Go to Firebase Console → Project Settings → Service Accounts
// 2. Click "Generate new private key"
// 3. Save the downloaded JSON file as "serviceAccountKey.json"
//    in this same /server directory
// 4. The .gitignore already excludes this file for security
// ============================================================

const admin = require("firebase-admin");
const path = require("path");

let serviceAccount;

try {
  serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));
} catch (err) {
  console.warn(
    "\n⚠️  WARNING: serviceAccountKey.json not found.\n" +
    "   Download it from Firebase Console → Project Settings → Service Accounts\n" +
    "   and place it in the /server directory.\n"
  );
  // Allow server to start without crashing so developer sees the warning
  serviceAccount = null;
}

if (serviceAccount && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.apps.length ? admin.firestore() : null;

module.exports = { admin, db };
