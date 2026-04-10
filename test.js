const http = require('http');

const PORT = 3457;
process.env.PORT = PORT;
let server;
let passed = 0;
let failed = 0;

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${path}`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    }).on('error', reject);
  });
}

async function test(name, path, check) {
  try {
    const res = await get(path);
    if (check(res)) { console.log(`  PASS: ${name}`); passed++; }
    else { console.log(`  FAIL: ${name} - unexpected response`); failed++; }
  } catch (e) { console.log(`  FAIL: ${name} - ${e.message}`); failed++; }
}

async function run() {
  require('./server');
  await new Promise(r => setTimeout(r, 500));

  console.log('Running tests...\n');
  await test('root returns endpoints', '/', r => r.status === 200 && r.body.endpoints);
  await test('health check', '/health', r => r.status === 200 && r.body.status === 'ok');
  await test('prices default', '/prices', r => r.status === 200 && r.body.bitcoin);
  await test('prices custom', '/prices?ids=ethereum&vs=eur', r => r.status === 200 && r.body.ethereum);
  await test('trending', '/trending', r => r.status === 200);
  await test('404 handling', '/nonexistent', r => r.status === 404);

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
