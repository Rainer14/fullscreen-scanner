// Conexión a SQLite: abre la base (creando el directorio si hace falta) y la cierra.
// Acepta una ruta de archivo o ":memory:" para bases en memoria (tests).
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

function openDatabase(dbPath) {
  const isMemory = dbPath === ':memory:' || dbPath.startsWith(':');
  const resolved = isMemory ? ':memory:' : path.resolve(dbPath);
  if (!isMemory && resolved !== ':memory:') {
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
  }
  return new sqlite3.Database(resolved);
}

function closeDatabase(sqliteDb) {
  if (!sqliteDb) return Promise.resolve();
  return new Promise((resolve, reject) => {
    sqliteDb.close((err) => (err ? reject(err) : resolve()));
  });
}

module.exports = { openDatabase, closeDatabase };
