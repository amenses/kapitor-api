# 🔑 Test Token Guide - No Firebase Needed!

## ✅ Quick Setup (3 Steps)

### Step 1: Enable Test Mode
I've already added `TEST_MODE=true` to your `.env` file. If you need to do it manually:

```bash
echo "TEST_MODE=true" >> .env
```

### Step 2: Restart Your Server
```bash
# Stop your server (Ctrl+C) and restart
yarn dev
```

You should see: `⚠️  TEST MODE ENABLED - Firebase authentication is bypassed`

### Step 3: Use This Token
```
test-token
```

That's it! No Firebase setup needed!

---

## 🎯 Your Test Token

**Token**: `test-token`

**User Details**:
- UID: `test-user-123`
- Email: `test@kapitor.com`
- Role: `user`

---

## 🚀 Quick Test

Try this right now:

```bash
# Start KYB
curl -X POST http://localhost:4000/kyb/start \
  -H "Authorization: Bearer test-token"
```

If you get a response with a `kybId`, you're all set! 🎉

---

## 📝 Complete Test Flow

### Option 1: Use the Test Script (Easiest)

```bash
./test-kyb.sh
```

This will test the entire KYB flow automatically!

### Option 2: Manual Testing

Use these cURL commands (replace `{KYB_ID}` with the ID from step 1):

```bash
# 1. Start KYB
curl -X POST http://localhost:4000/kyb/start \
  -H "Authorization: Bearer test-token"

# 2. Get Status
curl -X GET http://localhost:4000/kyb/status \
  -H "Authorization: Bearer test-token"

# 3. Update Business Profile
curl -X PUT http://localhost:4000/kyb/{KYB_ID}/section/BUSINESS_PROFILE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"data":{"entityType":"Pvt Ltd"}}'

# 4. Submit (after completing all sections)
curl -X POST http://localhost:4000/kyb/{KYB_ID}/submit \
  -H "Authorization: Bearer test-token"
```

---

## 🔍 Verify Test Mode is Working

```bash
# This should work without any token
curl http://localhost:4000/kyb/status
```

If you get a response (even an error), test mode is active!

---

## 🎨 Alternative Test Tokens

You can also use:

1. **`test`** - Same as `test-token`
2. **No token** - Just omit the Authorization header
3. **Custom token**: `test-{uid}-{email}-{role}`
   - Example: `test-myuser-business-admin` (for admin testing)

---

## 📚 Full Documentation

- **Quick Start**: See `KYB_QUICK_START.md`
- **Complete API Docs**: See `KYB_API_TESTING.md`

---

## ✅ Checklist

- [x] `TEST_MODE=true` added to `.env`
- [ ] Server restarted
- [ ] Test token ready: `test-token`
- [ ] Ready to test!

---

**You're all set! Just use `test-token` as your authorization header! 🚀**

