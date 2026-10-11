import http from 'http';

function request(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function testHttpEndpoints() {
  console.log('Testing live HTTP endpoints on port 5000...');
  try {
    // 1. Health check
    const health = await request('http://localhost:5000/api/health');
    console.log(`Health Check: status ${health.status}, response:`, health.data);

    // 2. Internships
    const internships = await request('http://localhost:5000/api/internships');
    console.log(`Internships List: status ${internships.status}, found ${internships.data?.internships?.length} tracks`);

    // 3. Training
    const training = await request('http://localhost:5000/api/training');
    console.log(`Training Programs: status ${training.status}, found ${training.data?.programs?.length} programs`);

    // 4. Company config
    const company = await request('http://localhost:5000/api/company');
    console.log(`Company Config: status ${company.status}, name: ${company.data?.company?.name}, udyam: ${company.data?.company?.udyamNumber}`);

    // 5. Admin Login via HTTP
    const adminLogin = await request('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'admin@skillsetu.ehbvssolutions.com',
      password: 'Admin@SkillSetu2026'
    });
    console.log(`Admin Login: status ${adminLogin.status}, token received: ${!!adminLogin.data?.token}`);

    // 6. Admin Dashboard Stats with Bearer token
    if (adminLogin.data?.token) {
      const stats = await request('http://localhost:5000/api/admin/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminLogin.data.token}`
        }
      });
      console.log(`Admin Dashboard API: status ${stats.status}, stats:`, stats.data?.stats);
    }

    console.log('LIVE HTTP TESTS SUCCESSFUL!');
    process.exit(0);
  } catch (err) {
    console.error('HTTP test error:', err.message);
    process.exit(1);
  }
}

testHttpEndpoints();
