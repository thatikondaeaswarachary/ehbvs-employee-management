import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const dataDir = path.resolve('data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export let firestoreDb = null;

// Determine database mode: firestore (on Cloud Functions / explicit env), mongo, or json
function detectDbMode() {
  if (process.env.DB_MODE === 'firestore' || process.env.FUNCTION_TARGET || process.env.K_SERVICE || process.env.FIREBASE_CONFIG) {
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
        initializeApp();
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
    const usersSnap = await firestoreDb.collection('users').limit(1).get();
    if (usersSnap.empty) {
      console.log('🌱 Cloud Firestore empty: auto-seeding users from persistent storage...');
      const localUsers = readJson('users');
      for (const u of localUsers) {
        await firestoreDb.collection('users').doc(String(u._id || u.id)).set(u);
      }
      console.log(`✅ Seeded ${localUsers.length} users into Cloud Firestore.`);
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

