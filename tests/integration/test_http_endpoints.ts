import path from 'path';
import dotenv from 'dotenv';
process.env.NODE_ENV = 'test';
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

import http from 'http';
import { pool } from '../../backend/src/database/db';

async function runHttpTests() {
  const { default: app } = await import('../../backend/src/index');
  console.log('================================================================');
  console.log('STARTING HTTP ENDPOINT AUTH & ROLE PERMISSION TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail: string) {
    if (condition) {
      console.log(`[PASS] ${testName}: ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}: ${detail}`);
      failed++;
    }
  }

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Invalid Login Attempt
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'WrongPassword123!' }),
    });
    assert(badLoginRes.status === 401, 'HTTP 1 - Invalid Login Rejection', `Status ${badLoginRes.status} on bad credentials`);

    // 2. Successful Admin Login
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'AdminScholarship2026!' }),
    });
    const adminData = await adminLoginRes.json();
    assert(
      adminLoginRes.status === 200 && Boolean(adminData.token) && adminData.user.role === 'ADMIN',
      'HTTP 2 - Admin Login Success',
      `Status 200, JWT token acquired, role=${adminData.user?.role}`
    );
    const adminToken = adminData.token;

    // 3. Successful Auditor Login
    const auditorLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'auditor', password: 'ScholarAudit2026!' }),
    });
    const auditorData = await auditorLoginRes.json();
    assert(
      auditorLoginRes.status === 200 && Boolean(auditorData.token) && auditorData.user.role === 'AUDITOR',
      'HTTP 3 - Auditor Login Success',
      `Status 200, JWT token acquired, role=${auditorData.user?.role}`
    );
    const auditorToken = auditorData.token;

    // 4. Protected Route Without Token (401)
    const unauthRes = await fetch(`${baseUrl}/api/students`);
    assert(unauthRes.status === 401, 'HTTP 4 - Unauthenticated Access Blocked', `GET /api/students returned HTTP ${unauthRes.status}`);

    // 5. Protected Route With Token (200)
    const authRes = await fetch(`${baseUrl}/api/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(authRes.status === 200, 'HTTP 5 - Authenticated Read Success', `GET /api/students returned HTTP ${authRes.status}`);

    // 6. Role Authorization: AUDITOR attempting student creation (403 Forbidden)
    const testStudentId = `STU${Date.now().toString().slice(-7)}`;
    const forbiddenRes = await fetch(`${baseUrl}/api/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auditorToken}`,
      },
      body: JSON.stringify({
        student_id: testStudentId,
        name: 'Unauthorized Test Student',
        email: `${testStudentId.toLowerCase()}@test.edu`,
        department: 'CSE',
        course: 'B.Tech',
        academic_year: 3,
        cgpa: 8.5,
        attendance: 85,
        annual_family_income: 180000,
        active_arrears: 0,
      }),
    });
    assert(
      forbiddenRes.status === 403,
      'HTTP 6 - Role-Based Access Control Blocked',
      `POST /api/students by AUDITOR returned HTTP ${forbiddenRes.status} Forbidden`
    );

    // 7. Role Authorization: ADMIN student creation (201 Created)
    const createRes = await fetch(`${baseUrl}/api/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        student_id: testStudentId,
        name: 'Authorized Test Student',
        email: `${testStudentId.toLowerCase()}@test.edu`,
        department: 'CSE',
        course: 'B.Tech',
        academic_year: 3,
        cgpa: 8.5,
        attendance: 85,
        annual_family_income: 180000,
        active_arrears: 0,
      }),
    });
    assert(
      createRes.status === 201,
      'HTTP 7 - Admin Student Creation Allowed',
      `POST /api/students by ADMIN returned HTTP ${createRes.status} Created`
    );

    // 8. Unique Constraint Conflict Handling (409 Conflict)
    const dupCreateRes = await fetch(`${baseUrl}/api/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        student_id: testStudentId,
        name: 'Duplicate Student Attempt',
        email: `${testStudentId.toLowerCase()}@test.edu`,
        department: 'CSE',
        course: 'B.Tech',
        academic_year: 3,
        cgpa: 8.5,
        attendance: 85,
        annual_family_income: 180000,
        active_arrears: 0,
      }),
    });
    assert(
      dupCreateRes.status === 409,
      'HTTP 8 - Unique Constraint 409 Conflict',
      `Duplicate student ID submission returned HTTP ${dupCreateRes.status} Conflict`
    );

    // Cleanup student
    await pool.query('DELETE FROM students WHERE student_id = $1', [testStudentId]);

    // 9. Auditor attempting batch execution (403 Forbidden)
    const auditorBatchRes = await fetch(`${baseUrl}/api/batch/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auditorToken}`,
      },
      body: JSON.stringify({}),
    });
    assert(
      auditorBatchRes.status === 403,
      'HTTP 9 - Batch Execution Restricted to ADMIN/OPERATOR',
      `POST /api/batch/execute by AUDITOR returned HTTP ${auditorBatchRes.status} Forbidden`
    );

    // 10. Healthcheck is Public
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = await healthRes.json();
    assert(
      healthRes.status === 200 && healthJson.status === 'ONLINE',
      'HTTP 10 - Public Health Check Available',
      `GET /api/health returned HTTP 200 with status='${healthJson.status}'`
    );

    console.log('\n================================================================');
    console.log(`HTTP TESTS FINISHED: ${passed} / 10 TESTS PASSED (${failed} FAILED)`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal HTTP Test Suite Error:', err);
    process.exit(1);
  } finally {
    server.close();
    await pool.end();
  }
}

runHttpTests();
