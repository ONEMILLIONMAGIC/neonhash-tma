import { validateTgInitData, parseTgUser, upsertUser, setCors } from '../_utils.js';

// Цены пакетов в Telegram Stars (примерно 1 TON = 500 Stars)
const PACKAGES = {
  starter:  { stars: 250,  hash_power: 50,   name: 'Starter Pack' },
  pro:      { stars: 750,  hash_power: 200,  name: 'Pro Miner' },
  quantum:  { stars: 2500, hash_power: 800,  name: 'Quantum Pack' },
  galactic: { stars: 7500, hash_power: 3000, name: 'Galactic Pack' },
  infinity: { stars: 25000,hash_power: 15000,name: 'Infinity Core' },
};

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const initData = req.headers['authorization'] || '';
  if (!validateTgInitData(initData)) return res.status(401).json({ error: 'Unauthorized' });

  const { package_id } = req.body || {};
  const pkg = PACKAGES[package_id];
  if (!pkg) return res.status(400).json({ error: 'Unknown package' });

  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (!BOT_TOKEN) return res.status(500).json({ error: 'Bot not configured' });

  // Создаём инвойс через Telegram Bot API (Stars = currency XTR)
  const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: pkg.name,
      description: `+${pkg.hash_power} H/s for NeonHash Mining`,
      payload: JSON.stringify({ package_id, hash_power: pkg.hash_power }),
      currency: 'XTR',
      prices: [{ label: pkg.name, amount: pkg.stars }],
    }),
  });
  const tgData = await tgRes.json();

  if (!tgData.ok) return res.status(500).json({ error: tgData.description });
  return res.json({ invoice_url: tgData.result, stars: pkg.stars, hash_power: pkg.hash_power });
}
