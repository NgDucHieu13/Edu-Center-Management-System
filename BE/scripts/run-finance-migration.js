require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function migrate() {
  const file = path.join(__dirname, '..', 'migrations', '004_finance_settings.sql');
  const sql = fs.readFileSync(file, 'utf8');
  try {
    for (const statement of sql.split(';').map((item) => item.trim()).filter(Boolean)) await pool.query(statement);
    console.log('Finance, refund, branch, and settings tables are ready.');
  } catch (error) {
    console.error(`Migration failed (${error.code || 'ERROR'}): ${error.message}`);
    process.exitCode = 1;
  } finally { await pool.end(); }
}

migrate();
