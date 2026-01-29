const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// const rateLimit = require('express-rate-limit');

const { connectDatabase, initializeFirebase, validateEnv, env } = require('./config');
const {
  usersRouter,
  kycRouter,
  adminRouter,
  walletRouter,
  kybRouter,
  transactionRouter,
  fiatRouter,
} = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares');
const { startUSDTListener } = require("./listeners/usdt.listener");
const { startCronJobs } = require("./crons");

// Only import test routes in test mode
let testRouter = null;
if (env.testMode) {
  testRouter = require('./routes/test');
  console.warn('⚠️  TEST MODE ENABLED - Firebase authentication is bypassed');
  console.warn('⚠️  DO NOT use test mode in production!');
}

// Validate environment variables
validateEnv();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase
initializeFirebase();

// Create Express app
const app = express();

app.post('/fiat/webhook/stripe',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
      console.log('Missing stripe-signature header');
      return res.status(400).send('Missing signature');
    }

    // req.body will be a Buffer when using express.raw
    // Do NOT JSON.parse or JSON.stringify req.body here
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.log('⚠️ Webhook signature verification failed.', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // handle the event
    console.log('Verified event:', event.type);
    res.json({ received: true });
  }
);

// Security middleware
app.use(helmet());

// Body parsing middleware (capture raw body for webhooks)
app.use(
  express.json({
    limit: '2mb',
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(
  cors({
    origin: env.corsAllowedOrigins.length > 0 ? env.corsAllowedOrigins : '*',
    credentials: true,
  })
);

// Logging middleware
app.use(morgan('combined'));

// Rate limiting
// const limiter = rateLimit({
//   windowMs: env.rateLimitWindowMs,
//   max: env.rateLimitMax,
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test routes (only in test mode)
if (testRouter) {
  app.use('/test', testRouter);
}

// API routes
app.use('/users', usersRouter);
app.use('/kyc', kycRouter);
app.use('/admin', adminRouter);
app.use('/wallet', walletRouter);
app.use('/kyb', kybRouter);
app.use('/transaction', transactionRouter);
app.use('/fiat', fiatRouter);
// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    // startUSDTListener();   // real-time
    startCronJobs();      // scheduled
    // Start listening
    const port = env.port;
    app.listen(port, () => {
      console.log(`🚀 API server listening on port ${port}`);
      console.log(`📊 Environment: ${env.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  const { disconnectDatabase } = require('./config');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  const { disconnectDatabase } = require('./config');
  await disconnectDatabase();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
