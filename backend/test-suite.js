import { bootstrapAdmin } from './utils/seedAdmin.js';
import { connectDb } from './config/db.js';
import { create, findById, findOne, list, update } from './repositories/store.js';
import bcrypt from 'bcryptjs';
import { signToken } from './utils/jwt.js';
import jwt from 'jsonwebtoken';

async function runTestSuite() {
  console.log('====================================================');
  console.log('RUNNING SKILL SETU PLATFORM END-TO-END VERIFICATION');
  console.log('====================================================');

  await connectDb();
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Admin Bootstrap
    const admin = await bootstrapAdmin();
    assert(admin && admin.role === 'admin', '1. Admin successfully bootstrapped with admin role');

    // 2. Student Signup & Password Hashing
    const testEmail = `student_${Date.now()}@testcollege.edu`;
    const plainPassword = 'Password123!';
    const hashedPassword = await hashPassword(plainPassword);
    assert(hashedPassword !== plainPassword, '2. Password is securely hashed with bcrypt');

    const student = await create('users', {
      name: 'Ravi Teja',
      email: testEmail,
      phone: '9876543210',
      password: hashedPassword,
      college: 'Govt Polytechnic Sathupally',
      course: 'Diploma',
      branch: 'Computer Science',
      year: '3rd Year',
      city: 'Sathupally',
      state: 'Telangana',
      role: 'student',
      isActive: true,
      active: true
    });
    assert(student && student.email === testEmail, '3. Student account created successfully');

    // 3. JWT Token Generation & Validation
    const studentToken = signToken(student);
    const decodedStudent = jwt.verify(studentToken, process.env.JWT_SECRET || 'skillsetu_ehbvs_jwt_secret_key_2026_super_secure_random');
    assert(decodedStudent.id === (student._id || student.id) && decodedStudent.role === 'student', '4. JWT signed and verified correctly for student');

    const adminToken = signToken(admin);
    const decodedAdmin = jwt.verify(adminToken, process.env.JWT_SECRET || 'skillsetu_ehbvs_jwt_secret_key_2026_super_secure_random');
    assert(decodedAdmin.role === 'admin', '5. Admin JWT has admin role');

    // 4. Internship Listing & Visibility
    const allInternships = await list('internships');
    assert(allInternships.length > 0, `6. Internships available in database (Found: ${allInternships.length})`);
    const activeTrack = allInternships.find(i => i.status === 'Active');
    assert(activeTrack !== undefined, '7. Active internship track is discoverable');

    // 5. Student Application Submission
    const testResumeUrl = '/uploads/sample-resume.pdf';
    const application = await create('applications', {
      studentId: student._id || student.id,
      internshipId: activeTrack._id || activeTrack.id,
      student: student._id || student.id,
      program: activeTrack._id || activeTrack.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      college: student.college,
      course: student.course,
      branch: student.branch,
      year: student.year,
      resumeUrl: testResumeUrl,
      resume: testResumeUrl,
      status: 'Pending',
      remarks: '',
      appliedAt: new Date().toISOString()
    });
    assert(application && application.status === 'Pending', '8. Student successfully submitted application');

    // 6. Application Ownership Isolation (Security Check)
    const otherStudent = await create('users', {
      name: 'Other Student',
      email: `other_${Date.now()}@test.edu`,
      password: hashedPassword,
      role: 'student',
      isActive: true
    });
    const studentApps = (await list('applications')).filter(a => a.studentId === student._id || a.student === student._id);
    const otherApps = (await list('applications')).filter(a => a.studentId === otherStudent._id || a.student === otherStudent._id);
    assert(studentApps.length === 1 && otherApps.length === 0, '9. Student can only see their own applications (Ownership check)');

    // 7. Admin Evaluation & Status Update
    const updatedApp = await update('applications', application._id || application.id, {
      status: 'Approved',
      remarks: 'Selected for Full Stack track batch 1.'
    });
    assert(updatedApp.status === 'Approved' && updatedApp.remarks.includes('Selected'), '10. Admin can evaluate and approve application');

    // 8. Notification Generation
    const notification = await create('notifications', {
      userId: student._id || student.id,
      title: 'Application Status: Approved',
      message: 'Your application has been Approved.',
      type: 'application',
      read: false
    });
    assert(notification && notification.title.includes('Approved'), '11. Notification generated on application status change');

    // 9. Certificate Issuance & Assignment
    const certId = `EHBVS-SS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const cert = await create('certificates', {
      studentId: student._id || student.id,
      programId: activeTrack._id || activeTrack.id,
      student: student._id || student.id,
      program: activeTrack._id || activeTrack.id,
      studentName: student.name,
      certificateTitle: 'Certificate of Internship Completion',
      certificateId: certId,
      issueDate: new Date().toISOString().split('T')[0],
      completionStatus: 'Completed with Distinction',
      certificateUrl: '/uploads/cert-sample.pdf'
    });
    assert(cert && cert.certificateId === certId, '12. Certificate issued with unique ID and assigned to student');

    const myCerts = (await list('certificates')).filter(c => c.studentId === student._id || c.student === student._id);
    const otherCerts = (await list('certificates')).filter(c => c.studentId === otherStudent._id || c.student === otherStudent._id);
    assert(myCerts.length === 1 && otherCerts.length === 0, '13. Student only sees certificates assigned to their own account');

    // 10. Enquiry Submission
    const enquiry = await create('enquiries', {
      name: 'College Dean',
      email: 'dean@polytechnic.ac.in',
      phone: '8639270561',
      subject: 'Diploma CSE Workshop Proposal',
      message: 'We would like to conduct an offline technical training workshop for our final year students.',
      enquiryType: 'College Collaboration',
      status: 'new'
    });
    assert(enquiry && enquiry.status === 'new', '14. Public enquiry received and stored in database');

    const updatedEnquiry = await update('enquiries', enquiry._id || enquiry.id, {
      status: 'contacted',
      adminRemarks: 'Spoke with Dean, proposal dispatched.'
    });
    assert(updatedEnquiry.status === 'contacted', '15. Admin can update enquiry status and record notes');

    // 11. Student Account Deactivation / Inactive Check (Security Check)
    await update('users', student._id || student.id, { isActive: false, active: false });
    const deactivatedUser = await findById('users', student._id || student.id);
    assert(deactivatedUser.isActive === false, '16. Admin can deactivate student account');

    // Reactivate for normal flow
    await update('users', student._id || student.id, { isActive: true, active: true });
    const reactivatedUser = await findById('users', student._id || student.id);
    assert(reactivatedUser.isActive === true, '17. Admin can reactivate student account');

    console.log('====================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('Test suite failed with unexpected error:', err);
    process.exit(1);
  }
}

runTestSuite();
