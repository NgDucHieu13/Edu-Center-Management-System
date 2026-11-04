require('dotenv').config();
const pool = require('../config/db');

async function checkDatabase() {
  try {
    const [rows] = await pool.query('SHOW TABLES');
    const tables = rows.map((row) => Object.values(row)[0]);
    console.log(`Connected to MySQL database "${process.env.DB_NAME}".`);
    console.log(tables.length ? `Tables: ${tables.join(', ')}` : 'No tables found. Run sqll.sql to initialize the schema.');
  } catch (error) {
    console.error(`MySQL check failed (${error.code || 'ERROR'}): ${error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

checkDatabase();
