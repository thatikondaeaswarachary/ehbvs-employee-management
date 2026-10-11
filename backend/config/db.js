import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const dataDir = path.resolve('data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export let firestoreDb = null;

// Determine database mode: firestore (on Cloud Functions, Render with credentials, or explicit env), mongo, or json
function detectDbMode() {
  if (
    process.env.DB_MODE === 'firestore' ||
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    fs.existsSync(path.resolve('serviceAccountKey.json')) ||
    process.env.FUNCTION_TARGET ||
    process.env.K_SERVICE ||
    process.env.FIREBASE_CONFIG
  ) {
    return 'firestore';
  }
  if (process.env.MONGO_URI && process.env.MONGO_URI.trim().length > 0) {
    return 'mongo';
  }
  return 'json';
}

export let DB_MODE = detectDbMode();
export const jsonPath = (name) => path.join(dataDir, `${name}.json`);

export const COLLECTIONS = [
  'users',
  'attendance',
  'tasks',
  'workReports',
  'leaves',
  'announcements',
  'notifications',
  'auditLogs',
  'settings'
];

export async function connectDb() {
  DB_MODE = detectDbMode();

  if (DB_MODE === 'firestore') {
    try {
      if (!getApps().length) {
        let appOptions = {};
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          try {
            const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
            const serviceAccount = raw.startsWith('{')
              ? JSON.parse(raw)
              : JSON.parse(fs.readFileSync(path.resolve(raw), 'utf8'));
            appOptions = { credential: cert(serviceAccount) };
            console.log('🔑 Initialized Firebase Admin using FIREBASE_SERVICE_ACCOUNT credentials.');
          } catch (e) {
            console.warn('⚠️ Could not parse FIREBASE_SERVICE_ACCOUNT credential:', e.message);
          }
        } else if (fs.existsSync(path.resolve('serviceAccountKey.json'))) {
          try {
            const serviceAccount = JSON.parse(fs.readFileSync(path.resolve('serviceAccountKey.json'), 'utf8'));
            appOptions = { credential: cert(serviceAccount) };
            console.log('🔑 Initialized Firebase Admin using serviceAccountKey.json.');
          } catch (e) {
            console.warn('⚠️ Could not read serviceAccountKey.json:', e.message);
          }
        } else if (process.env.FIREBASE_CONFIG) {
          try {
            const parsed = JSON.parse(process.env.FIREBASE_CONFIG);
            if (parsed.projectId) appOptions = { projectId: parsed.projectId };
          } catch (e) {}
        }
        initializeApp(appOptions);
      }
      firestoreDb = getFirestore();
      console.log('🔥 Cloud Firestore connected successfully for 24/7 persistent database storage!');
      await seedFirestoreIfEmpty();
      return;
    } catch (err) {
      console.warn('⚠️ Cloud Firestore initialization notice (' + err.message + '). Falling back to persistent storage mode.');
      DB_MODE = process.env.MONGO_URI ? 'mongo' : 'json';
    }
  }

  if (DB_MODE === 'mongo') {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ MongoDB connected successfully to ' + (process.env.MONGO_URI.split('@')[1] || 'database'));
      return;
    } catch (err) {
      console.warn('⚠️ MongoDB connection failed (' + err.message + '). Switching seamlessly to persistent JSON database.');
      DB_MODE = 'json';
    }
  }

  console.log('ℹ️ Running in persistent JSON storage mode for zero-friction local execution.');

  // Ensure JSON database files exist for fast local persistence
  for (const col of COLLECTIONS) {
    const p = jsonPath(col);
    if (!fs.existsSync(p)) {
      fs.writeFileSync(p, '[]', 'utf8');
    }
  }
}

export async function seedFirestoreIfEmpty() {
  if (!firestoreDb) return;
  try {
    for (const col of COLLECTIONS) {
      const snap = await firestoreDb.collection(col).limit(1).get();
      if (snap.empty) {
        const localItems = readJson(col);
        if (localItems && localItems.length > 0) {
          console.log(`🌱 Cloud Firestore: auto-seeding ${localItems.length} records into collection '${col}'...`);
          // Batch in groups of 400 for safety against Firestore 500 limit
          for (let i = 0; i < localItems.length; i += 400) {
            const chunk = localItems.slice(i, i + 400);
            const batch = firestoreDb.batch();
            for (const item of chunk) {
              const docId = String(item._id || item.id || crypto.randomUUID());
              const docRef = firestoreDb.collection(col).doc(docId);
              batch.set(docRef, item);
            }
            await batch.commit();
          }
          console.log(`✅ Collection '${col}' successfully seeded into Cloud Firestore.`);
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Firestore auto-seed skipped:', err.message);
  }
}

export function readJson(name) {
  const p = jsonPath(name);
  try {
    const content = fs.readFileSync(p, 'utf8');
    return JSON.parse(content || '[]');
  } catch (e) {
    return [];
  }
}

export function writeJson(name, data) {
  const p = jsonPath(name);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

export function newId() {
  return crypto.randomUUID();
}

