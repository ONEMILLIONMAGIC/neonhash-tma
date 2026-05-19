import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateTgInitData, parseTgUser, upsertUser, setCors, getSql } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  const initData = (req.headers['authorization'] as string) || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql();
  const user = await upsertUser(parseTgUser(initData)!);
  const { package_id, wallet_address, amount_ton, hash_power } = req.body as Record<string,unknown>;
  await sql`INSERT INTO payments (user_id,package_id,wallet_address,amount_ton,hash_power)
    VALUES (${user.id},${package_id as string},${wallet_address as string},${amount_ton as number},${hash_power as number})`;
  return res.json({ success: true });
}
