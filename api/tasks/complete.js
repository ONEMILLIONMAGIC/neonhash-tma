const { validateTgInitData, parseTgUser, upsertUser, setCors, getSql } = require('../_utils');
module.exports = async function(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  const initData = req.headers['authorization'] || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql();
  const user = await upsertUser(parseTgUser(initData));
  const taskId = Number(req.query.id);
  const [task] = await sql`SELECT * FROM tasks WHERE id=${taskId}`;
  if (!task) return res.status(404).json({ error: 'Not found' });
  const [done] = await sql`SELECT 1 FROM user_tasks WHERE user_id=${user.id} AND task_id=${taskId}`;
  if (done && task.task_type !== 'daily') return res.status(400).json({ error: 'Already completed' });
  await sql`INSERT INTO user_tasks (user_id,task_id) VALUES (${user.id},${taskId}) ON CONFLICT DO NOTHING`;
  await sql`UPDATE users SET balance=balance+${task.reward} WHERE id=${user.id}`;
  return res.json({ success: true, reward: parseFloat(task.reward) });
};
