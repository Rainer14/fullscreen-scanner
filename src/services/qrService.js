function createQrService({ repository, clock = () => new Date() }) {
  function getLatest() {
    return repository.loadLatest();
  }

  function register(text) {
    if (typeof text !== 'string' || !text.trim()) {
      const error = new Error('Se requiere un texto QR válido.');
      error.statusCode = 400;
      throw error;
    }

    const result = {
      text: text.trim(),
      timestamp: clock().toISOString()
    };

    repository.saveLatest(result);
    return result;
  }

  return { getLatest, register };
}

module.exports = { createQrService };
