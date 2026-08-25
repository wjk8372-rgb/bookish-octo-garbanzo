const kuaidi = require('../kuaidi');

module.exports = async function handler(req, res) {
  return res.status(200).json({
    ok: true, time: new Date().toISOString(),
    kuaidiMockMode: kuaidi.isMockMode(),
  });
};
