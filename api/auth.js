import { validateTgInitData, parseTgUser, upsertUser, calcMined, getLevel, setCors, getSql } from './_utils.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const initData = req.headers['authorization'] || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Invalid initData' });

  const tgData = parseTgUser(initData);
  if (!tgData) return res.status(401).json({ error: 'No user data' });

  const sql = getSql();
  const user = await upsertUser(tgData);

  // Обрабатываем реферальный код из start_param
  const startParam = req.body?.start_param || null;
  if (startParam && startParam.length > 3) {
    const [referrer] = await sql`
      SELECT id FROM users
      WHERE referral_code = ${startParam.toUpperCase()}
        AND id != ${user.id}
      LIMIT 1
    `;
    if (referrer) {
      // Проверяем что этот реферал ещё не записан
      const [alreadyReferred] = await sql`
        SELECT 1 FROM referrals WHERE referred_id = ${user.id}
      `;
      if (!alreadyReferred) {
        // Создаём таблицу если нет
        await sql`CREATE TABLE IF NOT EXISTS referrals (
          id SERIAL PRIMARY KEY,
          referrer_id BIGINT NOT NULL,
          referred_id BIGINT NOT NULL UNIQUE,
          bonus_paid BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )`;
        await sql`INSERT INTO referrals (referrer_id, referred_id) VALUES (${referrer.id}, ${user.id}) ON CONFLICT DO NOTHING`;
        // Бонус рефереру +150 NEON и счётчик
        await sql`UPDATE users SET balance=balance+150, referrals_count=referrals_count+1 WHERE id=${referrer.id}`;
        // Новому пользователю +100 NEON за приход по реферальной ссылке
        await sql`UPDATE users SET balance=balance+100 WHERE id=${user.id}`;
      }
    }
  }

  // Получаем свежие данные после возможных обновлений
  const [fresh] = await sql`SELECT * FROM users WHERE id=${user.id}`;
  const mined = calcMined(fresh.hash_power, fresh.last_claim_at, fresh.offline_limit_hours);

  // Считаем referrals_count из таблицы referrals
  const refRows = await sql`SELECT COUNT(*) as cnt FROM referrals WHERE referrer_id=${fresh.id}`.catch(() => [{ cnt: 0 }]);
  const referralsCount = Number(refRows[0]?.cnt || 0);

  return res.json({
    user: {
      id: Number(fresh.id),
      username: fresh.username,
      first_name: fresh.first_name,
      hash_power: fresh.hash_power,
      balance: parseFloat(fresh.balance),
      level: getLevel(parseFloat(fresh.balance)),
      energy: fresh.energy,
      max_energy: fresh.max_energy,
      referral_code: fresh.referral_code,
      mining_rate: fresh.hash_power * 0.001,
      pending_coins: mined,
      offline_limit_hours: fresh.offline_limit_hours,
      total_mined: parseFloat(fresh.total_mined),
      upgrades_owned: Number(fresh.upgrades_owned),
      referrals_count: referralsCount,
    }
  });
}
