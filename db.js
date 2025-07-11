// db.js
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // или твоя строка подключения
  ssl: {
    rejectUnauthorized: false, // для Render
  },
});

export default pool;
