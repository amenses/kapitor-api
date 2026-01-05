# KYB Document Upload Completion Fix

## 🔍 Issue Identified

**Problem**: KYB document uploads were not marking sections as completed, causing submit API to fail with "Missing required sections" error.

**Root Causes**:
1. Document-based sections (like `STATUTORY_DOCUMENTS`) were not automatically marked as `COMPLETED` when documents were uploaded
2. The `_isSectionComplete()` method for `STATUTORY_DOCUMENTS` always returned `true` without checking if documents actually exist
3. The submit validation didn't verify documents for document-based sections

---

## ✅ Fixes Applied

### Fix 1: Enhanced `uploadDocument()` Method

**Location**: `src/services/business/kybService.js`

**Changes**:
- After creating a document, automatically mark the section as `COMPLETED` if it's a document-based section
- Only applies to document-based sections (currently `STATUTORY_DOCUMENTS`)
- Ensures section is created/updated with proper status

**Code**:
```javascript
// Document-based sections: STATUTORY_DOCUMENTS, and potentially others with documents
const documentBasedSections = ['STATUTORY_DOCUMENTS'];

if (documentBasedSections.includes(sectionKey)) {
  const docCount = await kybRepo.countDocumentsByUidAndSection(uid, sectionKey);
  if (docCount > 0) {
    // Ensure section exists and is marked as COMPLETED
    await kybRepo.upsertSection(uid, sectionKey, {
      status: 'COMPLETED',
      completedAt: new Date(),
      actionRequired: false,
      actionComments: null,
      data: {}, // Empty data for document-based sections
    });
  }
}
```

### Fix 2: Improved `_isSectionComplete()` Method

**Location**: `src/services/business/kybService.js`

**Changes**:
- Added `documentCount` parameter to check document-based sections properly
- `STATUTORY_DOCUMENTS` now requires `documentCount > 0` to be considered complete
- Other sections remain unchanged

**Before**:
```javascript
case 'STATUTORY_DOCUMENTS':
  return true; // Always true, doesn't check documents
```

**After**:
```javascript
case 'STATUTORY_DOCUMENTS':
  // Completion based on document uploads - at least one document required
  return documentCount > 0;
```

### Fix 3: Enhanced Submit Validation

**Location**: `src/services/business/kybService.js` - `submit()` method

**Changes**:
- Before checking missing sections, verify document-based sections have documents
- If documents exist but section status is not `COMPLETED`, automatically update it
- Prevents false "missing sections" errors

**Code**:
```javascript
// For document-based sections, also verify documents exist
const documentBasedSections = ['STATUTORY_DOCUMENTS'];
const completedSections = [];

for (const section of sections) {
  if (section.status === 'COMPLETED') {
    completedSections.push(section);
  } else if (documentBasedSections.includes(section.sectionKey)) {
    // For document-based sections, check if documents exist even if status is not COMPLETED
    const docCount = await kybRepo.countDocumentsByUidAndSection(uid, section.sectionKey);
    if (docCount > 0) {
      // Mark section as completed if documents exist
      await kybRepo.upsertSection(uid, section.sectionKey, {
        status: 'COMPLETED',
        completedAt: new Date(),
      });
      completedSections.push({ ...section, status: 'COMPLETED' });
    }
  }
}
```

---

## 🧪 Testing the Fix

### Test Flow:

1. **Start KYB**:
```bash
curl -X POST http://localhost:4000/kyb/start \
  -H "Authorization: Bearer test-token"
```

2. **Upload Document** (for STATUTORY_DOCUMENTS):
```bash
curl -X POST http://localhost:4000/kyb/{kybId}/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "sectionKey": "STATUTORY_DOCUMENTS",
    "documentType": "Certificate of Incorporation",
    "documentName": "COI.pdf",
    "fileUrl": "https://example.com/coi.pdf"
  }'
```

3. **Check Section Status**:
```bash
curl -X GET http://localhost:4000/kyb/{kybId}/section/STATUTORY_DOCUMENTS \
  -H "Authorization: Bearer test-token"
```

**Expected**: Section status should be `COMPLETED`

4. **Check Overall Status**:
```bash
curl -X GET http://localhost:4000/kyb/status \
  -H "Authorization: Bearer test-token"
```

**Expected**: `STATUTORY_DOCUMENTS` section should show `status: "COMPLETED"`

5. **Submit KYB** (after completing all other sections):
```bash
curl -X POST http://localhost:4000/kyb/{kybId}/submit \
  -H "Authorization: Bearer test-token"
```

**Expected**: Should succeed without "Missing required sections" error

---

## 📋 Document-Based Sections

Currently, the following sections are treated as document-based:
- `STATUTORY_DOCUMENTS` - Requires at least one document to be complete

**Note**: Other sections like `BUSINESS_ADDRESS` and `MANAGEMENT_AUTHORITY` can have documents attached, but they also require data fields to be complete. Only `STATUTORY_DOCUMENTS` is purely document-based.

---

## 🔄 Expected Behavior

### Before Fix:
1. Upload document → Document created ✅
2. Section status → Still `NOT_STARTED` or `IN_PROGRESS` ❌
3. Submit KYB → Fails with "Missing required sections: STATUTORY_DOCUMENTS" ❌

### After Fix:
1. Upload document → Document created ✅
2. Section status → Automatically set to `COMPLETED` ✅
3. Submit KYB → Succeeds (if all other sections completed) ✅

---

## 🎯 Key Improvements

1. **Automatic Section Completion**: Documents automatically mark sections as complete
2. **Proper Validation**: `_isSectionComplete()` now checks documents for document-based sections
3. **Submit Safety Net**: Submit method double-checks document-based sections even if status wasn't updated
4. **No Breaking Changes**: Existing functionality remains intact

---

## ✅ Verification Checklist

- [x] Document upload marks section as COMPLETED
- [x] Section status shows COMPLETED in getStatus API
- [x] Submit API passes when all sections (including document-based) are complete
- [x] Backward compatibility maintained
- [x] No breaking changes to existing APIs

---

**Fix Applied**: Document uploads now properly mark sections as completed! 🎉

