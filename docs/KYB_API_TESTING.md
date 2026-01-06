# KYB API Testing Guide

## 🔧 Setup Test Mode

To test KYB APIs without Firebase authentication, enable test mode:

### Option 1: Environment Variable

```bash
export TEST_MODE=true
```

### Option 2: Add to .env file

```bash
TEST_MODE=true
NODE_ENV=development
```

### Option 3: Start server with test mode

```bash
TEST_MODE=true yarn dev
```

---

## 🔑 Authentication Tokens for Testing

In test mode, you can use any of these tokens:

### Simple Test Tokens (Recommended)

```bash
# Default test user (uid: test-user-123, role: user)
Authorization: Bearer test
# OR
Authorization: Bearer test-token
```

### Custom Test User Token

```bash
# Format: test-{uid}-{email}-{role}
# Example: test-myuser123-business-admin
Authorization: Bearer test-myuser123-business-admin
```

### No Token (Uses Default)

```bash
# Just omit the Authorization header - uses default test user
# (Only works in test mode)
```

### Admin Token

```bash
# For admin routes, use:
Authorization: Bearer test-admin-uid-admin-admin
```

---

## 📋 KYB API cURL Commands

**Base URL**: `http://localhost:4000` (adjust if your server runs on different port)

### 1. Start KYB Process

```bash
curl -X POST http://localhost:4000/kyb/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "kybId": "507f1f77bcf86cd799439011",
    "status": "IN_PROGRESS",
    "uid": "test-user-123"
  }
}
```

**Save the `kybId` from response for subsequent requests!**

---

### 2. Get KYB Status

```bash
curl -X GET http://localhost:4000/kyb/status \
  -H "Authorization: Bearer test-token"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "kyb": {
      "_id": "507f1f77bcf86cd799439011",
      "uid": "test-user-123",
      "status": "IN_PROGRESS",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "sections": []
  }
}
```

---

### 3. Update Section: BUSINESS_PROFILE

```bash
curl -X PUT http://localhost:4000/kyb/{kybId}/section/BUSINESS_PROFILE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "data": {
      "entityType": "Pvt Ltd"
    }
  }'
```

**Replace `{kybId}` with actual KYB ID from step 1**

---

### 4. Update Section: BUSINESS_IDENTITY

```bash
curl -X PUT http://localhost:4000/kyb/{kybId}/section/BUSINESS_IDENTITY \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "data": {
      "legalName": "Kapitor Technologies Pvt Ltd",
      "tradeName": "Kapitor",
      "incorporationDate": "2020-01-15",
      "country": "India",
      "registrationNumber": "U72900KA2020PTC123456",
      "taxId": "29AABCK1234D1Z5",
      "industry": "Financial Technology",
      "natureOfBusiness": "Digital Payment Solutions"
    }
  }'
```

---

### 5. Update Section: BUSINESS_ADDRESS

```bash
curl -X PUT http://localhost:4000/kyb/{kybId}/section/BUSINESS_ADDRESS \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "data": {
      "registeredAddress": {
        "line1": "123 Business Street",
        "line2": "Suite 100",
        "city": "Bangalore",
        "state": "Karnataka",
        "postalCode": "560001",
        "country": "India"
      },
      "operatingAddress": {
        "line1": "123 Business Street",
        "line2": "Suite 100",
        "city": "Bangalore",
        "state": "Karnataka",
        "postalCode": "560001",
        "country": "India"
      }
    }
  }'
```

---

### 6. Update Section: OWNERSHIP_STRUCTURE

```bash
curl -X PUT http://localhost:4000/kyb/{kybId}/section/OWNERSHIP_STRUCTURE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "data": {
      "owners": [
        {
          "type": "individual",
          "name": "John Doe",
          "percentage": 60,
          "pepFlag": false,
          "nationality": "Indian"
        },
        {
          "type": "individual",
          "name": "Jane Smith",
          "percentage": 40,
          "pepFlag": false,
          "nationality": "Indian"
        }
      ]
    }
  }'
```

**Note: Total ownership must equal 100%**

---

### 7. Update Section: MANAGEMENT_AUTHORITY

```bash
curl -X PUT http://localhost:4000/kyb/{kybId}/section/MANAGEMENT_AUTHORITY \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "data": {
      "directors": [
        {
          "name": "John Doe",
          "designation": "Director",
          "email": "john@kapitor.com",
          "phone": "+919876543210",
          "emailVerified": true,
          "phoneVerified": true
        }
      ],
      "authorizedSignatories": [
        {
          "name": "John Doe",
          "designation": "CEO",
          "email": "john@kapitor.com",
          "phone": "+919876543210"
        }
      ]
    }
  }'
```

---

### 8. Update Section: BANK_ACCOUNT_DECLARATION

```bash
curl -X PUT http://localhost:4000/kyb/{kybId}/section/BANK_ACCOUNT_DECLARATION \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "data": {
      "accountNumber": "1234567890",
      "bankName": "HDFC Bank",
      "accountHolderName": "Kapitor Technologies Pvt Ltd",
      "ifscCode": "HDFC0001234",
      "accountType": "current",
      "country": "India"
    }
  }'
```

---

### 9. Update Section: BUSINESS_ACTIVITY_DECLARATION

```bash
curl -X PUT http://localhost:4000/kyb/{kybId}/section/BUSINESS_ACTIVITY_DECLARATION \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "data": {
      "intendedServices": ["Payment Processing", "Wallet Services"],
      "expectedVolume": 1000000,
      "expectedTransactionCount": 50000,
      "sourceOfFunds": "Business Revenue",
      "destinationOfFunds": "Customer Payments"
    }
  }'
```

---

### 10. Update Section: RISK_REGULATORY_DECLARATIONS

```bash
curl -X PUT http://localhost:4000/kyb/{kybId}/section/RISK_REGULATORY_DECLARATIONS \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "data": {
      "sanctionsCheck": false,
      "litigationCheck": false,
      "regulatoryActionCheck": false,
      "explanation": null
    }
  }'
```

---

### 11. Upload Document

```bash
curl -X POST http://localhost:4000/kyb/{kybId}/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "sectionKey": "STATUTORY_DOCUMENTS",
    "documentType": "Certificate of Incorporation",
    "documentName": "COI.pdf",
    "fileUrl": "https://example.com/documents/coi.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "expiryDate": "2025-12-31"
  }'
```

---

### 12. Get Documents

```bash
# Get all documents
curl -X GET http://localhost:4000/kyb/{kybId}/documents \
  -H "Authorization: Bearer test-token"

# Get documents for specific section
curl -X GET "http://localhost:4000/kyb/{kybId}/documents?sectionKey=STATUTORY_DOCUMENTS" \
  -H "Authorization: Bearer test-token"
```

---

### 13. Get Specific Section

```bash
curl -X GET http://localhost:4000/kyb/{kybId}/section/BUSINESS_PROFILE \
  -H "Authorization: Bearer test-token"
```

---

### 14. Get Multiple Sections (NEW - Param-based)

```bash
# Get specific sections by keys (comma-separated)
curl -X GET "http://localhost:4000/kyb/{kybId}/sections?keys=BUSINESS_PROFILE,BUSINESS_ADDRESS" \
  -H "Authorization: Bearer test-token"

# Get all sections (omit keys parameter)
curl -X GET http://localhost:4000/kyb/{kybId}/sections \
  -H "Authorization: Bearer test-token"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "sections": [
      {
        "sectionKey": "BUSINESS_PROFILE",
        "status": "COMPLETED",
        "data": { ... },
        "updatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "sectionKey": "BUSINESS_ADDRESS",
        "status": "IN_PROGRESS",
        "data": { ... }
      }
    ]
  }
}
```

---

### 15. Submit KYB Application

```bash
curl -X POST http://localhost:4000/kyb/{kybId}/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token"
```

**Note: All required sections must be completed before submission**

---

## 🔐 Admin/Compliance APIs

**For admin routes, you need admin role token:**

```bash
# Admin token format: test-{uid}-{email}-admin
TOKEN="test-admin-uid-admin-admin"
```

### 15. Approve KYB

```bash
curl -X POST http://localhost:4000/kyb/{uid}/{kybId}/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-admin-uid-admin-admin" \
  -d '{
    "validityPeriod": 365,
    "reviewedBy": "admin-user-123",
    "reviewComments": "All documents verified and approved"
  }'
```

**Replace `{uid}` with user's uid (e.g., test-user-123)**

---

### 16. Reject KYB

```bash
curl -X POST http://localhost:4000/kyb/{uid}/{kybId}/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-admin-uid-admin-admin" \
  -d '{
    "rejectionReason": "Incomplete documentation",
    "rejectionCategory": "documentation",
    "reviewedBy": "admin-user-123",
    "reviewComments": "Missing certificate of incorporation"
  }'
```

---

### 17. Mark Action Required

```bash
curl -X POST http://localhost:4000/kyb/{uid}/{kybId}/action-required \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-admin-uid-admin-admin" \
  -d '{
    "sectionKey": "BUSINESS_IDENTITY",
    "actionComments": "Please provide additional details about nature of business",
    "reviewedBy": "admin-user-123"
  }'
```

---

## 🧪 Complete Test Flow Example

Here's a complete test flow from start to finish:

```bash
# 1. Start KYB
KYB_RESPONSE=$(curl -s -X POST http://localhost:4000/kyb/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token")

# Extract kybId (requires jq or manual extraction)
KYB_ID=$(echo $KYB_RESPONSE | jq -r '.data.kybId')
echo "KYB ID: $KYB_ID"

# 2. Update Business Profile
curl -X PUT http://localhost:4000/kyb/$KYB_ID/section/BUSINESS_PROFILE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"data": {"entityType": "Pvt Ltd"}}'

# 3. Update Business Identity
curl -X PUT http://localhost:4000/kyb/$KYB_ID/section/BUSINESS_IDENTITY \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "data": {
      "legalName": "Test Company Pvt Ltd",
      "registrationNumber": "U72900KA2020PTC123456"
    }
  }'

# 4. Check status
curl -X GET http://localhost:4000/kyb/status \
  -H "Authorization: Bearer test-token"

# 5. Submit (after completing all sections)
curl -X POST http://localhost:4000/kyb/$KYB_ID/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token"
```

---

## 📝 Notes

1. **Replace `{kybId}`** with the actual KYB ID returned from `/kyb/start`
2. **Replace `{uid}`** in admin routes with the user's uid (e.g., `test-user-123`)
3. **Test Mode**: Make sure `TEST_MODE=true` is set in your environment
4. **Server Port**: Adjust port if your server runs on a different port (default: 4000)
5. **All sections must be completed** before submission
6. **Ownership must total 100%** in OWNERSHIP_STRUCTURE section
7. **Admin routes require admin role** - use admin token format
8. **Unified Review API**: Use `/review` endpoint for all admin actions (recommended)
9. **Get Multiple Sections**: Use `/sections?keys=...` to fetch multiple sections in one request
10. **Review Actions**: All review actions (APPROVE, REJECT, ACTION_REQUIRED) require KYB status to be `UNDER_REVIEW`

---

## 🚨 Common Errors

### "KYB application not found"

- Make sure you've called `/kyb/start` first
- Check that you're using the correct `kybId`

### "Invalid status transition"

- Check current status with `/kyb/status`
- Follow the status lifecycle: NOT_STARTED → IN_PROGRESS → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED

### "KYB must be in UNDER_REVIEW status to perform {action} action"

- Review actions (APPROVE, REJECT, ACTION_REQUIRED) can only be performed when status is `UNDER_REVIEW`
- Make sure KYB has been submitted and moved to UNDER_REVIEW status

### "Missing required sections"

- Complete all 9 required sections before submission
- Check section status in `/kyb/status` response

### "Total ownership percentage must equal 100%"

- Sum of all owner percentages in OWNERSHIP_STRUCTURE must equal exactly 100

### "Forbidden: Insufficient permissions"

- Admin routes require admin role
- Use admin token: `test-admin-uid-admin-admin`

### "Invalid action. Must be APPROVE, REJECT, or ACTION_REQUIRED"

- Unified review API requires `action` field to be one of: APPROVE, REJECT, ACTION_REQUIRED

### "Rejection reason is required"

- REJECT action requires `rejectionReason` field

### "Section key is required"

- ACTION_REQUIRED action requires `sectionKey` field

---

## 🔍 Quick Health Check

```bash
# Check if server is running
curl http://localhost:4000/health

# Check test mode info (if test routes are enabled)
curl http://localhost:4000/test/info
```

---

## 💡 Tips

1. **Save KYB ID**: After starting KYB, save the `kybId` for all subsequent requests
2. **Check Status First**: Use `/kyb/status` to see current state and completed sections
3. **Test Section by Section**: Update one section at a time and verify with GET request
4. **Use jq for JSON**: Install `jq` to parse JSON responses easily: `brew install jq` or `apt-get install jq`
5. **Test Mode Warning**: Remember test mode bypasses Firebase - never use in production!
6. **Use Unified Review API**: Prefer `/review` endpoint over individual approve/reject/action-required endpoints
7. **Fetch Multiple Sections**: Use `/sections?keys=...` to reduce API calls when you need multiple sections
8. **Review Status Check**: Before performing review actions, ensure KYB is in `UNDER_REVIEW` status

---

## 📊 API Summary Table

| Endpoint                           | Method | Purpose                                         | Auth        | New/Updated |
| ---------------------------------- | ------ | ----------------------------------------------- | ----------- | ----------- |
| `/kyb/start`                       | POST   | Start KYB process                               | Yes         | -           |
| `/kyb/status`                      | GET    | Get KYB status                                  | Yes         | -           |
| `/kyb/:kybId/section/:sectionKey`  | GET    | Get single section                              | Yes         | -           |
| `/kyb/:kybId/sections`             | GET    | Get multiple sections                           | Yes         | ✅ NEW      |
| `/kyb/:kybId/section/:sectionKey`  | PUT    | Update section                                  | Yes         | -           |
| `/kyb/:kybId/submit`               | POST   | Submit KYB                                      | Yes         | -           |
| `/kyb/:kybId/documents`            | POST   | Upload document                                 | Yes         | -           |
| `/kyb/:kybId/documents`            | GET    | Get documents                                   | Yes         | -           |
| `/kyb/:uid/:kybId/review`          | POST   | Unified review (APPROVE/REJECT/ACTION_REQUIRED) | Yes (Admin) | ✅ NEW      |
| `/kyb/:uid/:kybId/approve`         | POST   | Approve KYB                                     | Yes (Admin) | Legacy      |
| `/kyb/:uid/:kybId/reject`          | POST   | Reject KYB                                      | Yes (Admin) | Legacy      |
| `/kyb/:uid/:kybId/action-required` | POST   | Mark action required                            | Yes (Admin) | Legacy      |

---

**Test Token**: `test-token` (or just `test`)

**No Firebase needed!** Just:

1. Set `TEST_MODE=true` in `.env`
2. Use `Authorization: Bearer test-token` header
3. Start testing!

**Default Test User**:

- UID: `test-user-123`
- Email: `test@kapitor.com`
- Role: `user`

**Happy Testing! 🚀**
