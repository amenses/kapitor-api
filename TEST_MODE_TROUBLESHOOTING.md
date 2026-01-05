# 🔧 Test Mode Troubleshooting

## ❌ Error: "Invalid or expired token"

This error means test mode is **NOT active**. Here's how to fix it:

---

## ✅ Solution Steps

### Step 1: Verify TEST_MODE is in .env

```bash
cat .env | grep TEST_MODE
```

Should show: `TEST_MODE=true`

### Step 2: Restart Your Server

**IMPORTANT**: You MUST restart the server after adding TEST_MODE!

```bash
# Stop the server (Ctrl+C)
# Then restart:
yarn dev
```

### Step 3: Verify Test Mode is Active

When you start the server, you should see:
```
⚠️  TEST MODE ENABLED - Firebase authentication is bypassed
⚠️  DO NOT use test mode in production!
```

If you DON'T see these messages, test mode is not active!

---

## 🔍 Debugging

### Check if test mode is loaded:

```bash
node -e "require('dotenv').config(); const {env} = require('./src/config/env'); console.log('Test Mode:', env.testMode);"
```

Should output: `Test Mode: true`

### Test without token (should work in test mode):

```bash
curl http://localhost:4000/kyb/status
```

If this works (even with an error about KYB not found), test mode is active!

---

## 🚨 Common Issues

### Issue 1: Server not restarted
**Fix**: Stop and restart the server after adding TEST_MODE

### Issue 2: TEST_MODE not set correctly
**Fix**: Make sure it's exactly `TEST_MODE=true` (not `TEST_MODE = true` or `TEST_MODE="true"`)

### Issue 3: .env file not in root directory
**Fix**: Make sure `.env` is in the same directory as `package.json`

### Issue 4: Multiple .env files
**Fix**: Check if you have `.env.local` or `.env.development` that might override

---

## ✅ Quick Fix Script

Run this to verify everything:

```bash
#!/bin/bash
echo "Checking test mode setup..."

# Check .env
if grep -q "TEST_MODE=true" .env; then
  echo "✅ TEST_MODE=true found in .env"
else
  echo "❌ TEST_MODE not found in .env"
  echo "Adding TEST_MODE=true..."
  echo "TEST_MODE=true" >> .env
fi

# Check if it loads
node -e "require('dotenv').config(); const {env} = require('./src/config/env'); console.log('Test Mode Active:', env.testMode);" 2>/dev/null

echo ""
echo "If Test Mode Active: true, restart your server with: yarn dev"
```

---

## 🎯 Quick Test

After restarting, test with:

```bash
# This should work WITHOUT any token in test mode
curl http://localhost:4000/kyb/status
```

If you get a response (even an error), test mode is working!

Then try with token:

```bash
curl -X POST http://localhost:4000/kyb/start \
  -H "Authorization: Bearer test-token"
```

---

## 📝 Alternative: Set TEST_MODE at runtime

If .env isn't working, you can set it when starting:

```bash
TEST_MODE=true yarn dev
```

Or:

```bash
export TEST_MODE=true
yarn dev
```

---

**Most common issue: Server not restarted after adding TEST_MODE!**

