import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { validateTgInitData, parseTgUser, upsertUser } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const initData = req.headers['authorization'] as string || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });
  const tgData = parseTgUser(initData);
  if (!tgData) return res.status(401).json({ error: 'No user' });

  const upgradeId = Number(req.query.id);
  const user = await upsertUser(tgData);

  const { rows: [upg] } = await sql`SELECT * FROM upgrades WHERE id = ${upgradeId}`;
  if (!upg) return res.status(404).json({ error: 'Not found' });

  const { rows: [owned] } = await sql`SELECT 1 FROM user_upgrades WHERE user_id=${user.id} AND upgrade_id=${upgradeId}`;
  if (owned) return res.status(400).json({ error: 'Already owned' });
  if (parseFloat(user.balance) < parseFloat(upg.price)) return res.status(400).json({ error: 'Insufficient balance' });

  await sql`UPDATE users SET balance=balance-${upg.price}, hash_power=hash_power+${upg.hash_power_bonus}, upgrades_owned=upgrades_owned+1 WHERE id=${user.id}`;
  await sql`INSERT INTO user_upgrades (user_id,upgrade_id) VALUES (${user.id},${upgradeId})`;

  return res.json({ success: true, message: `${upg.name} purchased!`, hash_power_bonus: upg.hash_power_bonus });
}
