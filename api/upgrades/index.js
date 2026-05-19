import { validateTgInitData, parseTgUser, upsertUser, setCors, getSql } from '../_utils.js';
export default async function(req, res) {
  setCors(res); if (req.method === 'OPTIONS') return res.status(200).end();
  const initData = req.headers['authorization'] || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql(); const user = await upsertUser(parseTgUser(initData));
  const upgrades = await sql`SELECT u.*, (uu.user_id IS NOT NULL) as owned FROM upgrades u LEFT JOIN user_upgrades uu ON u.id=uu.upgrade_id AND uu.user_id=${user.id} ORDER BY u.price ASC`;
  return res.json({ upgrades });
}
