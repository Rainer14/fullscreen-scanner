export function normalizeApiProduct(item) {
  const pick = (...keys) => {
    for (const key of keys) {
      const value = item[key];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return undefined;
  };
  const id = pick('_id', 'id') ?? '';
  const name = pick('name', 'nombre', 'title', 'producto', 'descripcion') ?? 'Producto';
  const category = String(pick('category', 'categoria') ?? 'variados').toLowerCase();
  const precioDolarTienda = Number(pick('precioDolarTienda', 'precio_dolar_tienda')) || 0;
  const detal = Number(pick('precioDetal', 'precio_detal', 'precio', 'price', 'detal')) || 0;
  const mayor = Number(pick('precioMayor', 'precio_mayor', 'mayor')) || 0;
  const price = precioDolarTienda || detal || mayor;
  const precioDolar = Number(pick('precioDolar', 'precio_dolar')) || 0;
  const tasaCambio = Number(pick('tasaCambio', 'tasa_cambio')) || 0;
  const margen = Number(pick('margen', 'margen_porcentaje')) || 0;
  const image = pick('image', 'imagen', 'img', 'foto', 'photo', 'url');
  const label = pick('label', 'etiqueta', 'badge') ?? 'Nuevo';
  const marca = pick('marca', 'brand') ?? '';
  const codigo = pick('codigo', 'código', 'code', 'codigoInterno', 'internalCode') ?? '';
  const codigoBarras = pick('codigoBarras', 'codigo_barras', 'barcode', 'ean', 'upc') ?? '';
  const origen = pick('origen', 'origin', 'paisOrigen', 'paísOrigen') ?? '';
  const description = pick('description', 'descripcion', 'detalle', 'detal') ?? '';
  const materials = pick('materials', 'materiales', 'composition') ?? '';
  const care = pick('care', 'cuidado') ?? '';
  const rawColors = pick('colors', 'colores', 'variants') ?? [];
  const colors = Array.isArray(rawColors) ? rawColors.map((c) => typeof c === 'string' ? { name: c, hex: '#c8b69a' } : { name: c?.name || 'Color', hex: c?.hex || '#c8b69a' }) : [];
  const sizes = Array.isArray(pick('sizes', 'tallas', 'talles')) ? pick('sizes', 'tallas', 'talles') : [];
  const rawImages = pick('images', 'fotos', 'gallery', 'imagenes');
  const images = Array.isArray(rawImages) ? rawImages.filter(Boolean) : [];
  return { id, name, category, price, precioDolar, tasaCambio, margen, precioDolarTienda, image: image || '', label, detal, mayor, marca, codigo, codigoBarras, origen, description, materials, care, colors, sizes, images };
}