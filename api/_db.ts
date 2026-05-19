import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

export async function query(text: string, values?: unknown[]) {
  const db = getPool();
  return db.query(text, values);
}

let initialized = false;
export async function initDb() {
  if (initialized) return;
  initialized = true;

  await query(`CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY, username VARCHAR(255), first_name VARCHAR(255),
    hash_power INTEGER DEFAULT 1, balance DECIMAL(20,8) DEFAULT 0, level INTEGER DEFAULT 1,
    energy INTEGER DEFAULT 100, max_energy INTEGER DEFAULT 100,
    last_claim_at TIMESTAMP DEFAULT NOW(), offline_limit_hours INTEGER DEFAULT 12,
    referral_code VARCHAR(20) UNIQUE, total_mined DECIMAL(20,8) DEFAULT 0,
    upgrades_owned INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW()
  )`);

  await query(`CREATE TABLE IF NOT EXISTS upgrades (
    id SERIAL PRIMARY KEY, name VARCHAR(100), description TEXT,
    hash_power_bonus INTEGER DEFAULT 0, price DECIMAL(20,8),
    level_required INTEGER DEFAULT 1, category VARCHAR(50), icon VARCHAR(10) DEFAULT '⚡'
  )`);

  await query(`CREATE TABLE IF NOT EXISTS user_upgrades (
    user_id BIGINT, upgrade_id INTEGER, PRIMARY KEY (user_id, upgrade_id)
  )`);

  await query(`CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY, title VARCHAR(255), description TEXT, reward DECIMAL(20,8),
    task_type VARCHAR(50), action_url TEXT, icon VARCHAR(10) DEFAULT '📋'
  )`);

  await query(`CREATE TABLE IF NOT EXISTS user_tasks (
    user_id BIGINT, task_id INTEGER, completed_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, task_id)
  )`);

  await query(`CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY, user_id BIGINT, package_id VARCHAR(50),
    wallet_address TEXT, amount_ton DECIMAL(10,4), hash_power INTEGER,
    status VARCHAR(20) DEFAULT 'pending', tx_hash TEXT,
    confirmed_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW()
  )`);

  const { rows } = await query('SELECT id FROM upgrades LIMIT 1');
  if (!rows.length) {
    await query(`INSERT INTO upgrades (name,description,hash_power_bonus,price,level_required,category,icon) VALUES
      ('Basic GPU','Entry-level GPU for mining.',10,500,1,'mining','🖥'),
      ('Pro GPU','High-performance GPU mining rig.',25,1500,3,'mining','💻'),
      ('ASIC Miner','Dedicated ASIC hardware.',75,5000,5,'mining','⚙'),
      ('Quantum Rig','Quantum-enhanced hash computation.',200,20000,9,'mining','🔬'),
      ('Energy Cell','Increase max energy by 500.',0,800,2,'energy','🔋'),
      ('Turbo Capacitor','Energy regens 2x faster.',5,2000,4,'energy','⚡'),
      ('Offline Booster','Extend offline mining to 24h.',0,3000,3,'offline','🌙'),
      ('Liquid Cooling','Lower temps, push hash power.',20,1200,2,'mining','❄'),
      ('AI Optimizer','Neural net tunes mining 24/7.',40,4000,6,'mining','🤖')`);

    await query(`INSERT INTO tasks (title,description,reward,task_type,action_url,icon) VALUES
      ('Daily Login','Open the app today.',10,'daily',NULL,'📅'),
      ('Claim Rewards','Claim mined NEON at least once.',25,'daily',NULL,'💰'),
      ('First Purchase','Buy your first upgrade.',100,'one_time',NULL,'🛒'),
      ('Mine 1000 NEON','Accumulate 1,000 NEON mined.',200,'one_time',NULL,'🏆'),
      ('Reach Level 5','Level up to level 5.',300,'one_time',NULL,'⭐'),
      ('Invite 1 Friend','Get 1 friend via referral.',150,'referral','https://t.me/neonhash_bot','👥')`);
  }
}
