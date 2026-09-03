const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const sqlite3 = require('sqlite3');
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

function request(server, method, requestPath, body, extraHeaders) {
  return new Promise((resolve, reject) => {
    const requestBody = body ? JSON.stringify(body) : '';
    const headers = {};
    if (body) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(requestBody);
    }
    if (extraHeaders) Object.assign(headers, extraHeaders);
    const request = http.request({
      host: '127.0.0.1',
      port: server.address().port,
      method,
      path: requestPath,
      headers
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
  const db = new sqlite3.Database(':memory:');
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
      qrDataFile: 'memory',
      dbFile: ':memory:',
      adminToken: 'test-token'
    },
    fileSystem,
    clock: () => new Date('2026-08-21T12:00:00.000Z'),
    sqliteDb: db
  });
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  t.after(() => server.close());
  t.after(() => db.close());

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

test('product API separates read (public) and write (admin-token protected) operations', async (t) => {
  const db = new sqlite3.Database(':memory:');
  const app = createApp({
    appConfig: {
      port: 3000,
      host: 'localhost',
      environment: 'test',
      appName: 'fullscreen-potente',
      staticDirectory: require('node:path').join(__dirname, '..'),
      packagesDirectory: require('node:path').join(__dirname, '..', 'packages'),
      qrDataFile: 'memory',
      dbFile: ':memory:',
      adminToken: 'secret-123'
    },
    clock: () => new Date('2026-08-21T12:00:00.000Z'),
    sqliteDb: db
  });
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  t.after(() => server.close());
  t.after(() => db.close());

  const product = {
    descripcion: 'Cuaderno A5',
    codigo: 'CUAD-A5',
    categoria: 'escolar',
    precioDetal: 120,
    precioMayor: 90,
    marca: 'Lumen',
    origen: 'AR',
    codigoBarras: '779000000001'
  };

  // Lectura pública sin token: funciona
  const empty = await request(server, 'GET', '/api/products');
  assert.equal(empty.statusCode, 200);
  assert.deepEqual(empty.json.data, []);

  // Escritura SIN token: 401
  const denied = await request(server, 'POST', '/api/products', product);
  assert.equal(denied.statusCode, 401);

  const deniedDelete = await request(server, 'DELETE', '/api/products/1');
  assert.equal(deniedDelete.statusCode, 401);

  // Validación de token
  const authCheckBad = await request(server, 'GET', '/api/auth/check');
  assert.equal(authCheckBad.statusCode, 401);
  const authCheckOk = await request(server, 'GET', '/api/auth/check', null, { 'x-admin-token': 'secret-123' });
  assert.equal(authCheckOk.statusCode, 200);

  // Escritura CON token: 201
  const created = await request(server, 'POST', '/api/products', product, { 'x-admin-token': 'secret-123' });
  assert.equal(created.statusCode, 201);
  assert.equal(created.json.data.name, 'Cuaderno A5');
  const id = created.json.data.id;
  assert.ok(id > 0);

  // Lectura pública devuelve el producto creado
  const listed = await request(server, 'GET', '/api/products');
  assert.equal(listed.statusCode, 200);
  assert.equal(listed.json.data.length, 1);
  assert.equal(listed.json.data[0].price, 120);

  // GET por id público
  const single = await request(server, 'GET', `/api/products/${id}`);
  assert.equal(single.statusCode, 200);
  assert.equal(single.json.data.codigo, 'CUAD-A5');

  // PUT con token: modifica
  const updated = await request(server, 'PUT', `/api/products/${id}`, { ...product, precioDetal: 150 }, { 'x-admin-token': 'secret-123' });
  assert.equal(updated.statusCode, 200);
  assert.equal(updated.json.data.precioDetal, 150);

  // DELETE con token: elimina
  const deleted = await request(server, 'DELETE', `/api/products/${id}`, null, { 'x-admin-token': 'secret-123' });
  assert.equal(deleted.statusCode, 200);
  assert.equal(deleted.json.deleted, true);

  const afterDelete = await request(server, 'GET', '/api/products');
  assert.deepEqual(afterDelete.json.data, []);
});
