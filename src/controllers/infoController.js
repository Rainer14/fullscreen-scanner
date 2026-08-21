function createInfoController({ appConfig }) {
  return function getInfo(req, res) {
    res.json({
      app: appConfig.appName,
      environment: appConfig.environment,
      port: appConfig.port,
      url: `http://${appConfig.host}:${appConfig.port}`
    });
  };
}

module.exports = { createInfoController };
