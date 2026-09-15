// infrastructure/monitoring/healthcheck.js
// Standalone lightweight container & cluster healthcheck probe
const http = require('http');

const options = {
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 5000,
  path: '/api/health',
  timeout: 4000
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    console.error(`Healthcheck failed with status: ${res.statusCode}`);
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.error(`Healthcheck error: ${err.message}`);
  process.exit(1);
});

request.end();
