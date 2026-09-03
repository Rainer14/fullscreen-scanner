const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const { createApp } = require('../src/app');
const { createQrService } = require('../src/services/qrService');

function createMemoryFileSystem() {
  let content = '';

  return {
    readFileSync() {
      if (!content) {
        throw new Error('File does not exist');
      }
      return content;
    },
    writeFileSync(filePath, value) {
      content = value;
    },
    getContent() {
      return content;
    }
  };
}

function request(server, method, requestPath, body) {
  return new Promise((resolve, reject) => {
    const requestBody = body ? JSON.stringify(body) : '';
    const request = http.request({
      host: '127.0.0.1',
      port: server.address().port,
      method,
      path: requestPath,
      headers: body ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      } : undefined
    }, (response) => {
      let responseBody = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { responseBody += chunk; });
      response.on('end', () => resolve({
        statusCode: response.statusCode,
        body: responseBody,
        json: response.headers['content-type']?.includes('application/json')
          ? JSON.parse(responseBody)
          : null
      }));
    });

    request.on('error', reject);
    request.end(requestBody);
  });
}

test('qr service normalizes and persists valid text', () => {
  const repository = {
    loadLatest: () => null,
    saveLatest: (result) => { repository.saved = result; }
  };
  const service = createQrService({
    repository,
    clock: () => new Date('2026-08-21T12:00:00.000Z')
  });

  const result = service.register('  demo-qr  ');

  assert.deepEqual(result, {
    text: 'demo-qr',
    timestamp: '2026-08-21T12:00:00.000Z'
  });
  assert.deepEqual(repository.saved, result);
});

test('qr service rejects blank text with HTTP status metadata', () => {
  const service = createQrService({
    repository: { loadLatest: () => null, saveLatest: () => {} }
  });

  assert.throws(() => service.register('  '), {
    message: 'Se requiere un texto QR válido.',
    statusCode: 400
  });
});

test('MVC app preserves QR and health API contracts', async (t) => {
  const fileSystem = createMemoryFileSystem();
  const app = createApp({
    appConfig: {
      port: 3000,
      host: 'localhost',
      environment: 'test',
      appName: 'fullscreen-potente',
      staticDirectory: require('node:path').join(__dirname, '..'),
      sharedDirectory: require('node:path').join(__dirname, '..', 'packages', 'shared'),
      storeDirectory: require('node:path').join(__dirname, '..', 'packages', 'store'),
      adminDirectory: require('node:path').join(__dirname, '..', 'packages', 'admin'),
      packagesDirectory: require('node:path').join(__dirname, '..', 'packages'),
      qrDataFile: 'memory'
    },
    fileSystem,
    clock: () => new Date('2026-08-21T12:00:00.000Z')
  });
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  t.after(() => server.close());

  const health = await request(server, 'GET', '/api/health');
  assert.equal(health.statusCode, 200);
  assert.equal(health.json.status, 'ok');

  const invalidQr = await request(server, 'POST', '/api/qr', { text: ' ' });
  assert.equal(invalidQr.statusCode, 400);
  assert.equal(invalidQr.json.ok, false);

  const createdQr = await request(server, 'POST', '/api/qr', { text: ' demo-qr-123 ' });
  assert.equal(createdQr.statusCode, 200);
  assert.deepEqual(createdQr.json.result, {
    text: 'demo-qr-123',
    timestamp: '2026-08-21T12:00:00.000Z'
  });

  const latestQr = await request(server, 'GET', '/api/qr/latest');
  assert.equal(latestQr.statusCode, 200);
  assert.deepEqual(latestQr.json.result, createdQr.json.result);
  assert.equal(JSON.parse(fileSystem.getContent()).text, 'demo-qr-123');

  const page = await request(server, 'GET', '/');
  assert.equal(page.statusCode, 200);
  assert.match(page.body, /Tienda Lumen/);
});
