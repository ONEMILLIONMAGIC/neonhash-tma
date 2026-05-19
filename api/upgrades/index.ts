import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateTgInitData, parseTgUser, upsertUser, setCors, getSql } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const initData = (req.headers['authorization'] as string) || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql();
  const user = await upsertUser(parseTgUser(initData)!);
  const upgrades = await sql`
    SELECT u.*, (uu.user_id IS NOT NULL) as owned FROM upgrades u
    LEFT JOIN user_upgrades uu ON u.id=uu.upgrade_id AND uu.user_id=${user.id} ORDER BY u.price ASC`;
  return res.json({ upgrades });
}
