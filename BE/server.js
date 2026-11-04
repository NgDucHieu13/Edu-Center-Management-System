require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const studentRoutes = require('./routes/student.routes');
const managementRoutes = require('./routes/management.routes');
const userRoutes = require('./routes/user.routes');
const roomRoutes = require('./routes/room.routes');
const studentPurchaseRoutes = require('./routes/student-purchase.routes');
const teacherMobileRoutes = require('./routes/teacher-mobile.routes');
const adminRoutes = require('./routes/admin.routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map((origin) => origin.trim());

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    try {
      const host = new URL(origin).hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return callback(null, true);
    } catch { /* reject malformed origins below */ }
    return callback(null, false);
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error('MySQL health check failed:', err.message);
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/api/v1/hoc-vien', studentRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/phong-hoc', roomRoutes);
app.use('/api/v1/student-purchases', studentPurchaseRoutes);
app.use('/api/v1/teacher-mobile', teacherMobileRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1', managementRoutes);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 3000);
if (require.main === module) {
  pool.getConnection()
    .then((connection) => {
      connection.release();
      app.listen(port, () => console.log(`API Ä‘ang cháº¡y táº¡i http://localhost:${port} (MySQL connected)`));
    })
    .catch(async (error) => {
      console.error(`KhÃ´ng thá»ƒ káº¿t ná»‘i MySQL: ${error.message}`);
      console.error('Kiá»ƒm tra MySQL service vÃ  cÃ¡c biáº¿n DB_* trong file .env.');
      await pool.end();
      process.exitCode = 1;
    });
}

module.exports = app;

