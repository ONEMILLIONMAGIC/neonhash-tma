import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_db';
import { validateTgInitData, parseTgUser, upsertUser, setCors } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const initData = (req.headers['authorization'] as string) || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });
  const tgData = parseTgUser(initData);
  const user = await upsertUser(tgData!);
  const { rows } = await query(
    `SELECT t.*, (ut.user_id IS NOT NULL) as completed FROM tasks t
     LEFT JOIN user_tasks ut ON t.id=ut.task_id AND ut.user_id=$1 ORDER BY t.id`,
    [user.id]
  );
  return res.json({ tasks: rows });
}
