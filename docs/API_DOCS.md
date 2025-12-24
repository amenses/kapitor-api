Kapitor Backend API (Firebase Auth + Node + MySQL)

Base URL: `http://localhost:4000` (change per environment)  
Auth: All endpoints except `/health` require `Authorization: Bearer <Firebase ID token>` obtained from Firebase Auth in Flutter (`await user.getIdToken(true)`).

 Conventions
- Content-Type: `application/json`
- Timestamps: ISO strings
- Errors: `{ "error": "<message>" }`

 Health
 GET `/health`
- Purpose: Liveness check
- Auth: none
- Response: `{ "status": "ok" }`

 Users
 POST `/users/bootstrap`
- Purpose: First call after Firebase sign-in; upsert user into MySQL, seed defaults.
- Body:
json
{ "referralCode": "ABC123", "deviceInfo": { "platform": "android", "appVersion": "1.2.3" } }

- Response 200:
json
{ "user": { "uid": "firebase-uid", "email": "a@b.com", "phone": "+91...", "role": "user" } }

- Notes: Sets default custom claim `role=user` if absent. Idempotent.

 GET `/users/me`
- Purpose: Fetch hydrated profile from MySQL.
- Response 200:
json
{
  "user": {
    "uid": "firebase-uid",
    "email": "a@b.com",
    "phone": "+91...",
    "display_name": "John Doe",
    "photo_url": "...",
    "provider_ids": ["password"]
  },
  "profile": {
    "uid": "firebase-uid",
    "full_name": "John Doe",
    "dob": null,
    "address_json": null,
    "preferences": {}
  },
  "kycStatus": {
    "uid": "firebase-uid",
    "status": "not_started",
    "rejection_reason": null,
    "submitted_at": null,
    "verified_at": null
  }
}


 PATCH `/users/me`
- Purpose: Update app-specific profile (not email/password).
- Body (any subset):
json
{ "fullName": "John Doe", "phone": "+91...", "preferences": { "lang": "en" } }

- Response 200: `{ "status": "ok" }`

 GET `/users/roles`
- Purpose: List roles from MySQL for current user.
- Response 200:
json
{ "roles": ["user"] }


 KYC
 GET `/kyc/status`
- Purpose: Fetch KYC state.
- Response 200:
json
{ "kyc": { "uid": "firebase-uid", "status": "not_started", "rejection_reason": null, "submitted_at": null, "verified_at": null } }


 POST `/kyc`
- Purpose: Submit/update KYC document URLs and status.
- Body (any subset):
json
{
  "aadhaarFrontUrl": "https://storage/.../front.png",
  "aadhaarBackUrl": "https://storage/.../back.png",
  "panUrl": "https://storage/.../pan.png",
  "selfieUrl": "https://storage/.../selfie.png",
  "status": "submitted"
}

- Response 200:
json
{ "status": "submitted" }

- Notes: Upload files via signed URLs to storage; store only URLs here.

 GET `/kyc/digilocker/authorize`
- Purpose: Provide DigiLocker OAuth authorization URL for the user to open in a web view.
- Response 200:
json
{ "url": "https://api.digitallocker.gov.in/public/oauth2/authorize?...",
  "state": "random-state-hex" }

- Notes: Frontend should launch this URL; keep `state` to echo back on callback handling if desired.

 POST `/kyc/digilocker/callback`
- Purpose: Exchange DigiLocker auth code for tokens and link to the user.
- Body:
json
{ "code": "<oauth_code>", "state": "<state-from-authorize>" }

- Response 200:
json
{ "status": "linked", "expiresAt": "2025-01-01T00:00:00.000Z", "scope": "profile issuer" }

- Errors: 400 (missing code), 502 (DigiLocker token exchange failed), 500 (not configured).

 GET `/kyc/digilocker/documents`
- Purpose: Fetch issued documents from DigiLocker using stored access token; store snapshot in `kyc_documents`.
- Response 200:
json
{ "documents": [ /* DigiLocker response passthrough */ ] }

- Errors: 400 (not linked), 502 (DigiLocker fetch failed), 500 (not configured).

 Admin (requires role `admin`)
 POST `/admin/users/:uid/roles`
- Purpose: Assign a role to a user (DB + Firebase custom claim).
- Body:
json
{ "role": "admin" }

- Response 200:
json
{ "status": "ok", "role": "admin" }


 GET `/admin/users?limit=50&offset=0`
- Purpose: List users with basic KYC info.
- Response 200:
json
{
  "data": [
    { "uid": "firebase-uid", "email": "a@b.com", "phone": "+91...", "kyc_status": "not_started" }
  ],
  "limit": 50,
  "offset": 0
}


 Error Codes (examples)
- 400: validation error (missing/invalid fields)
- 401: missing/invalid/expired Firebase ID token
- 403: insufficient role (admin routes)
- 404: not found
- 500: server error
- 502: upstream DigiLocker error (token exchange or document fetch)

 DB additions for DigiLocker
sql
CREATE TABLE digilocker_tokens (
  uid           VARCHAR(128) PRIMARY KEY,
  access_token  TEXT NOT NULL,
  refresh_token TEXT NULL,
  token_type    VARCHAR(32) DEFAULT 'Bearer',
  scope         TEXT NULL,
  expires_at    DATETIME NULL,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uid) REFERENCES users(uid)
) ENGINE=InnoDB;


 Frontend Usage Notes (Flutter)
1) After Firebase sign-in: `final idToken = await user.getIdToken(true);`
2) Call `POST /users/bootstrap` once (Bearer token).
3) Subsequent calls: always send `Authorization: Bearer <idToken>`.
4) On 401: refresh token once (`getIdToken(true)`), retry; if still 401, force re-login.
5) KYC uploads: get signed URLs from your storage flow, then POST the URLs to `/kyc`.

