import { validateTgInitData, parseTgUser, upsertUser, setCors, getSql } from '../_utils.js';

// Проверки для каждого типа задания
async function verifyTask(sql, task, user) {
  const title = task.title.toLowerCase();

  if (task.task_type === 'daily') return { ok: true }; // daily всегда можно выполнить раз в день

  // Уровень
  if (title.includes('level') || title.includes('уровень')) {
    const match = task.title.match(/(\d+)/);
    const required = match ? Number(match[1]) : 5;
    const level = calcLevel(parseFloat(user.balance));
    if (level < required) return { ok: false, reason: `Need level ${required}, you are level ${level}` };
    return { ok: true };
  }

  // Майнинг milestone
  if (title.includes('mine') || title.includes('1,000') || title.includes('10,000')) {
    const match = task.title.match(/([\d,]+)/);
    const required = match ? Number(match[1].replace(/,/g, '')) : 1000;
    if (parseFloat(user.total_mined) < required) return { ok: false, reason: `Need ${required} NEON mined, you have ${parseFloat(user.total_mined).toFixed(0)}` };
    return { ok: true };
  }

  // Покупка апгрейда
  if (title.includes('purchase') || title.includes('buy') || title.includes('shop')) {
    if (Number(user.upgrades_owned) < 1) return { ok: false, reason: 'Buy at least 1 upgrade first' };
    return { ok: true };
  }

  // Клейм наград
  if (title.includes('claim')) {
    if (parseFloat(user.total_mined) < 0.001) return { ok: false, reason: 'Claim your mined NEON first' };
    return { ok: true };
  }

  // Реферал
  if (task.task_type === 'referral') {
    const match = task.title.match(/(\d+)/);
    const required = match ? Number(match[1]) : 1;
    if (Number(user.referrals_count) < required) return { ok: false, reason: `Need ${required} referral(s), you have ${user.referrals_count}` };
    return { ok: true };
  }

  return { ok: true };
}

function calcLevel(balance) {
  if (balance < 1000) return 1;
  if (balance < 5000) return 2;
  if (balance < 15000) return 3;
  if (balance < 50000) return 4;
  if (balance < 150000) return 5;
  return Math.min(10, Math.floor(balance / 100000) + 5);
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const initData = req.headers['authorization'] || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });

  const sql = getSql();
  const tgData = parseTgUser(initData);
  const user = await upsertUser(tgData);
  const taskId = Number(req.query.id);

  const [task] = await sql`SELECT * FROM tasks WHERE id=${taskId}`;
  if (!task) return res.status(404).json({ error: 'Task not found' });

  // Проверка — уже выполнено?
  const [done] = await sql`SELECT completed_at FROM user_tasks WHERE user_id=${user.id} AND task_id=${taskId}`;
  if (done) {
    if (task.task_type !== 'daily') return res.status(400).json({ error: 'Already completed' });
    // Daily — проверяем что не сегодня
    const lastDone = new Date(done.completed_at);
    const today = new Date();
    if (lastDone.toDateString() === today.toDateString()) {
      return res.status(400).json({ error: 'Already completed today, come back tomorrow!' });
    }
  }

  // Реальная проверка условий
  const check = await verifyTask(sql, task, user);
  if (!check.ok) return res.status(400).json({ error: check.reason });

  // Начисляем награду
  if (done) {
    await sql`UPDATE user_tasks SET completed_at=NOW() WHERE user_id=${user.id} AND task_id=${taskId}`;
  } else {
    await sql`INSERT INTO user_tasks (user_id, task_id) VALUES (${user.id}, ${taskId})`;
  }
  await sql`UPDATE users SET balance=balance+${task.reward} WHERE id=${user.id}`;

  const rows = await sql`SELECT balance FROM users WHERE id=${user.id}`;
  return res.json({ success: true, reward: parseFloat(task.reward), balance: parseFloat(rows[0].balance), message: `+${task.reward} NEON earned!` });
}
