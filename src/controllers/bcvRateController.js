async function getBcvRate() {
  const response = await fetch('https://ve.dolarapi.com/v1/dolares');
  if (!response.ok) {
    const error = new Error('No se pudo obtener la tasa del BCV');
    error.statusCode = 503;
    throw error;
  }
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    const error = new Error('Formato inesperado de la tasa del BCV');
    error.statusCode = 503;
    throw error;
  }
  const entry = data[0];
  const tasa = Number(entry.promedio);
  if (isNaN(tasa) || tasa <= 0) {
    const error = new Error('Tasa del BCV no válida');
    error.statusCode = 503;
    throw error;
  }
  return { tasa, fuente: entry.fuente, fechaActualizacion: entry.fechaActualizacion };
}

function createBcvRateController() {
  return {
    async getRate(req, res) {
      try {
        const rate = await getBcvRate();
        res.json({ ok: true, data: rate });
      } catch (error) {
        res.statusCode = error.statusCode || 500;
        res.json({ ok: false, message: error.message });
      }
    }
  };
}

module.exports = { createBcvRateController };