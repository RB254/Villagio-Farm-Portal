import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/database';
import { errorHandler, notFound } from './middleware/error';
import { startAutomationEngine } from './services/automation.service';

// Routes
import authRoutes from './routes/auth.routes';
import farmersRoutes from './routes/farmers.routes';
import produceRoutes from './routes/produce.routes';
import collectionsRoutes from './routes/collections.routes';
import notificationsRoutes from './routes/notifications.routes';
import paymentsRoutes from './routes/payments.routes';
import ussdRoutes from './routes/ussd.routes';
import ivrRoutes from './routes/ivr.routes';
import smsRoutes from './routes/sms.routes';
import sourcingRoutes from './routes/sourcing.routes';
import adminRoutes from './routes/admin.routes';
import supportRoutes, { productsRouter } from './routes/support.routes';

// ============================================================
// INITIALIZE DATABASE
// ============================================================
initializeDatabase();

const app = express();
const PORT = process.env.PORT || 10000;

// ============================================================
// MIDDLEWARE
// ============================================================
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({
  origin: !corsOrigin || corsOrigin === '*' 
    ? true 
    : corsOrigin.split(',').map((s) => s.trim()),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ============================================================
// ROUTES
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/farmers', farmersRoutes);
app.use('/api/produce', produceRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/integrations/ussd', ussdRoutes);
app.use('/api/integrations/ivr', ivrRoutes);
app.use('/api/integrations/sms', smsRoutes);
app.use('/api/sourcing', sourcingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/products', productsRouter);

import path from 'path';
import fs from 'fs';

// Check if static web build is available to serve
const possibleStaticDirs = [
  path.resolve(__dirname, '../public'),
  path.resolve(__dirname, '../../web/dist'),
  path.resolve(__dirname, './public'),
  path.resolve(process.cwd(), 'apps/api/public'),
  path.resolve(process.cwd(), 'public'),
  path.resolve(process.cwd(), 'apps/web/dist'),
];
const staticDir = possibleStaticDirs.find((dir) => fs.existsSync(path.join(dir, 'index.html')));

if (staticDir) {
  console.log(`📁 Serving frontend static build from: ${staticDir}`);
  app.use(express.static(staticDir));
}

// API Root metadata endpoint
app.get('/api', (_req, res) => {
  res.json({
    success: true,
    service: 'Villagio Farm Fresh API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      farmers: '/api/farmers',
      produce: '/api/produce',
      collections: '/api/collections',
      payments: '/api/payments',
      admin: '/api/admin',
      sourcing: '/api/sourcing',
      support: '/api/support',
      ussd: '/api/integrations/ussd',
      ivr: '/api/integrations/ivr',
      sms: '/api/integrations/sms',
    },
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Villagio API', timestamp: new Date().toISOString() });
});

// SPA wildcard fallback for all non-API web routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') {
    return next();
  }

  if (staticDir && fs.existsSync(path.join(staticDir, 'index.html'))) {
    return res.sendFile(path.join(staticDir, 'index.html'));
  }

  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Villagio Farm Fresh</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; border: 1px solid #334155; text-align: center; max-width: 480px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h1 { color: #22c55e; margin-bottom: 0.5rem; }
        p { color: #94a3b8; line-height: 1.6; }
        a { display: inline-block; margin: 0.5rem; padding: 0.6rem 1.2rem; background: #22c55e; color: #0f172a; border-radius: 0.5rem; text-decoration: none; font-weight: 600; }
        a.secondary { background: #334155; color: #f8fafc; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🌱 Villagio Farm Fresh</h1>
        <p>Backend API service is running in production.</p>
        <div>
          <a href="/api">API Documentation</a>
          <a href="/health" class="secondary">Health Check</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// ============================================================
// ERROR HANDLING
// ============================================================
app.use(notFound);
app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`\n🌱 VILLAGIO API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️  Database: ${process.env.DB_PATH || './villagio.db'}\n`);
  
  // Start automation engine
  startAutomationEngine();
});

export default app;
