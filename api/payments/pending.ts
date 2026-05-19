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
  const { package_id, wallet_address, amount_ton, hash_power } = req.body as Record<string,unknown>;
  await query(
    'INSERT INTO payments (user_id,package_id,wallet_address,amount_ton,hash_power) VALUES ($1,$2,$3,$4,$5)',
    [user.id, package_id, wallet_address, amount_ton, hash_power]
  );
  return res.json({ success: true, message: 'Payment registered!' });
}
