const { validateTgInitData, parseTgUser, upsertUser, setCors, getSql } = require('../_utils');
module.exports = async function(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  const initData = req.headers['authorization'] || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql();
  const user = await upsertUser(parseTgUser(initData));
  const upgradeId = Number(req.query.id);
  const [upg] = await sql`SELECT * FROM upgrades WHERE id=${upgradeId}`;
  if (!upg) return res.status(404).json({ error: 'Not found' });
  const [owned] = await sql`SELECT 1 FROM user_upgrades WHERE user_id=${user.id} AND upgrade_id=${upgradeId}`;
  if (owned) return res.status(400).json({ error: 'Already owned' });
  if (parseFloat(user.balance) < parseFloat(upg.price)) return res.status(400).json({ error: 'Insufficient balance' });
  await sql`UPDATE users SET balance=balance-${upg.price}, hash_power=hash_power+${upg.hash_power_bonus}, upgrades_owned=upgrades_owned+1 WHERE id=${user.id}`;
  await sql`INSERT INTO user_upgrades (user_id,upgrade_id) VALUES (${user.id},${upgradeId}) ON CONFLICT DO NOTHING`;
  return res.json({ success: true, message: `${upg.name} purchased!`, hash_power_bonus: upg.hash_power_bonus });
};
