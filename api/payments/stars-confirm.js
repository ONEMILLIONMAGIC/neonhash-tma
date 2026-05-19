import { validateTgInitData, parseTgUser, upsertUser, setCors, getSql } from '../_utils.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const initData = req.headers['authorization'] || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });

  const sql = getSql();
  const tgData = parseTgUser(initData);
  const user = await upsertUser(tgData);
  const { hash_power, package_id } = req.body || {};

  // Добавляем hash power (Stars уже списаны Telegram'ом)
  await sql`UPDATE users SET hash_power = hash_power + ${hash_power} WHERE id = ${user.id}`;
  await sql`INSERT INTO payments (user_id, package_id, wallet_address, amount_ton, hash_power, status, confirmed_at)
    VALUES (${user.id}, ${package_id}, 'telegram_stars', 0, ${hash_power}, 'confirmed', NOW())`;

  const rows = await sql`SELECT hash_power, balance FROM users WHERE id = ${user.id}`;
  return res.json({ success: true, hash_power: rows[0].hash_power });
}
