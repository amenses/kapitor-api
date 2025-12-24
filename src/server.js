const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { verifyFirebaseToken } = require('./middleware/auth');
const usersRouter = require('./routes/users');
const kycRouter = require('./routes/kyc');
const adminRouter = require('./routes/admin');

const app = express();
const port = process.env.PORT || 4000;

// Security and parsing middleware
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
const allowedOrigins =
  process.env.CORS_ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) || [];
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : '*',
    credentials: true,
  })
);

// Logging
app.use(morgan('combined'));

// Basic rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // adjust to traffic
});
app.use(authLimiter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Authenticated routes
app.use('/users', verifyFirebaseToken, usersRouter);
app.use('/kyc', verifyFirebaseToken, kycRouter);
app.use('/admin', verifyFirebaseToken, adminRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

