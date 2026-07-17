const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Wrapper to convert MySQL-style '?' placeholders to PostgreSQL '$1, $2'
const formatQuery = (sql, params = []) => {
  let index = 1;
  const pgSql = sql.replace(/\?/g, () => `$${index++}`);
  return { text: pgSql, values: params };
};

const query = async (sql, params = []) => {
  const { text, values } = formatQuery(sql, params);
  const { rows } = await pool.query(text, values);
  
  const result = rows;
  // Mimic mysql2 insertId behavior if RETURNING id is used
  if (rows.length > 0 && rows[0].id) {
    result.insertId = rows[0].id;
  }
  
  return [result]; // Returning as [rows, fields] format to match mysql2 usage
};

const getConnection = async () => {
  const client = await pool.connect();
  
  // Create a wrapper for the connection to match our db.query wrapper
  const connectionWrapper = {
    query: async (sql, params = []) => {
      const { text, values } = formatQuery(sql, params);
      const { rows } = await client.query(text, values);
      const result = rows;
      if (rows.length > 0 && rows[0].id) {
        result.insertId = rows[0].id;
      }
      return [result];
    },
    beginTransaction: async () => client.query('BEGIN'),
    commit: async () => client.query('COMMIT'),
    rollback: async () => client.query('ROLLBACK'),
    release: () => client.release()
  };
  
  return connectionWrapper;
};

module.exports = {
  query,
  getConnection,
  pool
};
