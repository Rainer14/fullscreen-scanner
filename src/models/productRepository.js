const PRODUCT_COLUMNS = [
  'id',
  'descripcion',
  'codigo',
  'categoria',
  'precioDetal',
  'precioMayor',
  'precioDolar',
  'tasaCambio',
  'margen',
  'precioDolarTienda',
  'marca',
  'origen',
  'codigoBarras',
  'imagen',
  'etiqueta',
  'detalle',
  'materiales',
  'cuidado',
  'colores',
  'tallas',
  'galeria',
  'created_at'
];

function toRow(product) {
  const precioDetal = Number(product.precioDetal ?? product.detal ?? product.price ?? 0) || 0;
  const tasaCambio = Number(product.tasaCambio) || 0;
  const precioDolar = tasaCambio > 0 ? precioDetal / tasaCambio : 0;
  const margen = Number(product.margen) || 0;
  const precioDolarTienda = precioDolar * (1 + margen / 100);

  return {
    descripcion: product.descripcion ?? product.name ?? '',
    codigo: product.codigo ?? '',
    categoria: (product.categoria ?? product.category ?? 'variados').toString(),
    precioDetal,
    precioMayor: Number(product.precioMayor ?? product.mayor ?? 0) || 0,
    precioDolar,
    tasaCambio,
    margen,
    precioDolarTienda,
    marca: product.marca ?? '',
    origen: product.origen ?? '',
    codigoBarras: product.codigoBarras ?? product.codigo_barras ?? '',
    imagen: product.imagen ?? product.image ?? '',
    etiqueta: product.etiqueta ?? product.label ?? 'Nuevo',
    detalle: product.detalle ?? product.description ?? '',
    materiales: product.materiales ?? product.materials ?? '',
    cuidado: product.cuidado ?? product.care ?? '',
    colores: JSON.stringify(product.colores ?? []),
    tallas: JSON.stringify(product.tallas ?? product.sizes ?? []),
    galeria: JSON.stringify(product.galeria ?? product.images ?? [])
  };
}

function parseJson(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed === null ? fallback : parsed;
  } catch (e) {
    return fallback;
  }
}

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.descripcion,
    descripcion: row.descripcion,
    codigo: row.codigo,
    category: (row.categoria || 'variados').toLowerCase(),
    categoria: row.categoria,
    precioDetal: row.precioDetal,
    precioMayor: row.precioMayor,
    precioDolar: row.precioDolar,
    tasaCambio: row.tasaCambio,
    margen: row.margen,
    precioDolarTienda: row.precioDolarTienda,
    price: row.precioDolarTienda || row.precioDetal || row.precioMayor,
    detal: row.precioDetal,
    mayor: row.precioMayor,
    marca: row.marca || '',
    origen: row.origen || '',
    codigoBarras: row.codigoBarras || '',
    image: row.imagen || '',
    label: row.etiqueta || 'Nuevo',
    description: row.detalle || '',
    materials: row.materiales || '',
    care: row.cuidado || '',
    colors: parseJson(row.colores, []),
    sizes: parseJson(row.tallas, []),
    images: parseJson(row.galeria, [])
  };
}

// Columnas que pueden faltar en bases creadas antes de que se añadiera el
// esquema de precios con tasa BCV. Se aplican como migración ALTER TABLE.
const MIGRATION_COLUMNS = [
  { name: 'precioDolar', definition: 'REAL NOT NULL DEFAULT 0' },
  { name: 'tasaCambio', definition: 'REAL NOT NULL DEFAULT 0' },
  { name: 'margen', definition: 'REAL NOT NULL DEFAULT 0' },
  { name: 'precioDolarTienda', definition: 'REAL NOT NULL DEFAULT 0' }
];

function initSchema(sqliteDb) {
  sqliteDb.serialize(() => {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descripcion TEXT NOT NULL,
        codigo TEXT NOT NULL,
        categoria TEXT NOT NULL DEFAULT 'variados',
        precioDetal REAL NOT NULL DEFAULT 0,
        precioMayor REAL NOT NULL DEFAULT 0,
        precioDolar REAL NOT NULL DEFAULT 0,
        tasaCambio REAL NOT NULL DEFAULT 0,
        margen REAL NOT NULL DEFAULT 0,
        precioDolarTienda REAL NOT NULL DEFAULT 0,
        marca TEXT,
        origen TEXT,
        codigoBarras TEXT,
        imagen TEXT,
        etiqueta TEXT DEFAULT 'Nuevo',
        detalle TEXT,
        materiales TEXT,
        cuidado TEXT,
        colores TEXT,
        tallas TEXT,
        galeria TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `, (err) => {
      if (err) return;
      // Migración: agrega las columnas nuevas si la tabla ya existía con un
      // esquema anterior (CREATE TABLE IF NOT EXISTS no altera tablas creadas).
      sqliteDb.all('PRAGMA table_info(productos)', (pragmaErr, rows) => {
        if (pragmaErr) return;
        const existing = new Set((rows || []).map((row) => row.name));
        MIGRATION_COLUMNS.forEach(({ name, definition }) => {
          if (!existing.has(name)) {
            sqliteDb.run(`ALTER TABLE productos ADD COLUMN ${name} ${definition}`, () => {});
          }
        });
      });
    });
  });
}

function createProductRepository({ sqliteDb }) {
  initSchema(sqliteDb);

  return {
    async list() {
      return new Promise((resolve, reject) => {
        sqliteDb.all('SELECT * FROM productos ORDER BY id DESC', (err, rows) => {
          if (err) return reject(err);
          resolve((rows || []).map(fromRow));
        });
      });
    },

    async getById(id) {
      return new Promise((resolve, reject) => {
        sqliteDb.get('SELECT * FROM productos WHERE id = ?', [id], (err, row) => {
          if (err) return reject(err);
          resolve(fromRow(row));
        });
      });
    },

    async create(product) {
      const row = toRow(product);
      return new Promise((resolve, reject) => {
        sqliteDb.run(
          `INSERT INTO productos
           (descripcion, codigo, categoria, precioDetal, precioMayor, precioDolar, tasaCambio, margen, precioDolarTienda,
            marca, origen, codigoBarras, imagen, etiqueta, detalle, materiales, cuidado, colores, tallas, galeria)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [row.descripcion, row.codigo, row.categoria, row.precioDetal, row.precioMayor, row.precioDolar, row.tasaCambio, row.margen, row.precioDolarTienda,
           row.marca, row.origen, row.codigoBarras, row.imagen, row.etiqueta, row.detalle, row.materiales,
           row.cuidado, row.colores, row.tallas, row.galeria],
          function (err) {
            if (err) return reject(err);
            sqliteDb.get('SELECT * FROM productos WHERE id = ?', [this.lastID], (getErr, inserted) => {
              if (getErr) return reject(getErr);
              resolve(fromRow(inserted));
            });
          }
        );
      });
    },

    async update(id, product) {
      const row = toRow(product);
      return new Promise((resolve, reject) => {
        sqliteDb.run(
          `UPDATE productos SET
             descripcion = ?, codigo = ?, categoria = ?, precioDetal = ?, precioMayor = ?, precioDolar = ?, tasaCambio = ?, margen = ?, precioDolarTienda = ?,
             marca = ?, origen = ?, codigoBarras = ?, imagen = ?, etiqueta = ?,
             detalle = ?, materiales = ?, cuidado = ?, colores = ?, tallas = ?, galeria = ?
           WHERE id = ?`,
          [row.descripcion, row.codigo, row.categoria, row.precioDetal, row.precioMayor, row.precioDolar, row.tasaCambio, row.margen, row.precioDolarTienda,
           row.marca, row.origen, row.codigoBarras, row.imagen, row.etiqueta, row.detalle, row.materiales,
           row.cuidado, row.colores, row.tallas, row.galeria, id],
          (err) => {
            if (err) return reject(err);
            sqliteDb.get('SELECT * FROM productos WHERE id = ?', [id], (getErr, updated) => {
              if (getErr) return reject(getErr);
              resolve(fromRow(updated));
            });
          }
        );
      });
    },

    async delete(id) {
      return new Promise((resolve, reject) => {
        sqliteDb.run('DELETE FROM productos WHERE id = ?', [id], function (err) {
          if (err) return reject(err);
          resolve({ deleted: this.changes > 0 });
        });
      });
    }
  };
}

module.exports = { createProductRepository, PRODUCT_COLUMNS };