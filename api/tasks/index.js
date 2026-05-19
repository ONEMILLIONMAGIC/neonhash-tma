const { validateTgInitData, parseTgUser, upsertUser, setCors, getSql } = require('../_utils');
module.exports = async function(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const initData = req.headers['authorization'] || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });
  const sql = getSql();
  const user = await upsertUser(parseTgUser(initData));
  const tasks = await sql`SELECT t.*, (ut.user_id IS NOT NULL) as completed FROM tasks t LEFT JOIN user_tasks ut ON t.id=ut.task_id AND ut.user_id=${user.id} ORDER BY t.id`;
  return res.json({ tasks });
};
