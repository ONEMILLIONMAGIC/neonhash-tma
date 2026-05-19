import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { validateTgInitData, parseTgUser, upsertUser, calcMined } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const initData = req.headers['authorization'] as string || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });
  const tgData = parseTgUser(initData);
  if (!tgData) return res.status(401).json({ error: 'No user' });

  const user = await upsertUser(tgData);
  const mined = calcMined(user.hash_power, new Date(user.last_claim_at), user.offline_limit_hours);

  if (mined < 0.0001) return res.json({ claimed: 0, balance: parseFloat(user.balance), message: 'Nothing to claim yet' });

  await sql`
    UPDATE users
    SET balance = balance + ${mined},
        total_mined = total_mined + ${mined},
        last_claim_at = NOW()
    WHERE id = ${user.id}
  `;
  const { rows } = await sql`SELECT balance FROM users WHERE id = ${user.id}`;

  return res.json({ claimed: mined, balance: parseFloat(rows[0].balance), message: `Claimed ${mined.toFixed(4)} NEON!` });
}
