function createHealthController({ clock = () => new Date() }) {
  return function getHealth(req, res) {
    res.json({
      status: 'ok',
      message: 'API funcionando',
      timestamp: clock().toISOString()
    });
  };
}

module.exports = { createHealthController };
