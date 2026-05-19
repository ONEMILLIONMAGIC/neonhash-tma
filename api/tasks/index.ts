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
  const user = await upsertUser(tgData!);

  const { rows } = await sql`
    SELECT t.*, (ut.user_id IS NOT NULL) as completed
    FROM tasks t
    LEFT JOIN user_tasks ut ON t.id=ut.task_id AND ut.user_id=${user.id}
    ORDER BY t.id ASC
  `;
  return res.json({ tasks: rows });
}
