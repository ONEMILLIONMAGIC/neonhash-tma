import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { validateTgInitData, parseTgUser, upsertUser } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const initData = req.headers['authorization'] as string || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });
  const tgData = parseTgUser(initData);
  if (!tgData) return res.status(401).json({ error: 'No user' });

  const user = await upsertUser(tgData);
  const { rows } = await sql`
    SELECT u.*, (uu.user_id IS NOT NULL) as owned
    FROM upgrades u
    LEFT JOIN user_upgrades uu ON u.id = uu.upgrade_id AND uu.user_id = ${user.id}
    ORDER BY u.price ASC
  `;
  return res.json({ upgrades: rows });
}
