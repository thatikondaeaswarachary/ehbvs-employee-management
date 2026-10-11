import 'dotenv/config';
import { connectDb, readJson, writeJson } from './config/db.js';
import { bootstrapAdmin } from './utils/seedAdmin.js';
import { list, findOne, create } from './repositories/store.js';

async function test() {
  console.log('Testing DB connection & store...');
  await connectDb();
  await bootstrapAdmin();
  const admin = await findOne('users', { role: 'ADMIN' });
  console.log('Admin found:', admin?.email, 'Role:', admin?.role);
  const users = await list('users');
  console.log('Total users count:', users.length);
  console.log('ALL BACKEND MODULES LOADED SUCCESSFULLY!');
}

test().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
