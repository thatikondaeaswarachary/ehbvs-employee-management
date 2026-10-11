import bcrypt from 'bcryptjs';
import { findOne, create, update } from '../repositories/store.js';
import { connectDb } from '../config/db.js';

export async function bootstrapAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'thatikondaeaswarachary@gmail.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Teaswara@001001';
  const adminName = process.env.ADMIN_NAME || 'Eswara Chary Thatikonda';

  const existing = await findOne('users', { email: adminEmail });
  if (!existing) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await create('users', {
      name: adminName,
      email: adminEmail,
      phone: '+91 98765 43210',
      employeeId: 'EHB-ADM-01',
      password: hashedPassword,
      role: 'ADMIN',
      department: 'Administration',
      designation: 'Head of Operations',
      joiningDate: '2025-01-01',
      isActive: true,
      workStatus: 'Working',
      lastSeen: new Date().toISOString()
    });
    console.log(`✅ Default Administrator seeded: ${adminEmail} / ${adminPassword}`);
  } else {
    const matches = await bcrypt.compare(adminPassword, existing.password);
    if (!matches) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await update('users', existing._id, { password: hashedPassword });
      console.log(`🔄 Default Administrator password synchronized with environment config: ${adminEmail}`);
    }
  }
}

if (process.argv[1]?.endsWith('seedAdmin.js')) {
  connectDb().then(bootstrapAdmin).then(() => {
    console.log('Admin bootstrap complete.');
    process.exit(0);
  }).catch((err) => {
    console.error('Seed admin error:', err);
    process.exit(1);
  });
}
