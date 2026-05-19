import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateTgInitData, parseTgUser, upsertUser, calcMined, setCors } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const initData = (req.headers['authorization'] as string) || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });
  const tgData = parseTgUser(initData);
  const user = await upsertUser(tgData!);
  const mined = calcMined(user.hash_power, user.last_claim_at, user.offline_limit_hours);
  return res.json({ hash_power: user.hash_power, mining_rate: user.hash_power * 0.001, pending_coins: mined, balance: parseFloat(user.balance) });
}
