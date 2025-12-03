import pkg from 'pg';
const { Pool } = pkg;
import dns from 'dns';

// Принудительно используем IPv4 для DNS резолвинга (решает проблему с Render)
dns.setDefaultResultOrder('ipv4first');

// Используем Connection Pooler (порт 6543) для IPv4 совместимости
let connectionString = process.env.DATABASE_URL;

if (connectionString && connectionString.includes('supabase.co')) {
  // Заменяем порт 5432 на 6543 (Connection Pooler)
  if (connectionString.includes(':5432')) {
    connectionString = connectionString.replace(':5432', ':6543');
  }
}

const pool = new Pool({
  connectionString: connectionString || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default pool;
