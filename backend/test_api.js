const BASE_URL = 'http://localhost:5000/api';

const runSmokeTests = async () => {
  console.log('==================================================');
  console.log('  STARTING NMPA PORT MANAGEMENT SYSTEM INTEGRATION SMOKE TESTS');
  console.log('==================================================\n');

  let loginToken = null;

  // Test 1: Health Check
  try {
    console.log('[TEST 1]: Checking API Health Status...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log(`  -> Status: ${healthRes.status} (${healthRes.statusText})`);
    console.log(`  -> Response:`, healthData);
    console.log('  -> [PASS]\n');
  } catch (error) {
    console.error('  -> [FAIL] Health Check Endpoint offline:', error.message);
    process.exit(1);
  }

  // Test 2: Admin Handshake Login
  try {
    console.log('[TEST 2]: Authenticating Admin Operator credentials...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    console.log(`  -> Status: ${loginRes.status} (${loginRes.statusText})`);
    console.log(`  -> User Verified:`, loginData.user.username);
    console.log(`  -> Role Assigned:`, loginData.user.role);
    loginToken = loginData.token;
    console.log('  -> [PASS]\n');
  } catch (error) {
    console.error('  -> [FAIL] Authentication endpoint failed:', error.message);
    process.exit(1);
  }

  // Test 3: Dashboard data check using Bearer Token
  try {
    console.log('[TEST 3]: Fetching KPI statistics using Auth Token...');
    const dashboardRes = await fetch(`${BASE_URL}/reports/dashboard`, {
      headers: {
        Authorization: `Bearer ${loginToken}`
      }
    });
    const dashboardData = await dashboardRes.json();
    console.log(`  -> Status: ${dashboardRes.status} (${dashboardRes.statusText})`);
    console.log(`  -> KPIs Found:`, Object.keys(dashboardData.kpis).join(', '));
    console.log(`  -> Active Cargo Count:`, dashboardData.kpis.activeCargoCount);
    console.log('  -> [PASS]\n');
  } catch (error) {
    console.error('  -> [FAIL] Dashboard analytics request failed:', error.message);
    process.exit(1);
  }

  console.log('==================================================');
  console.log('  ALL INTEGRATION SMOKE TESTS COMPLETED SUCCESSFULLY!');
  console.log('==================================================');
};

runSmokeTests();
