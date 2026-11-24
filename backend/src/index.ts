import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import studentRoutes from './routes/studentRoutes';
import schemeRoutes from './routes/schemeRoutes';
import applicationRoutes from './routes/applicationRoutes';
import batchRoutes from './routes/batchRoutes';
import disbursementRoutes from './routes/disbursementRoutes';
import reportRoutes from './routes/reportRoutes';
import { runMigrations } from './database/migrate';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server and production deployments
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Smart Scholarship REST API & COBOL Engine',
    timestamp: new Date().toISOString(),
    cobolEngine: 'GnuCOBOL v3.1.2 Native Binary Orchester',
    database: 'PostgreSQL Relational DB',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/disbursements', disbursementRoutes);
app.use('/api/reports', reportRoutes);

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error: ' + (err.message || 'Unknown') });
});

async function startServer() {
  try {
    console.log('Verifying PostgreSQL schema...');
    await runMigrations();
    
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`Smart Scholarship Backend API listening on port ${PORT}`);
      console.log(`Healthcheck: http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Fatal error during backend startup:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
