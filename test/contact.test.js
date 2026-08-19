const assert = require('node:assert/strict');
const http = require('node:http');
const { test } = require('node:test');

const app = require('../index');
const pool = require('../db');

function request(server, method, path, body) {
  return new Promise((resolve, reject) => {
    const requestBody = body ? JSON.stringify(body) : undefined;
    const request = http.request(
      `http://127.0.0.1:${server.address().port}${path}`,
      {
        method,
        headers: requestBody
          ? {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(requestBody)
            }
          : undefined
      },
      response => {
        let responseBody = '';
        response.setEncoding('utf8');
        response.on('data', chunk => {
          responseBody += chunk;
        });
        response.on('end', () => {
          resolve({ statusCode: response.statusCode, body: JSON.parse(responseBody) });
        });
      }
    );
    request.on('error', reject);
    if (requestBody) {
      request.write(requestBody);
    }
    request.end();
  });
}

async function withServer(callback) {
  const server = await new Promise(resolve => {
    const instance = app.listen(0, () => resolve(instance));
  });

  try {
    return await callback(server);
  } finally {
    await new Promise((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
  }
}

test('GET /contact returns contacts', async t => {
  t.mock.method(pool, 'query', async () => ({ rows: [{ id: 1, name: 'Jane Doe' }] }));

  await withServer(async server => {
    const response = await request(server, 'GET', '/contact');

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, [{ id: 1, name: 'Jane Doe' }]);
  });
});

test('POST /contact creates a contact', async t => {
  t.mock.method(pool, 'query', async () => ({
    rows: [{ id: 1, name: 'Jane Doe', email: 'jane@example.com' }]
  }));

  await withServer(async server => {
    const response = await request(server, 'POST', '/contact', {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+1-555-0123',
      message: 'Hello'
    });

    assert.equal(response.statusCode, 201);
    assert.deepEqual(response.body, [{ id: 1, name: 'Jane Doe', email: 'jane@example.com' }][0]);
  });
});

test('POST /contact rejects missing required fields', async t => {
  t.mock.method(pool, 'query', async () => ({ rows: [] }));

  await withServer(async server => {
    const response = await request(server, 'POST', '/contact', { name: 'Jane Doe' });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.body, { error: 'Request body must include name and email' });
  });
});

test('POST /contact returns conflict for duplicate email', async t => {
  t.mock.method(pool, 'query', async () => {
    const error = new Error('duplicate email');
    error.code = '23505';
    throw error;
  });

  await withServer(async server => {
    const response = await request(server, 'POST', '/contact', {
      name: 'Jane Doe',
      email: 'jane@example.com'
    });

    assert.equal(response.statusCode, 409);
    assert.deepEqual(response.body, { error: 'A contact with that email already exists' });
  });
});