# KYB API Changes Summary

## ✅ Changes Implemented

### Part 1: Unified Admin Review API

**New Endpoint:**
- `POST /kyb/:uid/:kybId/review` - Unified API for all admin review actions

**Replaces:**
- `POST /kyb/:uid/:kybId/approve`
- `POST /kyb/:uid/:kybId/reject`
- `POST /kyb/:uid/:kybId/action-required`

**Note:** Legacy endpoints still work for backward compatibility, but internally call the new unified `review()` method.

**Request Body:**
```json
{
  "action": "APPROVE" | "REJECT" | "ACTION_REQUIRED",
  "reviewedBy": "admin-user-id",
  "comments": "optional reviewer comments",
  
  // Only for APPROVE
  "validityPeriod": 365,
  
  // Only for REJECT
  "rejectionReason": "string",
  "rejectionCategory": "string",
  
  // Only for ACTION_REQUIRED
  "sectionKey": "BUSINESS_IDENTITY"
}
```

**Validation:**
- Requires admin role
- KYB must be in `UNDER_REVIEW` status
- Action-specific fields validated by Joi schema

---

### Part 2: Optimized Section GET API

**New Endpoint:**
- `GET /kyb/:kybId/sections` - Get multiple sections with query params

**Query Parameters:**
- `keys` (optional): Comma-separated list of section keys
  - Example: `?keys=BUSINESS_PROFILE,BUSINESS_ADDRESS`
  - If omitted, returns all sections

**Response:**
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
      }
    ]
  }
}
```

**Backward Compatibility:**
- `GET /kyb/:kybId/section/:sectionKey` still works
- Internally uses the same service method

---

## 📁 Files Modified

### Service Layer
- `src/services/business/kybService.js`
  - Added `review()` method (unified admin review)
  - Added `_handleApprove()`, `_handleReject()`, `_handleActionRequired()` (internal handlers)
  - Added `getSections()` method (param-based section fetching)
  - Updated `approve()`, `reject()`, `markActionRequired()` to call `review()` for backward compatibility

### Controller Layer
- `src/controllers/kybController.js`
  - Added `review()` method
  - Added `getSections()` method

### Routes
- `src/routes/kyb.js`
  - Added `POST /:uid/:kybId/review` route
  - Added `GET /:kybId/sections` route
  - Kept existing routes for backward compatibility

### Validators
- `src/validators/kybValidators.js`
  - Added `reviewSchema` with conditional validation based on action type
- `src/validators/index.js`
  - Exported `reviewSchema`

### Documentation
- `KYB_API_TESTING.md`
  - Added documentation for unified review API
  - Added documentation for sections GET API
  - Updated error messages section
  - Added API summary table

---

## 🔄 Backward Compatibility

✅ **All existing APIs continue to work:**
- `POST /kyb/:uid/:kybId/approve` → Internally calls `review()` with action="APPROVE"
- `POST /kyb/:uid/:kybId/reject` → Internally calls `review()` with action="REJECT"
- `POST /kyb/:uid/:kybId/action-required` → Internally calls `review()` with action="ACTION_REQUIRED"
- `GET /kyb/:kybId/section/:sectionKey` → Still works as before

---

## 🎯 Benefits

1. **Unified Review API**: Single endpoint for all admin actions reduces API surface area
2. **Better Validation**: Centralized validation logic for review actions
3. **Optimized Section Fetching**: Fetch multiple sections in one request
4. **Backward Compatible**: No breaking changes for existing consumers
5. **Cleaner Code**: Service layer reuse reduces duplication

---

## 🧪 Testing

See `KYB_API_TESTING.md` for complete testing guide with cURL examples.

**Quick Test:**
```bash
# Unified Review API
curl -X POST http://localhost:4000/kyb/{uid}/{kybId}/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-admin-uid-admin-admin" \
  -d '{"action": "APPROVE", "validityPeriod": 365}'

# Get Multiple Sections
curl -X GET "http://localhost:4000/kyb/{kybId}/sections?keys=BUSINESS_PROFILE,BUSINESS_ADDRESS" \
  -H "Authorization: Bearer test-token"
```

---

## ✅ Implementation Checklist

- [x] Unified review API implemented
- [x] Status validation (UNDER_REVIEW required)
- [x] Action-specific field validation
- [x] Backward compatibility maintained
- [x] Param-based sections GET API
- [x] Service layer reuse
- [x] Controller methods added
- [x] Routes registered
- [x] Validators updated
- [x] Documentation updated
- [x] No breaking changes
- [x] Production-ready code

