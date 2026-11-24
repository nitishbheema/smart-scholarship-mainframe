import bcrypt from 'bcryptjs';
import { pool } from './db';
import { runMigrations } from './migrate';

/**
 * Production Administrator and Scheme Initialization.
 * One-time idempotent setup:
 * - Creates sequences if needed
 * - Creates the initial ADMIN user using environment variables (ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_EMAIL)
 * - Guarantees NO passwords are printed in logs
 * - Safely provisions initial core scholarship schemes (MERIT1, TECH02)
 */
export async function initializeProductionAdmin() {
  await runMigrations();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if an ADMIN already exists
    const adminCheck = await client.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1;");

    if (adminCheck.rows.length === 0) {
      const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim();
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@scholarship.edu').trim();
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminPassword || adminPassword.length < 8) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error(
            'FATAL SECURITY REQUIREMENT: ADMIN_PASSWORD environment variable with at least 8 characters ' +
            'must be configured for production initialization.'
          );
        }
      }

      // Use provided password or non-production secure fallback (never log!)
      const passwordToHash = adminPassword || 'ScholarAdmin2026!';
      const passwordHash = await bcrypt.hash(passwordToHash, 12);

      await client.query(`
        INSERT INTO users (username, email, password_hash, role)
        VALUES ($1, $2, $3, 'ADMIN')
        ON CONFLICT (username) DO NOTHING;
      `, [adminUsername, adminEmail, passwordHash]);

      console.log(`[SECURITY] Initial administrator account '${adminUsername}' provisioned successfully.`);
    } else {
      if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 8) {
        const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
        await client.query("UPDATE users SET password_hash = $1 WHERE username = 'admin'", [passwordHash]);
        console.log('[SECURITY] Administrator password synchronized with environment configuration.');
      } else {
        console.log('[SECURITY] Administrator account verified. Skipping initial provisioning.');
      }
    }

    // 2. In non-production, ensure operator and auditor accounts exist for operational workflows
    if (process.env.NODE_ENV !== 'production') {
      const opPass = process.env.OPERATOR_PASSWORD || 'ScholarOper2026!';
      const audPass = process.env.AUDITOR_PASSWORD || 'ScholarAudit2026!';
      const opHash = await bcrypt.hash(opPass, 10);
      const audHash = await bcrypt.hash(audPass, 10);

      await client.query(`
        INSERT INTO users (username, email, password_hash, role)
        VALUES 
          ('operator', 'operator@scholarship.edu', $1, 'OPERATOR'),
          ('auditor', 'auditor@scholarship.edu', $2, 'AUDITOR')
        ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
      `, [opHash, audHash]);
    }

    // 3. Safely provision initial scholarship schemes
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

    await client.query('COMMIT');
    console.log('[SECURITY] Core scholarship schemes verified successfully.');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[SECURITY ERROR] Failed during admin and scheme initialization:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  initializeProductionAdmin()
    .then(() => {
      console.log('Admin and scheme setup completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal initialization error:', err.message);
      process.exit(1);
    });
}
