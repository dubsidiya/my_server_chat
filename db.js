import pkg from 'pg';
const { Pool } = pkg;

// Используем Connection Pooler (порт 6543) для лучшей совместимости с Render
let connectionString = process.env.DATABASE_URL;
if (connectionString && connectionString.includes('supabase.co') && connectionString.includes(':5432')) {
  // Заменяем порт 5432 на 6543 (Connection Pooler)
  connectionString = connectionString.replace(':5432', ':6543');
}

const pool = new Pool({
  connectionString: connectionString || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default pool;
