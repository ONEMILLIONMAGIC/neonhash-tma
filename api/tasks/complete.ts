import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { validateTgInitData, parseTgUser, upsertUser } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const initData = req.headers['authorization'] as string || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });
  const tgData = parseTgUser(initData);
  const user = await upsertUser(tgData!);
  const taskId = Number(req.query.id);

  const { rows: [task] } = await sql`SELECT * FROM tasks WHERE id=${taskId}`;
  if (!task) return res.status(404).json({ error: 'Not found' });

  const { rows: [done] } = await sql`SELECT 1 FROM user_tasks WHERE user_id=${user.id} AND task_id=${taskId}`;
  if (done && task.task_type !== 'daily') return res.status(400).json({ error: 'Already completed' });

  await sql`INSERT INTO user_tasks (user_id,task_id) VALUES (${user.id},${taskId}) ON CONFLICT DO NOTHING`;
  await sql`UPDATE users SET balance=balance+${task.reward} WHERE id=${user.id}`;

  return res.json({ success: true, reward: parseFloat(task.reward), message: `+${task.reward} NEON earned!` });
}
