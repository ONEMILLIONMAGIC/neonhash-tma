import crypto from 'crypto';
import { query, initDb } from './_db';

export function validateTgInitData(initData: string): boolean {
  const botToken = process.env.BOT_TOKEN || '';
  if (!botToken || initData === 'dev_mode') return true;
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return false;
    params.delete('hash');
    const str = [...params.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');
    const key = crypto.createHmac('sha256','WebAppData').update(botToken).digest();
    return crypto.createHmac('sha256',key).update(str).digest('hex') === hash;
  } catch { return false; }
}

export function parseTgUser(initData: string): Record<string,unknown> | null {
  if (initData === 'dev_mode') return { id: 1, username: 'dev', first_name: 'Dev' };
  try {
    const u = new URLSearchParams(initData).get('user');
    return u ? JSON.parse(decodeURIComponent(u)) : null;
  } catch { return null; }
}

export function genRefCode(userId: number): string {
  return Buffer.from(`nh${userId}`).toString('base64').replace(/[^a-zA-Z0-9]/g,'').slice(0,12).toUpperCase();
}

export function calcMined(hashPower: number, lastClaimAt: Date, offlineHours: number): number {
  const maxMs = offlineHours * 3600 * 1000;
  const elapsed = Math.min(Date.now() - new Date(lastClaimAt).getTime(), maxMs) / 1000;
  return parseFloat((hashPower * 0.001 * elapsed).toFixed(8));
}

export function getLevel(balance: number): number {
  if (balance < 1000) return 1;
  if (balance < 5000) return 2;
  if (balance < 15000) return 3;
  if (balance < 50000) return 4;
  if (balance < 150000) return 5;
  return Math.min(10, Math.floor(balance / 100000) + 5);
}

export async function upsertUser(tgData: Record<string,unknown>) {
  await initDb();
  const id = tgData.id as number;
  const ref = genRefCode(id);
  await query(
    `INSERT INTO users (id,username,first_name,referral_code)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (id) DO UPDATE SET username=EXCLUDED.username, first_name=EXCLUDED.first_name`,
    [id, tgData.username as string, tgData.first_name as string, ref]
  );
  const { rows } = await query('SELECT * FROM users WHERE id=$1', [id]);
  return rows[0];
}

export function setCors(res: { setHeader: (k:string,v:string)=>void }) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
}
