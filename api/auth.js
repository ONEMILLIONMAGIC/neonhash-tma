const { validateTgInitData, parseTgUser, upsertUser, calcMined, getLevel, setCors } = require('./_utils');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  const initData = req.headers['authorization'] || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Invalid initData' });
  const tgData = parseTgUser(initData);
  if (!tgData) return res.status(401).json({ error: 'No user' });
  const user = await upsertUser(tgData);
  const mined = calcMined(user.hash_power, user.last_claim_at, user.offline_limit_hours);
  return res.json({ user: {
    id: Number(user.id), username: user.username, first_name: user.first_name,
    hash_power: user.hash_power, balance: parseFloat(user.balance),
    level: getLevel(parseFloat(user.balance)), energy: user.energy, max_energy: user.max_energy,
    referral_code: user.referral_code, mining_rate: user.hash_power * 0.001,
    pending_coins: mined, offline_limit_hours: user.offline_limit_hours,
    total_mined: parseFloat(user.total_mined), upgrades_owned: user.upgrades_owned, referrals_count: 0,
  }});
};
