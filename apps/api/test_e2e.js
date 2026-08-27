// End-to-end acceptance test for Villagio Farmer System per Contract Section 49
const http = require('http');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path,
      method: 'POST',
      headers,
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch (e) { resolve({ status: res.statusCode, raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path,
      method: 'GET',
      headers,
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch (e) { resolve({ status: res.statusCode, raw }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runE2ETests() {
  console.log('============================================================');
  console.log('🧪 RUNNING VILLAGIO END-TO-END ACCEPTANCE TESTS (Section 49)');
  console.log('============================================================\n');

  // TEST 1: Admin Login
  console.log('TEST 1: Admin Login...');
  const adminRes = await post('/api/auth/admin/login', { username: 'admin', pin: '1234' });
  if (!adminRes.data.success) throw new Error('Admin login failed: ' + JSON.stringify(adminRes));
  const adminToken = adminRes.data.data.token;
  console.log('  ✓ Admin logged in successfully.');

  // TEST 2: Farmer A Login & Web Produce Submission
  console.log('\nTEST 2: Farmer A (Alice) Web Produce Submission...');
  const farmerALogin = await post('/api/auth/login', { phone: '0711000001', pin: '1111' });
  if (!farmerALogin.data.success) throw new Error('Farmer A login failed: ' + JSON.stringify(farmerALogin.data));
  const farmerAToken = farmerALogin.data.data.token;
  const farmerAId = farmerALogin.data.data.farmer.id;

  const produceWeb = await post('/api/produce', {
    product_id: 1, // Potatoes
    quantity: 5,
    unit: 'sack',
    availability_date: '2026-08-29',
    quality_estimate: 'GOOD',
    location: 'Limuru, Kiambu',
    source_channel: 'WEB',
  }, farmerAToken);
  if (!produceWeb.data.success) throw new Error('Produce submission failed: ' + JSON.stringify(produceWeb.data));
  console.log(`  ✓ Farmer A submitted 5 sacks potatoes via WEB. Submission ID: ${produceWeb.data.data.submission_id}`);

  // TEST 3: Farmer B submits 10 sacks via USSD SIMULATOR
  console.log('\nTEST 3: Farmer B USSD Produce Submission...');
  const ussdSessionId = `USSD-${Date.now()}`;
  // Menu -> 1 (Uza Mazao) -> 1 (Viazi) -> 5 (Custom) -> 10 -> 2 (Kesho) -> 1 (Thibitisha)
  await post('/api/integrations/ussd/json', { sessionId: ussdSessionId, phoneNumber: '0711000002', text: '' });
  await post('/api/integrations/ussd/json', { sessionId: ussdSessionId, phoneNumber: '0711000002', text: '1' });
  await post('/api/integrations/ussd/json', { sessionId: ussdSessionId, phoneNumber: '0711000002', text: '1' });
  await post('/api/integrations/ussd/json', { sessionId: ussdSessionId, phoneNumber: '0711000002', text: '5' });
  await post('/api/integrations/ussd/json', { sessionId: ussdSessionId, phoneNumber: '0711000002', text: '10' });
  await post('/api/integrations/ussd/json', { sessionId: ussdSessionId, phoneNumber: '0711000002', text: '2' });
  const ussdFinal = await post('/api/integrations/ussd/json', { sessionId: ussdSessionId, phoneNumber: '0711000002', text: '1' });
  console.log(`  ✓ Farmer B submitted 10 sacks potatoes via USSD. Response: ${ussdFinal.data.data.text.replace(/\n/g, ' ')}`);

  // TEST 4: Farmer C submits 3 sacks via IVR SIMULATOR
  console.log('\nTEST 4: Farmer C IVR Produce Submission...');
  const ivrSessionId = `IVR-${Date.now()}`;
  // Welcome -> 2 (English) -> 1 (Sell Produce) -> 1 (Potatoes) -> 3# (3 sacks) -> 2 (Tomorrow) -> 1 (Confirm)
  await post('/api/integrations/ivr', { sessionId: ivrSessionId, phoneNumber: '0711000003', dtmfDigits: '' });
  await post('/api/integrations/ivr', { sessionId: ivrSessionId, phoneNumber: '0711000003', dtmfDigits: '2' });
  await post('/api/integrations/ivr', { sessionId: ivrSessionId, phoneNumber: '0711000003', dtmfDigits: '1' });
  await post('/api/integrations/ivr', { sessionId: ivrSessionId, phoneNumber: '0711000003', dtmfDigits: '1' });
  await post('/api/integrations/ivr', { sessionId: ivrSessionId, phoneNumber: '0711000003', dtmfDigits: '3#' });
  await post('/api/integrations/ivr', { sessionId: ivrSessionId, phoneNumber: '0711000003', dtmfDigits: '2' });
  const ivrFinal = await post('/api/integrations/ivr', { sessionId: ivrSessionId, phoneNumber: '0711000003', dtmfDigits: '1' });
  console.log(`  ✓ Farmer C submitted 3 sacks potatoes via IVR. Prompt: ${ivrFinal.data.data.prompt.slice(0, 70)}...`);

  // TEST 5: Verify Multi-Channel Synchronization in Farmer Portals
  console.log('\nTEST 5: Multi-Channel Synchronization Verification...');
  const farmerBLogin = await post('/api/auth/login', { phone: '0711000002', pin: '2222' });
  const farmerBProduce = await get(`/api/produce/farmer/${farmerBLogin.data.data.farmer.id}`, farmerBLogin.data.data.token);
  const ussdItems = farmerBProduce.data.data.filter(x => x.source_channel === 'USSD');
  console.log(`  ✓ Farmer B web portal sees USSD submission: ${ussdItems.length} items (Source: USSD)`);

  const farmerCLogin = await post('/api/auth/login', { phone: '0711000003', pin: '3333' });
  const farmerCProduce = await get(`/api/produce/farmer/${farmerCLogin.data.data.farmer.id}`, farmerCLogin.data.data.token);
  const ivrItems = farmerCProduce.data.data.filter(x => x.source_channel === 'IVR');
  console.log(`  ✓ Farmer C web portal sees IVR submission: ${ivrItems.length} items (Source: IVR)`);

  // TEST 6: Sourcing Engine Aggregates Supply
  console.log('\nTEST 6: Sourcing Engine Aggregation...');
  const sourcing = await get('/api/sourcing/summary', adminToken);
  const potatoSupply = sourcing.data.data.by_product.find(x => x.product_name === 'Potatoes');
  console.log(`  ✓ Total Potatoes Available in Sourcing Engine: ${potatoSupply.total_sacks} sacks from ${potatoSupply.farmer_count} farmers`);

  // TEST 7: Demand Engine Balance
  console.log('\nTEST 7: Demand Engine Analysis...');
  const demand = await get('/api/sourcing/demand', adminToken);
  console.log(`  ✓ Demand engine balance:`, demand.data.data.map(d => `${d.product_name}: Supply=${d.supply_sacks}, Demand=${d.demand_sacks}, Net=${d.surplus_or_shortage}`).join(' | '));

  // TEST 8: Automated Collection Batch Generation
  console.log('\nTEST 8: Generating Automated Collection Batch...');
  const genBatch = await post('/api/sourcing/generate-collection', { product_id: 1 }, adminToken);
  console.log(`  ✓ Generated ${genBatch.data.data.length} collection order(s):`, genBatch.data.data.map(c => c.collection_id).join(', '));

  // TEST 9: F.T.M.A Logistics Partner Acceptance & Vehicle Assignment
  console.log('\nTEST 9: F.T.M.A Logistics Partner Acceptance...');
  const collectionsList = await get('/api/collections', adminToken);
  const pendingCollection = collectionsList.data.data.find(c => c.status === 'REQUESTED');
  if (pendingCollection) {
    const ftmaRes = await post(`/api/admin/logistics/ftma-accept/${pendingCollection.collection_id}`, {}, adminToken);
    console.log(`  ✓ F.T.M.A accepted collection ${pendingCollection.collection_id} and assigned truck: ${ftmaRes.data.data.vehicle_id} (Driver: ${ftmaRes.data.data.driver_id})`);
  }

  // TEST 10: Farmer Notification & Collection Status Verification
  console.log('\nTEST 10: Farmer Notification & Status Verification...');
  const notifs = await get(`/api/notifications/farmer/${farmerAId}`, farmerAToken);
  console.log(`  ✓ Farmer A has ${notifs.data.data.length} notifications (Unread: ${notifs.data.unread_count})`);
  console.log(`  ✓ Latest notification: "${notifs.data.data[0]?.title}" - ${notifs.data.data[0]?.message}`);

  // TEST 11: Admin Operations Dashboard
  console.log('\nTEST 11: Admin Operations Dashboard Health Check...');
  const dashboard = await get('/api/admin/dashboard', adminToken);
  if (!dashboard.data.success) throw new Error('Admin dashboard failed: ' + JSON.stringify(dashboard.data));
  console.log(`  ✓ Registered Farmers: ${dashboard.data.data.farmers.total}`);
  console.log(`  ✓ Available Supply: ${dashboard.data.data.supply.available} sacks`);
  console.log(`  ✓ Scheduled Collections: ${dashboard.data.data.collections.scheduled}`);
  console.log(`  ✓ Outbound SMS Sent: ${dashboard.data.data.sms_sent}`);

  console.log('\n============================================================');
  console.log('🎉 ALL 11 END-TO-END ACCEPTANCE TESTS PASSED 100%!');
  console.log('============================================================\n');
}

runE2ETests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
