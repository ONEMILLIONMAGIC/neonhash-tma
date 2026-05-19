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
  const taskId = Number(req.query.id);
  const { rows: [task] } = await query('SELECT * FROM tasks WHERE id=$1', [taskId]);
  if (!task) return res.status(404).json({ error: 'Not found' });
  const { rows: [done] } = await query('SELECT 1 FROM user_tasks WHERE user_id=$1 AND task_id=$2', [user.id, taskId]);
  if (done && task.task_type !== 'daily') return res.status(400).json({ error: 'Already completed' });
  await query('INSERT INTO user_tasks (user_id,task_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [user.id, taskId]);
  await query('UPDATE users SET balance=balance+$1 WHERE id=$2', [task.reward, user.id]);
  return res.json({ success: true, reward: parseFloat(task.reward), message: `+${task.reward} NEON earned!` });
}
