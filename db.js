import pkg from 'pg';
const { Pool } = pkg;
import dns from 'dns';

// Принудительно используем IPv4 для DNS резолвинга
dns.setDefaultResultOrder('ipv4first');

// Функция для парсинга connection string и резолвинга в IPv4
function parseConnectionString(connectionString) {
  if (!connectionString) {
    return null;
  }

  try {
    // Парсим connection string
    const url = new URL(connectionString.replace('postgresql://', 'http://'));
    const hostname = url.hostname;
    let port = url.port || '5432';
    
    // Для Supabase используем Connection Pooler (порт 6543)
    if (hostname.includes('supabase.co') && port === '5432') {
      port = '6543';
    }
    
    // Резолвим домен в IPv4 адрес
    let host;
    
    // Сначала проверяем переменную окружения SUPABASE_IPV4 (для прямого указания IPv4)
    if (process.env.SUPABASE_IPV4 && hostname.includes('supabase.co')) {
      host = process.env.SUPABASE_IPV4;
      console.log(`✅ Используем IPv4 из переменной окружения: ${host}`);
    } else {
      // Пробуем резолвить через DNS
      try {
        const result = dns.lookupSync(hostname, { family: 4 });
        host = result.address;
        console.log(`✅ Резолвим ${hostname} → IPv4: ${host}`);
      } catch (error) {
        console.warn(`⚠️ Не удалось резолвить ${hostname} в IPv4:`, error.message);
        console.warn(`💡 Подсказка: установите переменную окружения SUPABASE_IPV4 с IPv4 адресом`);
        // Если не удалось резолвить, используем домен (может не сработать в Render)
        host = hostname;
      }
    }
    
    return {
      host,
      port: parseInt(port),
      database: url.pathname.slice(1) || 'postgres',
      user: url.username || 'postgres',
      password: url.password || '',
      ssl: { rejectUnauthorized: false }
    };
  } catch (error) {
    console.error('Ошибка парсинга connection string:', error.message);
    return null;
  }
}

// Парсим connection string и создаём pool с явными параметрами
const connectionString = process.env.DATABASE_URL;
const config = parseConnectionString(connectionString);

const pool = config 
  ? new Pool(config)
  : new Pool({
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false }
    });

export default pool;
