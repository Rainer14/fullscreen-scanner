// Repositorio de productos sobre SQLite.
// Mapea entre el objeto de producto (camelCase, compatible con normalizeApiProduct)
// y las columnas de la tabla "productos".

const PRODUCT_COLUMNS = [
  'id',
  'descripcion',
  'codigo',
  'categoria',
  'precioDetal',
  'precioMayor',
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
  // Convierte el producto de entrada (acepta varios alias de campos) a una fila de la tabla.
  return {
    descripcion: product.descripcion ?? product.name ?? '',
    codigo: product.codigo ?? '',
    categoria: (product.categoria ?? product.category ?? 'variados').toString(),
    precioDetal: Number(product.precioDetal ?? product.detal ?? product.price ?? 0) || 0,
    precioMayor: Number(product.precioMayor ?? product.mayor ?? 0) || 0,
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
  // Convierte una fila de la tabla al objeto de producto que consume la tienda/admin.
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
    price: row.precioDetal || row.precioMayor,
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

function initSchema(sqliteDb) {
  // Crea la tabla "productos" si aún no existe al arrancar.
  sqliteDb.serialize(() => {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descripcion TEXT NOT NULL,
        codigo TEXT NOT NULL,
        categoria TEXT NOT NULL DEFAULT 'variados',
        precioDetal REAL NOT NULL DEFAULT 0,
        precioMayor REAL NOT NULL DEFAULT 0,
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
    `);
  });
}

function createProductRepository({ sqliteDb }) {
  // Expone el CRUD (leer, crear, modificar, eliminar) sobre la tabla "productos".
  initSchema(sqliteDb);

  return {
    // Devuelve todos los productos (lectura pública para la tienda).
    async list() {
      return new Promise((resolve, reject) => {
        sqliteDb.all('SELECT * FROM productos ORDER BY id DESC', (err, rows) => {
          if (err) return reject(err);
          resolve((rows || []).map(fromRow));
        });
      });
    },

    // Devuelve un producto por su id.
    async getById(id) {
      return new Promise((resolve, reject) => {
        sqliteDb.get('SELECT * FROM productos WHERE id = ?', [id], (err, row) => {
          if (err) return reject(err);
          resolve(fromRow(row));
        });
      });
    },

    // Inserta un nuevo producto y devuelve la fila creada.
    async create(product) {
      const row = toRow(product);
      return new Promise((resolve, reject) => {
        sqliteDb.run(
          `INSERT INTO productos
           (descripcion, codigo, categoria, precioDetal, precioMayor, marca, origen, codigoBarras,
            imagen, etiqueta, detalle, materiales, cuidado, colores, tallas, galeria)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [row.descripcion, row.codigo, row.categoria, row.precioDetal, row.precioMayor, row.marca,
           row.origen, row.codigoBarras, row.imagen, row.etiqueta, row.detalle, row.materiales,
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

    // Actualiza un producto existente y devuelve la fila modificada.
    async update(id, product) {
      const row = toRow(product);
      return new Promise((resolve, reject) => {
        sqliteDb.run(
          `UPDATE productos SET
             descripcion = ?, codigo = ?, categoria = ?, precioDetal = ?, precioMayor = ?,
             marca = ?, origen = ?, codigoBarras = ?, imagen = ?, etiqueta = ?,
             detalle = ?, materiales = ?, cuidado = ?, colores = ?, tallas = ?, galeria = ?
           WHERE id = ?`,
          [row.descripcion, row.codigo, row.categoria, row.precioDetal, row.precioMayor, row.marca,
           row.origen, row.codigoBarras, row.imagen, row.etiqueta, row.detalle, row.materiales,
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

    // Elimina un producto por su id y reporta si se borró alguna fila.
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
