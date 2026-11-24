import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import authRoutes from './routes/authRoutes';
import studentRoutes from './routes/studentRoutes';
import schemeRoutes from './routes/schemeRoutes';
import applicationRoutes from './routes/applicationRoutes';
import batchRoutes from './routes/batchRoutes';
import disbursementRoutes from './routes/disbursementRoutes';
import reportRoutes from './routes/reportRoutes';
import { runMigrations } from './database/migrate';
import { initializeProductionAdmin } from './database/initAdmin';
import { pool } from './database/db';
import { getJwtSecret } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Enable CORS for frontend Vite dev server and production deployments
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint (Public)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Smart Scholarship REST API & COBOL Engine',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cobolEngine: 'GnuCOBOL v3.1.2 Native Binary Orchestrator',
    database: 'PostgreSQL Relational DB',
  });
});

// Mount Protected REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/disbursements', disbursementRoutes);
app.use('/api/reports', reportRoutes);

// Secure Global Error Handler (Hides Internal Stack Traces in Production)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Uploaded file exceeds the maximum allowed size of 2MB' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  const statusCode = typeof err.status === 'number' ? err.status : 500;
  console.error(`[SERVER ERROR] [${req.method} ${req.path}]:`, err.message || err);

  return res.status(statusCode).json({
    error: isProduction ? (statusCode === 500 ? 'Internal Server Error' : err.message) : (err.message || 'Server Error'),
  });
});

/**
 * Validates production environment constraints and starts the server.
 */
export async function startServer() {
  try {
    console.log('=======================================================');
    console.log('Validating Environment & Security Requirements...');

    // 1. Verify strong JWT_SECRET
    getJwtSecret();
    console.log('[SECURITY CHECK] JWT_SECRET validated (>= 32 chars).');

    // 2. In production, enforce DATABASE_URL presence
    if (isProduction && !process.env.DATABASE_URL) {
      throw new Error(
        'FATAL: DATABASE_URL environment variable is required in production mode. ' +
        'Startup aborted to prevent insecure operation.'
      );
    }

    // 3. Verify PostgreSQL connectivity
    const client = await pool.connect();
    const ver = await client.query('SELECT version();');
    console.log(`[DATABASE] Connected to PostgreSQL: ${ver.rows[0].version.slice(0, 35)}...`);
    client.release();

    // 4. Run Schema Migrations
    console.log('[DATABASE] Verifying schema migrations...');
    await runMigrations();

    // 5. Initialize Production Admin & Core Schemes
    console.log('[SECURITY] Verifying administrator initialization...');
    await initializeProductionAdmin();

    return app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`Smart Scholarship Backend API listening on port ${PORT}`);
      console.log(`Healthcheck: http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });
  } catch (err: any) {
    console.error('Fatal startup error:', err.message || err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
