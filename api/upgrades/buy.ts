import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_db';
import { validateTgInitData, parseTgUser, upsertUser, setCors } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  const initData = (req.headers['authorization'] as string) || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });
  const tgData = parseTgUser(initData);
  const user = await upsertUser(tgData!);
  const upgradeId = Number(req.query.id);
  const { rows: [upg] } = await query('SELECT * FROM upgrades WHERE id=$1', [upgradeId]);
  if (!upg) return res.status(404).json({ error: 'Not found' });
  const { rows: [owned] } = await query('SELECT 1 FROM user_upgrades WHERE user_id=$1 AND upgrade_id=$2', [user.id, upgradeId]);
  if (owned) return res.status(400).json({ error: 'Already owned' });
  if (parseFloat(user.balance) < parseFloat(upg.price)) return res.status(400).json({ error: 'Insufficient balance' });
  await query('UPDATE users SET balance=balance-$1, hash_power=hash_power+$2, upgrades_owned=upgrades_owned+1 WHERE id=$3', [upg.price, upg.hash_power_bonus, user.id]);
  await query('INSERT INTO user_upgrades (user_id,upgrade_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [user.id, upgradeId]);
  return res.json({ success: true, message: `${upg.name} purchased!`, hash_power_bonus: upg.hash_power_bonus });
}
