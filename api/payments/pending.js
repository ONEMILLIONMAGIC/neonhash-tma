import { validateTgInitData, parseTgUser, upsertUser, setCors, getSql } from '../_utils.js';
export default async function(req, res) {
  setCors(res); if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  const initData = req.headers['authorization'] || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql(); const user = await upsertUser(parseTgUser(initData));
  const { package_id, wallet_address, amount_ton, hash_power } = req.body || {};
  await sql`INSERT INTO payments (user_id,package_id,wallet_address,amount_ton,hash_power) VALUES (${user.id},${package_id},${wallet_address},${amount_ton},${hash_power})`;
  return res.json({ success: true });
}
