import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { validateTgInitData, parseTgUser, upsertUser, calcMined } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const initData = req.headers['authorization'] as string || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });
  const tgData = parseTgUser(initData);
  if (!tgData) return res.status(401).json({ error: 'No user' });

  const user = await upsertUser(tgData);
  const mined = calcMined(user.hash_power, new Date(user.last_claim_at), user.offline_limit_hours);

  return res.json({
    hash_power: user.hash_power,
    mining_rate: user.hash_power * 0.001,
    pending_coins: mined,
    balance: parseFloat(user.balance),
  });
}
