import pkg from 'pg';
const { Pool } = pkg;

// Используем Connection Pooler (порт 6543) для IPv4 совместимости
let connectionString = process.env.DATABASE_URL;

if (connectionString && connectionString.includes('supabase.co')) {
  // Заменяем порт 5432 на 6543 (Connection Pooler)
  if (connectionString.includes(':5432')) {
    connectionString = connectionString.replace(':5432', ':6543');
  }
  
  // Пробуем использовать IPv4 через параметры подключения
  // Если строка содержит параметры, добавляем, иначе добавляем ?
  if (connectionString.includes('?')) {
    connectionString += '&preferIPv4=true';
  } else {
    connectionString += '?preferIPv4=true';
  }
}

const pool = new Pool({
  connectionString: connectionString || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default pool;
