function createProductService({ repository }) {
  function validateCreate(product) {
    const name = String(product.descripcion ?? product.name ?? '').trim();
    if (!name) {
      const error = new Error('La descripción del producto es obligatoria.');
      error.statusCode = 400;
      throw error;
    }

    const tasaRaw = product.tasaCambio;
    if (tasaRaw !== undefined && tasaRaw !== null && tasaRaw !== '' && !(Number(tasaRaw) > 0)) {
      const error = new Error('La tasa de cambio del BCV debe ser mayor a 0.');
      error.statusCode = 400;
      throw error;
    }

    const margenRaw = product.margen;
    if (margenRaw !== undefined && margenRaw !== null && margenRaw !== '' && !(Number(margenRaw) >= 0)) {
      const error = new Error('El margen de ganancia debe ser un número mayor o igual a 0.');
      error.statusCode = 400;
      throw error;
    }
  }

  return {
    async list() {
      return repository.list();
    },

    async getById(id) {
      const product = await repository.getById(id);
      return product || null;
    },

    async create(product) {
      validateCreate(product);
      return repository.create(product);
    },

    async update(id, product) {
      validateCreate(product);
      const existing = await repository.getById(id);
      if (!existing) {
        const error = new Error('Producto no encontrado.');
        error.statusCode = 404;
        throw error;
      }
      return repository.update(id, product);
    },

    async delete(id) {
      const result = await repository.delete(id);
      if (!result.deleted) {
        const error = new Error('Producto no encontrado.');
        error.statusCode = 404;
        throw error;
      }
      return result;
    }
  };
}

module.exports = { createProductService };