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
  path.resolve(__dirname, '../../web/dist'),
  path.resolve(__dirname, '../public'),
  path.resolve(__dirname, './public'),
];
const staticDir = possibleStaticDirs.find((dir) => fs.existsSync(dir));

if (staticDir) {
  app.use(express.static(staticDir));
}

// Root metadata endpoint
app.get('/', (req, res) => {
  if (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('text/html')) {
    return res.json({
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
  }

  if (staticDir && fs.existsSync(path.join(staticDir, 'index.html'))) {
    return res.sendFile(path.join(staticDir, 'index.html'));
  }

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

// API Root info
app.get('/api', (_req, res) => {
  res.json({
    success: true,
    service: 'Villagio Farm Fresh API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Villagio API', timestamp: new Date().toISOString() });
});

// SPA fallback for static frontend if available
if (staticDir && fs.existsSync(path.join(staticDir, 'index.html'))) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

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
