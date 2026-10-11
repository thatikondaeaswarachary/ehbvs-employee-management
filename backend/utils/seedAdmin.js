import bcrypt from 'bcryptjs';
import { findOne, create, update } from '../repositories/store.js';
import { connectDb } from '../config/db.js';

export async function bootstrapAdmin() {
  const defaultAdmins = [
    {
      email: (process.env.ADMIN_EMAIL || 'thatikondaeaswarachary@gmail.com').toLowerCase(),
      password: process.env.ADMIN_PASSWORD || 'Teaswara@001001',
      name: process.env.ADMIN_NAME || 'Eswara Chary Thatikonda',
      employeeId: 'EHB-ADM-01',
      department: 'Administration',
      designation: 'Head of Operations'
    },
    {
      email: 'hemanthadapa1921@gmail.com',
      password: 'Hemu@9011',
      name: 'Hemanth Adapa',
      employeeId: 'EHB-ADM-02',
      department: 'Administration',
      designation: 'Operations Administrator'
    }
  ];

  for (const admin of defaultAdmins) {
    const existing = await findOne('users', { email: admin.email });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(admin.password, 10);
      await create('users', {
        name: admin.name,
        email: admin.email,
        phone: '+91 98765 43211',
        employeeId: admin.employeeId,
        password: hashedPassword,
        role: 'ADMIN',
        department: admin.department,
        designation: admin.designation,
        joiningDate: '2025-01-01',
        isActive: true,
        workStatus: 'Working',
        lastSeen: new Date().toISOString()
      });
      console.log(`✅ Administrator seeded: ${admin.email}`);
    } else {
      const matches = await bcrypt.compare(admin.password, existing.password);
      if (!matches || existing.role !== 'ADMIN') {
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        await update('users', existing._id, {
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true
        });
        console.log(`🔄 Administrator credentials synchronized: ${admin.email}`);
      }
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
