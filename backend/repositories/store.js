import mongoose from 'mongoose';
import { DB_MODE, firestoreDb, readJson, writeJson, newId } from '../config/db.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Task from '../models/Task.js';
import WorkReport from '../models/WorkReport.js';
import Leave from '../models/Leave.js';
import Announcement from '../models/Announcement.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import Setting from '../models/Setting.js';

const models = {
  users: { mongo: User, json: 'users' },
  attendance: { mongo: Attendance, json: 'attendance' },
  tasks: { mongo: Task, json: 'tasks' },
  workReports: { mongo: WorkReport, json: 'workReports' },
  leaves: { mongo: Leave, json: 'leaves' },
  announcements: { mongo: Announcement, json: 'announcements' },
  notifications: { mongo: Notification, json: 'notifications' },
  auditLogs: { mongo: AuditLog, json: 'auditLogs' },
  settings: { mongo: Setting, json: 'settings' }
};

const POPULATE_FIELDS = {
  attendance: ['employee', 'updatedBy'],
  tasks: ['assignedTo', 'createdBy'],
  workReports: ['employee'],
  leaves: ['employee', 'reviewedBy'],
  announcements: ['createdBy', 'employee'],
  notifications: ['user'],
  auditLogs: ['actor']
};

function safeUserView(u) {
  if (!u) return null;
  const copy = { ...(u._doc || u) };
  delete copy.password;
  return copy;
}

function populateJsonDoc(collection, item, usersMap) {
  if (!item) return item;
  const clone = { ...item };
  const popFields = POPULATE_FIELDS[collection] || [];

  for (const field of popFields) {
    const val = clone[field];
    if (val && typeof val === 'string' && usersMap[val]) {
      clone[field] = usersMap[val];
    } else if (val && typeof val === 'object' && val._id && usersMap[val._id]) {
      clone[field] = usersMap[val._id];
    }
  }
  return clone;
}

async function getUsersMapAsync() {
  if (DB_MODE === 'firestore' && firestoreDb) {
    try {
      const snap = await firestoreDb.collection('users').get();
      const map = {};
      for (const d of snap.docs) {
        const data = { _id: d.id, id: d.id, ...d.data() };
        const clean = safeUserView(data);
        map[d.id] = clean;
        if (data._id) map[data._id] = clean;
      }
      return map;
    } catch (e) {
      console.warn('⚠️ Firestore getUsersMap fallback:', e.message);
    }
  }

  const allUsers = readJson('users');
  const map = {};
  for (const u of allUsers) {
    const clean = safeUserView(u);
    map[u._id] = clean;
    if (u.id) map[u.id] = clean;
  }
  return map;
}

function filterRecords(arr, query) {
  return arr.filter(obj => {
    return Object.entries(query).every(([k, v]) => {
      if (v === undefined || v === null || v === '') return true;
      if (typeof v === 'function') return v(obj[k]);
      if (typeof v === 'object' && v.$ne !== undefined) return obj[k] !== v.$ne;
      if (typeof v === 'object' && v.$in !== undefined && Array.isArray(v.$in)) {
        return v.$in.includes(obj[k]);
      }
      if (typeof v === 'object' && (v.$gte !== undefined || v.$lte !== undefined)) {
        const val = obj[k];
        if (v.$gte !== undefined && val < v.$gte) return false;
        if (v.$lte !== undefined && val > v.$lte) return false;
        return true;
      }
      if (k === 'employee' || k === 'assignedTo' || k === 'user') {
        const raw = obj[k]?._id || obj[k]?.id || obj[k];
        const matchVal = v?._id || v?.id || v;
        return String(raw) === String(matchVal);
      }
      return String(obj[k]) === String(v);
    });
  });
}

function sortRecords(arr, sort) {
  const sortKeys = Object.keys(sort || {});
  if (sortKeys.length === 0) return arr;
  const key = sortKeys[0];
  const direction = sort[key] === -1 || sort[key] === 'desc' ? -1 : 1;
  return [...arr].sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (va === vb) return 0;
    if (va === undefined || va === null) return 1;
    if (vb === undefined || vb === null) return -1;
    return va < vb ? -1 * direction : 1 * direction;
  });
}

export async function list(name, query = {}, sort = { createdAt: -1 }) {
  const meta = models[name];
  if (!meta) throw new Error(`Unknown collection: ${name}`);

  if (DB_MODE === 'mongo' && mongoose.connection.readyState === 1) {
    let q = meta.mongo.find(query).sort(sort);
    if (POPULATE_FIELDS[name]) {
      for (const field of POPULATE_FIELDS[name]) {
        q = q.populate(field, '-password');
      }
    }
    return q.lean();
  }

  // Firestore mode
  if (DB_MODE === 'firestore' && firestoreDb) {
    const snap = await firestoreDb.collection(name).get();
    const arr = snap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() }));
    const filtered = filterRecords(arr, query);
    const sorted = sortRecords(filtered, sort);
    const usersMap = POPULATE_FIELDS[name] ? await getUsersMapAsync() : {};
    return sorted.map(item => populateJsonDoc(name, item, usersMap));
  }

  // JSON fallback
  let arr = readJson(meta.json);
  const usersMap = POPULATE_FIELDS[name] ? await getUsersMapAsync() : {};
  const filtered = filterRecords(arr, query);
  const sorted = sortRecords(filtered, sort);
  return sorted.map(item => populateJsonDoc(name, item, usersMap));
}

export async function findById(name, id) {
  if (!id) return null;
  const meta = models[name];
  if (!meta) throw new Error(`Unknown collection: ${name}`);

  if (DB_MODE === 'mongo' && mongoose.connection.readyState === 1) {
    let q = meta.mongo.findById(id);
    if (POPULATE_FIELDS[name]) {
      for (const field of POPULATE_FIELDS[name]) {
        q = q.populate(field, '-password');
      }
    }
    return q.lean();
  }

  if (DB_MODE === 'firestore' && firestoreDb) {
    const docSnap = await firestoreDb.collection(name).doc(String(id)).get();
    let found = null;
    if (docSnap.exists) {
      found = { _id: docSnap.id, id: docSnap.id, ...docSnap.data() };
    } else {
      const qSnap = await firestoreDb.collection(name).where('_id', '==', String(id)).limit(1).get();
      if (!qSnap.empty) {
        found = { _id: qSnap.docs[0].id, id: qSnap.docs[0].id, ...qSnap.docs[0].data() };
      }
    }
    if (!found) return null;
    const usersMap = POPULATE_FIELDS[name] ? await getUsersMapAsync() : {};
    return populateJsonDoc(name, found, usersMap);
  }

  const arr = readJson(meta.json);
  const found = arr.find(x => String(x._id) === String(id) || String(x.id) === String(id));
  if (!found) return null;

  const usersMap = POPULATE_FIELDS[name] ? await getUsersMapAsync() : {};
  return populateJsonDoc(name, found, usersMap);
}

export async function findOne(name, query = {}) {
  const meta = models[name];
  if (!meta) throw new Error(`Unknown collection: ${name}`);

  if (DB_MODE === 'mongo' && mongoose.connection.readyState === 1) {
    let q = meta.mongo.findOne(query);
    if (POPULATE_FIELDS[name]) {
      for (const field of POPULATE_FIELDS[name]) {
        q = q.populate(field, '-password');
      }
    }
    return q.lean();
  }

  const listItems = await list(name, query);
  return listItems.length > 0 ? listItems[0] : null;
}

export async function create(name, data) {
  const meta = models[name];
  if (!meta) throw new Error(`Unknown collection: ${name}`);

  if (DB_MODE === 'mongo' && mongoose.connection.readyState === 1) {
    const created = await meta.mongo.create(data);
    return created.toObject ? created.toObject() : created;
  }

  const id = data._id || newId();
  const now = new Date().toISOString();
  const obj = {
    _id: id,
    id: id,
    createdAt: now,
    updatedAt: now,
    ...data
  };

  if (DB_MODE === 'firestore' && firestoreDb) {
    await firestoreDb.collection(name).doc(String(id)).set(obj);
    return obj;
  }

  const arr = readJson(meta.json);
  arr.push(obj);
  writeJson(meta.json, arr);
  return obj;
}

export async function update(name, id, data) {
  if (!id) return null;
  const meta = models[name];
  if (!meta) throw new Error(`Unknown collection: ${name}`);

  if (DB_MODE === 'mongo' && mongoose.connection.readyState === 1) {
    return meta.mongo.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  const now = new Date().toISOString();

  if (DB_MODE === 'firestore' && firestoreDb) {
    const updatePayload = { ...data, updatedAt: now };
    await firestoreDb.collection(name).doc(String(id)).set(updatePayload, { merge: true });
    return findById(name, id);
  }

  const arr = readJson(meta.json);
  const i = arr.findIndex(x => String(x._id) === String(id) || String(x.id) === String(id));
  if (i < 0) return null;

  arr[i] = {
    ...arr[i],
    ...data,
    updatedAt: now
  };
  writeJson(meta.json, arr);

  const usersMap = POPULATE_FIELDS[name] ? await getUsersMapAsync() : {};
  return populateJsonDoc(name, arr[i], usersMap);
}

export async function remove(name, id) {
  if (!id) return false;
  const meta = models[name];
  if (!meta) throw new Error(`Unknown collection: ${name}`);

  if (DB_MODE === 'mongo' && mongoose.connection.readyState === 1) {
    await meta.mongo.findByIdAndDelete(id);
    return true;
  }

  if (DB_MODE === 'firestore' && firestoreDb) {
    await firestoreDb.collection(name).doc(String(id)).delete();
    return true;
  }

  const arr = readJson(meta.json).filter(x => String(x._id) !== String(id) && String(x.id) !== String(id));
  writeJson(meta.json, arr);
  return true;
}

export async function count(name, query = {}) {
  const meta = models[name];
  if (!meta) throw new Error(`Unknown collection: ${name}`);

  if (DB_MODE === 'mongo' && mongoose.connection.readyState === 1) {
    return meta.mongo.countDocuments(query);
  }

  const items = await list(name, query);
  return items.length;
}

export { models };

