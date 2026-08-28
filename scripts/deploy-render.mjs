#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  ownerId: 'usr-d320hfjuibrs739e55vg',
  repo: 'https://github.com/RB254/Villagio-Farm-Portal.git',
  branch: 'main',
  backendName: 'villagio-backend',
  frontendName: 'villagio-farm-portal',
};

// Retrieve API Key
let apiKey = process.argv[2] || process.env.RENDER_API_KEY || process.env.RENDER_API_TOKEN || process.env.RENDER_KEY;

// Check .env files if not provided
if (!apiKey) {
  const envFiles = [
    path.resolve('.env'),
    path.resolve('apps/api/.env'),
    path.resolve('apps/web/.env'),
  ];
  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      const match = content.match(/RENDER_API_KEY\s*=\s*(.+)/i);
      if (match) {
        apiKey = match[1].trim().replace(/^["']|["']$/g, '');
        break;
      }
    }
  }
}

if (!apiKey || apiKey === 'YOUR_RENDER_API_KEY_HERE') {
  console.error('\n❌ ERROR: Render API Key not provided.');
  console.error('Please pass your Render API Key as an argument or set RENDER_API_KEY:');
  console.error('  node scripts/deploy-render.mjs <YOUR_RENDER_API_KEY>\n');
  process.exit(1);
}

const API_BASE = 'https://api.render.com/v1';
const headers = {
  Authorization: `Bearer ${apiKey}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const errMsg = json.message || json.error || text || `HTTP ${res.status}`;
    throw new Error(`API Error [${method} ${endpoint}] (${res.status}): ${errMsg}`);
  }
  return json;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function listExistingServices() {
  console.log('🔍 Fetching existing Render services...');
  const services = await apiRequest('/services?limit=100');
  return Array.isArray(services) ? services : (services.items || []);
}

async function deployOrFindBackend(existingServices) {
  const existing = existingServices.find((s) => s.service?.name === CONFIG.backendName || s.name === CONFIG.backendName);
  const serviceObj = existing?.service || existing;

  if (serviceObj) {
    console.log(`✅ Found existing backend service: ${serviceObj.name} (${serviceObj.id})`);
    console.log(`   URL: ${serviceObj.serviceDetails?.url || serviceObj.url}`);
    
    // Trigger deploy
    console.log('🚀 Triggering new deploy for backend...');
    try {
      await apiRequest(`/services/${serviceObj.id}/deploys`, 'POST', { clearCache: 'do_not_clear' });
      console.log('   Deployment triggered successfully.');
    } catch (e) {
      console.log(`   Deploy trigger info: ${e.message}`);
    }
    return serviceObj;
  }

  console.log(`🛠️ Creating new backend Web Service "${CONFIG.backendName}"...`);
  const payload = {
    type: 'web_service',
    name: CONFIG.backendName,
    ownerId: CONFIG.ownerId,
    repo: CONFIG.repo,
    branch: CONFIG.branch,
    rootDir: 'apps/api',
    autoDeploy: 'yes',
    serviceDetails: {
      env: 'node',
      plan: 'free',
      buildCommand: 'npm install && npm run build',
      startCommand: 'npm start',
      envVars: [
        { key: 'PORT', value: '10000' },
        { key: 'NODE_VERSION', value: '22' },
        { key: 'NODE_ENV', value: 'production' },
        { key: 'CORS_ORIGIN', value: '*' },
        { key: 'JWT_SECRET', value: 'villagio-jwt-secret-production-2024-secure' },
        { key: 'DB_PATH', value: './villagio.db' },
      ],
    },
  };

  const created = await apiRequest('/services', 'POST', payload);
  const service = created.service || created;
  console.log(`✅ Backend service created: ${service.name} (${service.id})`);
  return service;
}

async function waitForServiceUrl(serviceId) {
  console.log(`⏳ Waiting for backend service ${serviceId} configuration...`);
  for (let i = 0; i < 30; i++) {
    const s = await apiRequest(`/services/${serviceId}`);
    const details = s.serviceDetails || s.service?.serviceDetails || s;
    const url = details.url || s.url;
    if (url) {
      return url;
    }
    await sleep(3000);
  }
  return `https://${CONFIG.backendName}.onrender.com`;
}

async function deployOrFindFrontend(existingServices, backendUrl) {
  const existing = existingServices.find((s) => s.service?.name === CONFIG.frontendName || s.name === CONFIG.frontendName);
  const serviceObj = existing?.service || existing;

  if (serviceObj) {
    console.log(`✅ Found existing frontend static site: ${serviceObj.name} (${serviceObj.id})`);
    console.log(`   URL: ${serviceObj.serviceDetails?.url || serviceObj.url}`);

    // Update VITE_API_URL env var if needed
    console.log(`🔧 Updating frontend VITE_API_URL environment variable to ${backendUrl}...`);
    try {
      await apiRequest(`/services/${serviceObj.id}/env-vars`, 'PUT', [
        { key: 'VITE_API_URL', value: backendUrl },
      ]);
    } catch (e) {
      console.log(`   Env var update info: ${e.message}`);
    }

    console.log('🚀 Triggering new deploy for frontend static site...');
    try {
      await apiRequest(`/services/${serviceObj.id}/deploys`, 'POST', { clearCache: 'clear' });
      console.log('   Deployment triggered successfully.');
    } catch (e) {
      console.log(`   Deploy trigger info: ${e.message}`);
    }
    return serviceObj;
  }

  console.log(`🛠️ Creating new frontend Static Site "${CONFIG.frontendName}"...`);
  const payload = {
    type: 'static_site',
    name: CONFIG.frontendName,
    ownerId: CONFIG.ownerId,
    repo: CONFIG.repo,
    branch: CONFIG.branch,
    rootDir: 'apps/web',
    autoDeploy: 'yes',
    serviceDetails: {
      buildCommand: 'npm install && npm run build',
      publishPath: 'dist',
      envVars: [
        { key: 'VITE_API_URL', value: backendUrl },
      ],
    },
  };

  const created = await apiRequest('/services', 'POST', payload);
  const service = created.service || created;
  console.log(`✅ Frontend static site created: ${service.name} (${service.id})`);
  return service;
}

async function setupSpaRoutes(serviceId) {
  console.log('⚙️ Configuring SPA rewrite rule (/* -> /index.html)...');
  try {
    // Check existing routes
    const routes = await apiRequest(`/services/${serviceId}/routes`);
    const hasSpa = Array.isArray(routes) && routes.some((r) => r.type === 'rewrite' && r.source === '/*' && r.destination === '/index.html');
    if (hasSpa) {
      console.log('✅ SPA rewrite rule already exists.');
      return;
    }

    await apiRequest(`/services/${serviceId}/routes`, 'POST', {
      type: 'rewrite',
      source: '/*',
      destination: '/index.html',
    });
    console.log('✅ SPA rewrite rule added successfully.');
  } catch (err) {
    console.log(`⚠️ Note on routes setup: ${err.message}`);
  }
}

async function pollDeployment(serviceId, serviceName, maxMinutes = 7) {
  console.log(`⏳ Monitoring deployment progress for ${serviceName}...`);
  const startTime = Date.now();
  const maxTime = maxMinutes * 60 * 1000;

  while (Date.now() - startTime < maxTime) {
    try {
      const deploys = await apiRequest(`/services/${serviceId}/deploys?limit=1`);
      const latest = Array.isArray(deploys) ? deploys[0] : deploys.items?.[0];
      const deployObj = latest?.deploy || latest;

      if (deployObj) {
        const status = deployObj.status;
        console.log(`   [${new Date().toLocaleTimeString()}] Status: ${status}`);
        if (status === 'live') {
          console.log(`🎉 ${serviceName} is LIVE!`);
          return true;
        }
        if (status === 'build_failed' || status === 'deactivated' || status === 'canceled') {
          console.error(`❌ Deployment failed for ${serviceName} with status: ${status}`);
          return false;
        }
      }
    } catch (e) {
      // Ignore intermittent poll errors
    }
    await sleep(10000);
  }
  console.log(`⚠️ Polling timed out after ${maxMinutes} minutes. Checking live health directly...`);
  return false;
}

async function pingUrl(url, expectedPattern = null, maxAttempts = 15) {
  console.log(`🌐 Pinging ${url}...`);
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (res.ok) {
        if (!expectedPattern || text.includes(expectedPattern)) {
          console.log(`✅ [200 OK] Response received from ${url} (Attempt ${i}/${maxAttempts})`);
          return { ok: true, status: res.status, body: text };
        }
      }
      console.log(`   Attempt ${i}/${maxAttempts}: Status ${res.status}... retrying in 8s`);
    } catch (err) {
      console.log(`   Attempt ${i}/${maxAttempts}: Connection pending (${err.message})... retrying in 8s`);
    }
    await sleep(8000);
  }
  return { ok: false };
}

async function main() {
  console.log('====================================================');
  console.log('🚀 Villagio Farm Fresh — Render Automated Deployment');
  console.log('====================================================');
  console.log(`📦 GitHub Repo : ${CONFIG.repo}`);
  console.log(`👤 Owner ID    : ${CONFIG.ownerId}`);
  console.log('====================================================\n');

  try {
    // 1. Check existing services
    const existingServices = await listExistingServices();

    // 2. Deploy/Create Backend
    console.log('\n--- TASK A: Provision Backend Web Service ---');
    const backendService = await deployOrFindBackend(existingServices);
    const backendId = backendService.id;
    let backendUrl = backendService.serviceDetails?.url || backendService.url;
    if (!backendUrl) {
      backendUrl = await waitForServiceUrl(backendId);
    }
    console.log(`📍 Backend Target URL: ${backendUrl}`);

    // 3. Deploy/Create Frontend
    console.log('\n--- TASK B: Provision Frontend Static Site ---');
    const frontendService = await deployOrFindFrontend(existingServices, backendUrl);
    const frontendId = frontendService.id;
    let frontendUrl = frontendService.serviceDetails?.url || frontendService.url;
    if (!frontendUrl) {
      frontendUrl = await waitForServiceUrl(frontendId);
    }
    console.log(`📍 Frontend Target URL: ${frontendUrl}`);

    // 4. Setup SPA rewrite rules
    await setupSpaRoutes(frontendId);

    // 5. Monitor Deployments
    console.log('\n--- Deployment Status Monitoring ---');
    await pollDeployment(backendId, 'villagio-backend', 6);
    await pollDeployment(frontendId, 'villagio-farm-portal', 6);

    // 6. Verify live endpoints
    console.log('\n--- Live Endpoint Healthcheck Verification ---');
    const backendHealth = await pingUrl(`${backendUrl.replace(/\/+$/, '')}/health`, 'Villagio API');
    const frontendCheck = await pingUrl(frontendUrl);

    console.log('\n====================================================');
    console.log('🎉 DEPLOYMENT SUMMARY & LIVE ACCESS CREDENTIALS');
    console.log('====================================================');
    console.log(`🌐 Frontend URL : ${frontendUrl}`);
    console.log(`🔌 Backend API  : ${backendUrl}`);
    console.log(`📊 Healthcheck  : ${backendUrl}/health`);
    console.log('----------------------------------------------------');
    console.log('🔑 DEMO CREDENTIALS:');
    console.log('  Admin Portal  : username="admin", PIN="1234"');
    console.log('  Farmer Alice  : phone="0711000001", PIN="1111"');
    console.log('  Farmer Bernard: phone="0711000002", PIN="2222"');
    console.log('  Farmer Caroline: phone="0711000003", PIN="3333"');
    console.log('  Farmer David  : phone="0711000004", PIN="4444"');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ Deployment Script Error:', err.message);
    process.exit(1);
  }
}

main();
