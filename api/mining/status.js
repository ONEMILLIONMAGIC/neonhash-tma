const { validateTgInitData, parseTgUser, upsertUser, calcMined, setCors } = require('../_utils');
module.exports = async function(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const initData = req.headers['authorization'] || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });
  const user = await upsertUser(parseTgUser(initData));
  const mined = calcMined(user.hash_power, user.last_claim_at, user.offline_limit_hours);
  return res.json({ hash_power: user.hash_power, mining_rate: user.hash_power * 0.001, pending_coins: mined, balance: parseFloat(user.balance) });
};
