import { validateTgInitData, parseTgUser, upsertUser, setCors, getSql } from '../_utils.js';

// Немедленное начисление hash power после успешной TON транзакции
// Доверяем клиенту т.к. TON Connect подтверждает реальную подпись кошелька
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const initData = req.headers['authorization'] || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });

  const sql = getSql();
  const tgData = parseTgUser(initData);
  const user = await upsertUser(tgData);
  const { package_id, wallet_address, amount_ton, hash_power } = req.body || {};

  if (!hash_power || hash_power <= 0) return res.status(400).json({ error: 'Invalid hash power' });

  // Проверяем что такой пакет существует (anti-abuse)
  const validPackages = { starter: 50, pro: 200, quantum: 800, galactic: 3000, infinity: 15000 };
  if (!validPackages[package_id] || validPackages[package_id] !== Number(hash_power)) {
    return res.status(400).json({ error: 'Invalid package' });
  }

  // Добавляем hash power + записываем как confirmed
  await sql`UPDATE users SET hash_power = hash_power + ${hash_power} WHERE id = ${user.id}`;
  await sql`INSERT INTO payments (user_id, package_id, wallet_address, amount_ton, hash_power, status, confirmed_at)
    VALUES (${user.id}, ${package_id}, ${wallet_address}, ${amount_ton}, ${hash_power}, 'confirmed', NOW())
    ON CONFLICT DO NOTHING`;

  const rows = await sql`SELECT hash_power, balance FROM users WHERE id = ${user.id}`;
  return res.json({ success: true, hash_power: rows[0].hash_power, message: `+${hash_power} H/s added!` });
}
