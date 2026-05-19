import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateTgInitData, parseTgUser, upsertUser, setCors, getSql } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const initData = (req.headers['authorization'] as string) || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql();
  const user = await upsertUser(parseTgUser(initData)!);
  const tasks = await sql`
    SELECT t.*, (ut.user_id IS NOT NULL) as completed FROM tasks t
    LEFT JOIN user_tasks ut ON t.id=ut.task_id AND ut.user_id=${user.id} ORDER BY t.id`;
  return res.json({ tasks });
}
