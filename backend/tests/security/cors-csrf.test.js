'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../../app/server');
const { close } = require('../../app/core/database/connection');

let server;
let baseUrl;

test.before(async () => {
  server = await startServer(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  if (server) await new Promise(r => server.close(r));
  await close();
});

test('CORS and CSRF Security - Origin Boundaries and State-Mutation Controls', async (t) => {
  await t.test('1. Arbitrary attacker origin is rejected by CORS', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://evil.attacker.example' }
    });
    // With CORS error, standard Express CORS either errors or omits Access-Control-Allow-Origin
    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert.notEqual(allowOrigin, 'https://evil.attacker.example', 'Attacker origin must not be reflected');
  });

  await t.test('2. Attacker Vercel subdomain (e.g. evil.vercel.app) is rejected', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://evil-attacker.vercel.app' }
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert.notEqual(allowOrigin, 'https://evil-attacker.vercel.app', 'Arbitrary Vercel deployment must not be allowed');
  });

  await t.test('3. Spoofed localhost domain (https://localhost.evil.com) is rejected', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://localhost.evil.com' }
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert.notEqual(allowOrigin, 'https://localhost.evil.com', 'Spoofed localhost domain must not be allowed');
  });

  await t.test('4. Legitimate preview deployment is permitted with CORS credentials', async () => {
    const validOrigin = 'https://anupmazumdar-preview.vercel.app';
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: validOrigin }
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), validOrigin);
    assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
  });

  await t.test('5. CSRF defense blocks unauthorized cross-origin state-changing mutation', async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Origin: 'https://unauthorized-cross-site.com',
        'Content-Type': 'application/json'
      }
    });
    assert.equal(res.status, 403, 'Cross-origin mutation from untrusted origin must be blocked with 403');
    const data = await res.json();
    assert.equal(data.error, 'CSRF_REJECTED');
  });

  await t.test('6. CSRF defense allows legitimate origin state-changing mutation', async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Origin: 'https://career-compass-main.vercel.app',
        'Content-Type': 'application/json'
      }
    });
    // Not 403 CSRF error: allowed through
    assert.notEqual(res.status, 403, 'Legitimate project origin must pass CSRF validation');
  });

  await t.test('7. CSRF defense blocks unauthorized state-changing mutation with attacker Referer header', async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Referer: 'https://evil-attacker.example.com/phish',
        'Content-Type': 'application/json'
      }
    });
    assert.equal(res.status, 403, 'Attacker Referer header must be blocked with 403');
    const data = await res.json();
    assert.equal(data.error, 'CSRF_REJECTED');
  });

  await t.test('8. CSRF defense allows legitimate project Referer header', async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Referer: 'https://career-compass-rose-five.vercel.app/profile',
        'Content-Type': 'application/json'
      }
    });
    assert.notEqual(res.status, 403, 'Legitimate project Referer must pass CSRF check');
  });
});
