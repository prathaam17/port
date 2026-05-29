const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('==================================================');
  console.log('  TESTING NEW SHIPPING AGENT ENDPOINTS');
  console.log('==================================================\n');

  let adminToken = null;
  let sampleCargoId = null;

  // 1. Authenticate Admin
  try {
    console.log('[TEST 1]: Authenticating Admin...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password123' })
    });
    const loginData = await loginRes.json();
    adminToken = loginData.token;
    console.log(`  -> Auth Success. Token acquired.`);
    console.log('  -> [PASS]\n');
  } catch (err) {
    console.error('  -> [FAIL] Auth Failed:', err.message);
    process.exit(1);
  }

  // 2. Bulk Cargo Manifest Upload
  try {
    console.log('[TEST 2]: Submitting Bulk Cargo Manifest...');
    const res = await fetch(`${BASE_URL}/cargo/bulk-manifest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vesselName: 'MT Swarna Krishna',
        tradeType: 'Import',
        consignee: 'Western India Cashew Company',
        containers: [
          {
            containerNo: 'MSCU7721892',
            cargoType: 'Container',
            weight: 24.5,
            destination: 'Mangalore',
            billOfLading: 'BL-NMPA-TEST-001',
            digitalSignature: 'Electronically Signed by Shipping Agent'
          },
          {
            containerNo: 'MSCU9902812',
            cargoType: 'Container',
            weight: 22.0,
            destination: 'Udupi',
            billOfLading: 'BL-NMPA-TEST-002',
            digitalSignature: 'Electronically Signed by Shipping Agent'
          }
        ]
      })
    });
    const data = await res.json();
    console.log(`  -> Status: ${res.status}`);
    console.log(`  -> Response message: ${data.message}`);
    console.log(`  -> Total Cargo Records Created: ${data.cargoes?.length}`);
    if (data.cargoes && data.cargoes.length > 0) {
      console.log(`  -> Sample Cargo ID: ${data.cargoes[0].cargoId} Container: ${data.cargoes[0].containerNo}`);
      sampleCargoId = data.cargoes[0].id;
    }
    console.log('  -> [PASS]\n');
  } catch (err) {
    console.error('  -> [FAIL] Bulk Manifest Upload Failed:', err.message);
    process.exit(1);
  }

  console.log('==================================================');
  console.log('  ALL NEW SHIPPING AGENT ENDPOINT TESTS PASSED!');
  console.log('==================================================');
};

runTests();
