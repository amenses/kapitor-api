# KYB API Quick Start Guide

## 🚀 Step 1: Enable Test Mode

Add this to your `.env` file (or create one if it doesn't exist):

```bash
TEST_MODE=true
NODE_ENV=development
```

Or export it before starting the server:

```bash
export TEST_MODE=true
```

## 🔑 Step 2: Get Your Test Token

**You don't need Firebase!** In test mode, use one of these simple tokens:

### Option 1: Simple Test Token (Recommended)
```
test-token
```

### Option 2: Even Simpler
```
test
```

### Option 3: No Token at All
Just omit the Authorization header - it will use default test user automatically!

## 📝 Step 3: Test Token Details

When you use `test-token`, you get:
- **UID**: `test-user-123`
- **Email**: `test@kapitor.com`
- **Role**: `user`

## 🧪 Step 4: Complete KYB Test Flow

Here's a complete test flow you can copy-paste:

### 1. Start KYB Process

```bash
curl -X POST http://localhost:4000/kyb/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token"
```

**Save the `kybId` from the response!**

### 2. Check Status

```bash
curl -X GET http://localhost:4000/kyb/status \
  -H "Authorization: Bearer test-token"
```

### 3. Update Business Profile

```bash
curl -X PUT http://localhost:4000/kyb/{KYB_ID}/section/BUSINESS_PROFILE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "data": {
      "entityType": "Pvt Ltd"
    }
  }'
```

### 4. Update Business Identity

```bash
curl -X PUT http://localhost:4000/kyb/{KYB_ID}/section/BUSINESS_IDENTITY \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "data": {
      "legalName": "Test Company Pvt Ltd",
      "registrationNumber": "U72900KA2020PTC123456"
    }
  }'
```

### 5. Update Business Address

```bash
curl -X PUT http://localhost:4000/kyb/{KYB_ID}/section/BUSINESS_ADDRESS \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "data": {
      "registeredAddress": {
        "line1": "123 Business Street",
        "city": "Bangalore",
        "state": "Karnataka",
        "postalCode": "560001",
        "country": "India"
      },
      "operatingAddress": {
        "line1": "123 Business Street",
        "city": "Bangalore",
        "state": "Karnataka",
        "postalCode": "560001",
        "country": "India"
      }
    }
  }'
```

### 6. Update Ownership Structure

```bash
curl -X PUT http://localhost:4000/kyb/{KYB_ID}/section/OWNERSHIP_STRUCTURE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "data": {
      "owners": [
        {
          "type": "individual",
          "name": "John Doe",
          "percentage": 100,
          "pepFlag": false
        }
      ]
    }
  }'
```

**Important: Total ownership must equal 100%**

### 7. Update Management & Authority

```bash
curl -X PUT http://localhost:4000/kyb/{KYB_ID}/section/MANAGEMENT_AUTHORITY \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "data": {
      "directors": [
        {
          "name": "John Doe",
          "designation": "Director",
          "email": "john@test.com",
          "phone": "+919876543210"
        }
      ]
    }
  }'
```

### 8. Upload Document

```bash
curl -X POST http://localhost:4000/kyb/{KYB_ID}/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "sectionKey": "STATUTORY_DOCUMENTS",
    "documentType": "Certificate of Incorporation",
    "documentName": "COI.pdf",
    "fileUrl": "https://example.com/documents/coi.pdf"
  }'
```

### 9. Update Bank Account Declaration

```bash
curl -X PUT http://localhost:4000/kyb/{KYB_ID}/section/BANK_ACCOUNT_DECLARATION \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "data": {
      "accountNumber": "1234567890",
      "bankName": "HDFC Bank",
      "accountHolderName": "Test Company Pvt Ltd"
    }
  }'
```

### 10. Update Business Activity Declaration

```bash
curl -X PUT http://localhost:4000/kyb/{KYB_ID}/section/BUSINESS_ACTIVITY_DECLARATION \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "data": {
      "intendedServices": ["Payment Processing"],
      "expectedVolume": 1000000,
      "expectedTransactionCount": 50000
    }
  }'
```

### 11. Update Risk & Regulatory Declarations

```bash
curl -X PUT http://localhost:4000/kyb/{KYB_ID}/section/RISK_REGULATORY_DECLARATIONS \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "data": {
      "sanctionsCheck": false,
      "litigationCheck": false,
      "regulatoryActionCheck": false
    }
  }'
```

### 12. Submit KYB Application

```bash
curl -X POST http://localhost:4000/kyb/{KYB_ID}/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token"
```

## 🎯 Quick Test Script

Save this as `test-kyb.sh` and run it:

```bash
#!/bin/bash

BASE_URL="http://localhost:4000"
TOKEN="test-token"

echo "🚀 Starting KYB Test Flow..."
echo ""

# 1. Start KYB
echo "1. Starting KYB process..."
START_RESPONSE=$(curl -s -X POST $BASE_URL/kyb/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

KYB_ID=$(echo $START_RESPONSE | grep -o '"kybId":"[^"]*' | cut -d'"' -f4)

if [ -z "$KYB_ID" ]; then
  echo "❌ Failed to start KYB. Response: $START_RESPONSE"
  exit 1
fi

echo "✅ KYB Started! ID: $KYB_ID"
echo ""

# 2. Update Business Profile
echo "2. Updating Business Profile..."
curl -s -X PUT $BASE_URL/kyb/$KYB_ID/section/BUSINESS_PROFILE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"data":{"entityType":"Pvt Ltd"}}' > /dev/null
echo "✅ Business Profile updated"

# 3. Update Business Identity
echo "3. Updating Business Identity..."
curl -s -X PUT $BASE_URL/kyb/$KYB_ID/section/BUSINESS_IDENTITY \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"data":{"legalName":"Test Company","registrationNumber":"U72900KA2020PTC123456"}}' > /dev/null
echo "✅ Business Identity updated"

# 4. Check Status
echo ""
echo "4. Checking KYB Status..."
curl -s -X GET $BASE_URL/kyb/status \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "✅ Test completed! Use the KYB ID: $KYB_ID for further testing"
```

Make it executable:
```bash
chmod +x test-kyb.sh
./test-kyb.sh
```

## 🔍 Verify Test Mode is Active

Check if test mode is working:

```bash
# This should work without any token in test mode
curl http://localhost:4000/kyb/status
```

If you see a response (even an error about KYB not found), test mode is working!

## 📋 Summary

**Test Token**: `test-token` (or just `test`)

**No Firebase needed!** Just:
1. Set `TEST_MODE=true` in `.env`
2. Use `Authorization: Bearer test-token` header
3. Start testing!

**Default Test User**:
- UID: `test-user-123`
- Email: `test@kapitor.com`
- Role: `user`

## 🎉 You're Ready!

Just use `test-token` as your authorization token and you can test the entire KYB flow without any Firebase setup!

