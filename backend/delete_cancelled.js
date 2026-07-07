const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:password123@localhost:5432/contactpoint?schema=public"
});

async function main() {
  try {
    const resCount = await pool.query('SELECT status, count(*) FROM requests GROUP BY status');
    console.log(`Statuses in requests table:`);
    console.table(resCount.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
