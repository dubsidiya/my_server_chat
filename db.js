import pkg from 'pg';
const { Pool } = pkg;
import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

// Принудительно используем IPv4 для DNS резолвинга
dns.setDefaultResultOrder('ipv4first');

// Функция для замены домена на IPv4 адрес в connection string
function resolveToIPv4Sync(connectionString) {
  if (!connectionString || !connectionString.includes('supabase.co')) {
    return connectionString;
  }

  try {
    // Парсим connection string
    const url = new URL(connectionString.replace('postgresql://', 'http://'));
    const hostname = url.hostname;
    
    // Резолвим домен в IPv4 адрес синхронно (блокирует event loop, но работает)
    const result = dns.lookupSync(hostname, { family: 4 });
    const ipv4Address = result.address;
    
    // Заменяем домен на IPv4 адрес
    let newConnectionString = connectionString.replace(hostname, ipv4Address);
    
    // Заменяем порт 5432 на 6543 (Connection Pooler)
    if (newConnectionString.includes(':5432')) {
      newConnectionString = newConnectionString.replace(':5432', ':6543');
    }
    
    console.log(`✅ Используем IPv4 адрес: ${ipv4Address} вместо домена ${hostname}`);
    return newConnectionString;
  } catch (error) {
    console.warn('⚠️ Не удалось резолвить домен в IPv4 синхронно, пробуем асинхронно...');
    // Если синхронный резолвинг не сработал, используем исходную строку с заменой порта
    return connectionString.includes(':5432')
      ? connectionString.replace(':5432', ':6543')
      : connectionString;
  }
}

// Используем Connection Pooler (порт 6543) и резолвим домен в IPv4
let connectionString = process.env.DATABASE_URL;

if (connectionString && connectionString.includes('supabase.co')) {
  connectionString = resolveToIPv4Sync(connectionString);
}

const pool = new Pool({
  connectionString: connectionString || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default pool;
