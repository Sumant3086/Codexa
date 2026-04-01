const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

// Use an in-memory test DB and a random port
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret';
process.env.PORT = '0'; // let OS assign a free port

const app = require('../index');
const http = require('http');

let server;
let baseUrl;
let aliceToken;
let bobToken;
let docId;

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: server.address().port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

before(async () => {
  server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
});

after(async () => {
  await new Promise(r => server.close(r));
});

describe('Auth', () => {
  test('login with valid credentials returns token', async () => {
    const res = await request('POST', '/api/auth/login', { email: 'alice@demo.com', password: 'password123' });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    aliceToken = res.body.token;
  });

  test('login with wrong password returns 401', async () => {
    const res = await request('POST', '/api/auth/login', { email: 'alice@demo.com', password: 'wrong' });
    assert.equal(res.status, 401);
  });

  test('bob can login', async () => {
    const res = await request('POST', '/api/auth/login', { email: 'bob@demo.com', password: 'password123' });
    assert.equal(res.status, 200);
    bobToken = res.body.token;
  });
});

describe('Documents', () => {
  test('create a document', async () => {
    const res = await request('POST', '/api/documents', { title: 'Test Doc', content: '{}' }, aliceToken);
    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'Test Doc');
    docId = res.body.id;
  });

  test('list documents includes owned doc', async () => {
    const res = await request('GET', '/api/documents', null, aliceToken);
    assert.equal(res.status, 200);
    assert.ok(res.body.owned.some(d => d.id === docId));
  });

  test('get document returns content', async () => {
    const res = await request('GET', `/api/documents/${docId}`, null, aliceToken);
    assert.equal(res.status, 200);
    assert.equal(res.body.title, 'Test Doc');
    assert.equal(res.body.role, 'owner');
  });

  test('bob cannot access alice doc', async () => {
    const res = await request('GET', `/api/documents/${docId}`, null, bobToken);
    assert.equal(res.status, 403);
  });

  test('update document title', async () => {
    const res = await request('PATCH', `/api/documents/${docId}`, { title: 'Updated Title' }, aliceToken);
    assert.equal(res.status, 200);
    assert.equal(res.body.title, 'Updated Title');
  });
});

describe('Sharing', () => {
  test('alice shares doc with bob (view)', async () => {
    const res = await request('POST', `/api/documents/${docId}/share`, { user_id: 'user-bob', permission: 'view' }, aliceToken);
    assert.equal(res.status, 200);
    assert.equal(res.body.permission, 'view');
  });

  test('bob can now access the shared doc', async () => {
    const res = await request('GET', `/api/documents/${docId}`, null, bobToken);
    assert.equal(res.status, 200);
    assert.equal(res.body.role, 'view');
  });

  test('bob cannot edit with view permission', async () => {
    const res = await request('PATCH', `/api/documents/${docId}`, { title: 'Bob Edit' }, bobToken);
    assert.equal(res.status, 403);
  });

  test('alice upgrades bob to edit', async () => {
    const res = await request('POST', `/api/documents/${docId}/share`, { user_id: 'user-bob', permission: 'edit' }, aliceToken);
    assert.equal(res.status, 200);
    assert.equal(res.body.permission, 'edit');
  });

  test('bob can edit with edit permission', async () => {
    const res = await request('PATCH', `/api/documents/${docId}`, { title: 'Bob Edited' }, bobToken);
    assert.equal(res.status, 200);
  });

  test('alice revokes bob access', async () => {
    const res = await request('DELETE', `/api/documents/${docId}/share/user-bob`, null, aliceToken);
    assert.equal(res.status, 200);
  });

  test('bob can no longer access after revoke', async () => {
    const res = await request('GET', `/api/documents/${docId}`, null, bobToken);
    assert.equal(res.status, 403);
  });
});
