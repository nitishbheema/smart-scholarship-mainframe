import bcrypt from 'bcryptjs';
import { pool } from './db';
import { runMigrations } from './migrate';

export async function seedDatabase() {
  await runMigrations();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Seed Users
    const passwordHash = await bcrypt.hash('admin123', 10);
    const auditorHash = await bcrypt.hash('auditor123', 10);
    const clerkHash = await bcrypt.hash('clerk123', 10);

    await client.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES 
        ('admin', 'admin@scholarship.edu', $1, 'ADMIN'),
        ('auditor', 'auditor@scholarship.edu', $2, 'AUDITOR'),
        ('clerk', 'clerk@scholarship.edu', $3, 'CLERK')
      ON CONFLICT (username) DO NOTHING;
    `, [passwordHash, auditorHash, clerkHash]);

    // 2. Seed Scholarship Schemes
    await client.query(`
      INSERT INTO scholarship_schemes (
        scheme_code, scheme_name, description,
        min_cgpa, min_attendance, max_family_income, max_arrears,
        slab_1_min_cgpa, slab_1_max_cgpa, slab_1_amount,
        slab_2_min_cgpa, slab_2_max_cgpa, slab_2_amount,
        slab_3_min_cgpa, slab_3_max_cgpa, slab_3_amount,
        deadline, is_active
      ) VALUES 
      (
        'MERIT1',
        'State Post-Matric Merit Scholarship',
        'State government flagship merit scholarship with tiered disbursement slabs based on CGPA performance.',
        7.50, 75.00, 250000.00, 0,
        9.00, 10.00, 20000.00,
        8.00, 8.99, 15000.00,
        7.50, 7.99, 10000.00,
        '2026-12-31', true
      ),
      (
        'TECH02',
        'Technical Excellence Endowment',
        'Targeted endowment for Computer Science, Electrical and Mechanical engineering scholars with high merit.',
        7.50, 75.00, 250000.00, 0,
        9.00, 10.00, 20000.00,
        8.00, 8.99, 15000.00,
        7.50, 7.99, 10000.00,
        '2026-12-31', true
      )
      ON CONFLICT (scheme_code) DO NOTHING;
    `);

    // 3. Seed Students
    const studentsData = [
      ['STU2024001', 'Aarav Sharma', 'aarav.sharma@scholarship.edu', 'CSE', 'B.Tech Computer Science', 3, 9.45, 88.50, 180000.00, 0, 'ACTIVE'],
      ['STU2024002', 'Diya Patel', 'diya.patel@scholarship.edu', 'ECE', 'B.Tech Electronics', 2, 8.60, 82.00, 210000.00, 0, 'ACTIVE'],
      ['STU2024003', 'Rohan Verma', 'rohan.verma@scholarship.edu', 'MECH', 'B.Tech Mechanical', 4, 7.75, 79.00, 195000.00, 0, 'ACTIVE'],
      ['STU2024004', 'Ananya Iyer', 'ananya.iyer@scholarship.edu', 'IT', 'B.Tech Information Tech', 1, 6.80, 85.00, 150000.00, 0, 'ACTIVE'],
      ['STU2024005', 'Vikram Singh', 'vikram.singh@scholarship.edu', 'CIVIL', 'B.Tech Civil Eng', 3, 8.40, 68.50, 175000.00, 0, 'ACTIVE'],
      ['STU2024006', 'Priya Nair', 'priya.nair@scholarship.edu', 'CSE', 'B.Tech Computer Science', 2, 8.90, 91.00, 360000.00, 0, 'ACTIVE'],
      ['STU2024007', 'Karthik Rao', 'karthik.rao@scholarship.edu', 'EEE', 'B.Tech Electrical', 4, 8.20, 84.00, 160000.00, 2, 'ACTIVE'],
      ['STU2024008', 'Sneha Kulkarni', 'sneha.k@scholarship.edu', 'CHEM', 'B.Tech Chemical', 2, 9.10, 89.00, 140000.00, 0, 'ACTIVE'],
      ['STU2024009', 'Aditya Joshi', 'aditya.j@scholarship.edu', 'CSE', 'B.Tech Computer Science', 3, 8.15, 81.00, 200000.00, 0, 'ACTIVE'],
      ['STU2024010', 'Neha Deshmukh', 'neha.d@scholarship.edu', 'ECE', 'B.Tech Electronics', 1, 9.50, 88.00, 170000.00, 0, 'ACTIVE'],
      ['STU2024011', 'Arjun Menon', 'arjun.m@scholarship.edu', 'IT', 'B.Tech Information Tech', 2, 8.70, 92.00, 190000.00, 0, 'ACTIVE'],
      ['STU2024012', 'Meera Pillai', 'meera.p@scholarship.edu', 'MECH', 'B.Tech Mechanical', 4, 6.50, 62.00, 400000.00, 1, 'ACTIVE'],
      ['STU2024013', 'Siddharth Jain', 'siddharth.j@scholarship.edu', 'CSE', 'B.Tech Computer Science', 3, 7.50, 75.00, 250000.00, 0, 'ACTIVE'],
      ['STU2024014', 'Kavita Sundaram', 'kavita.s@scholarship.edu', 'ECE', 'B.Tech Electronics', 4, 9.65, 94.00, 220000.00, 0, 'ACTIVE'],
      ['STU2024015', 'Tanvi Gupta', 'tanvi.g@scholarship.edu', 'IT', 'B.Tech Information Tech', 1, 8.30, 86.00, 185000.00, 0, 'ACTIVE']
    ];

    for (const s of studentsData) {
      await client.query(`
        INSERT INTO students (
          student_id, name, email, department, course, academic_year,
          cgpa, attendance, annual_family_income, active_arrears, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (student_id) DO NOTHING;
      `, s);
    }

    // 4. Seed Applications (Single batch seed matching demonstration requirements)
    const applicationsData = [
      ['APP2024001', 'STU2024001', 'MERIT1', 9.45, 88.50, 180000.00, 0, '9182374619283746', 'SBIN0001234', 'SUBMITTED'],
      ['APP2024002', 'STU2024002', 'MERIT1', 8.60, 82.00, 210000.00, 0, '9182374619283747', 'HDFC0002345', 'SUBMITTED'],
      ['APP2024003', 'STU2024003', 'MERIT1', 7.75, 79.00, 195000.00, 0, '9182374619283748', 'ICIC0003456', 'SUBMITTED'],
      ['APP2024004', 'STU2024004', 'MERIT1', 6.80, 85.00, 150000.00, 0, '9182374619283749', 'BARB0COLLEG', 'SUBMITTED'],
      ['APP2024005', 'STU2024005', 'MERIT1', 8.40, 68.50, 175000.00, 0, '9182374619283750', 'PUNB0005678', 'SUBMITTED'],
      ['APP2024006', 'STU2024006', 'MERIT1', 8.90, 91.00, 360000.00, 0, '9182374619283751', 'CNRB0006789', 'SUBMITTED'],
      ['APP2024007', 'STU2024007', 'MERIT1', 8.20, 84.00, 160000.00, 2, '9182374619283752', 'UBIN0007890', 'SUBMITTED'],
      ['APP2024010', 'STU2024009', 'MERIT1', 8.15, 81.00, 200000.00, 0, '9182374619283754', 'INVALIDIFSC', 'SUBMITTED'],
      ['APP2024011', 'STU2024010', 'MERIT1', 11.50, 88.00, 170000.00, 0, '9182374619283755', 'KKBK0009012', 'SUBMITTED'],
      ['APP2024012', 'STU2024011', 'MERIT1', 8.70, 105.00, 190000.00, 0, '9182374619283756', 'YESB0001234', 'SUBMITTED'],
      ['APP2024013', 'STU2024012', 'MERIT1', 6.50, 62.00, 400000.00, 1, '9182374619283757', 'IDIB0002345', 'SUBMITTED'],
      ['APP2024014', 'STU2024013', 'MERIT1', 7.50, 75.00, 250000.00, 0, '9182374619283758', 'CORP0003456', 'SUBMITTED'],
      ['APP2024015', 'STU2024014', 'TECH02', 9.65, 94.00, 220000.00, 0, '9182374619283759', 'AXIS0004567', 'SUBMITTED']
    ];

    for (const a of applicationsData) {
      await client.query(`
        INSERT INTO scholarship_applications (
          application_id, student_id, scheme_code, cgpa, attendance,
          annual_family_income, active_arrears, bank_account_no, bank_ifsc, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (application_id) DO NOTHING;
      `, a);
    }

    // 5. Seed initial audit log
    await client.query(`
      INSERT INTO audit_logs (action, performed_by, details)
      VALUES ('SYSTEM_SEED', 'INSTALLER', '{"status": "Database successfully initialized with initial schema, users, schemes and demo candidates"}')
    `);

    await client.query('COMMIT');
    console.log('Database seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
