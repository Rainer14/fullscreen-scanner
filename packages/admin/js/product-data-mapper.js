const fieldAliases = {
  description: ['description', 'descripcion', 'descripción', 'name', 'nombre', 'nombreProducto', 'producto'],
  codigo: ['internalCode', 'codigoInterno', 'códigoInterno'],
  categoria: ['categoria', 'categoría', 'category'],
  precioDetal: ['detal', 'precioDetal', 'precio_detal', 'precio detal', 'precio', 'retailPrice', 'retail_price', 'price'],
  precioMayor: ['mayor', 'precioMayor', 'precio_mayor', 'precio mayor', 'wholesalePrice', 'wholesale_price'],
  tasaCambio: ['tasaCambio', 'tasa_cambio', 'tasa', 'bcv', 'dolar', 'tasaBCV', 'bcvRate'],
  margen: ['margen', 'margen_porcentaje', 'margenPorcentaje', 'margin', 'profitMargin'],
  precioDolar: ['precioDolar', 'precio_dolar', 'precioDolares'],
  precioDolarTienda: ['precioDolarTienda', 'precio_dolar_tienda', 'tiendaDolar'],
  marca: ['marca', 'brand'],
  origen: ['origen', 'origin', 'paisOrigen', 'paísOrigen'],
  codigoBarras: ['barcode', 'codebar', 'codigo', 'código', 'codigoBarras', 'códigoBarras', 'codigo_de_barras', 'ean', 'upc']
};

function normalizeKey(key) {
  return key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function findValue(data, aliases) {
  const normalizedData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [normalizeKey(key), value])
  );
  for (const alias of aliases) {
    const value = normalizedData[normalizeKey(alias)];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

export function normalizeProductData(response) {
  let data = response;
  for (const key of ['data', 'result', 'product', 'producto', 'extractedData', 'extracted', 'fields', 'campos']) {
    if (data && typeof data === 'object' && data[key] && typeof data[key] === 'object') {
      data = data[key];
    }
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};

  return Object.fromEntries(
    Object.entries(fieldAliases)
      .map(([field, aliases]) => [field, findValue(data, aliases)])
      .filter(([, value]) => value !== undefined)
      .map(([field, value]) => [field, String(value)])
  );
}

const fieldPrefix = 'product-';

export function fillProductForm(response, documentObject = document) {
  const productData = normalizeProductData(response);
  Object.entries(productData).forEach(([field, value]) => {
    const input = documentObject.getElementById(`${fieldPrefix}${field}`);
    if (input) input.value = value;
  });
  return productData;
}

export function fillProductFormFromLegacy(response, documentObject = document) {
  const productData = normalizeProductData(response);
  Object.entries(productData).forEach(([field, value]) => {
    const input = documentObject.getElementById(field);
    if (input) input.value = value;
  });
  return productData;
}