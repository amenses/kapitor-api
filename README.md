# Kapitor API — Project Overview

This README is a comprehensive project overview, API catalog, and integration guide for the Kapitor backend API.

---

## 1. Architecture Summary

### Architecture Pattern
The codebase follows a layered MVC style with a service-repository pattern:

- **Routes** define endpoints and bind controllers.
- **Controllers** handle HTTP requests and responses.
- **Services** contain business logic and orchestration.
- **Repositories** encapsulate database access with Mongoose models.
- **Models** define MongoDB schemas and indexes.
- **Middlewares** handle auth, RBAC, validation, and errors.

### Folder Structure

```
src/
├── config/          # Environment, database, Firebase, DigiLocker config
├── controllers/     # Request handlers
├── crons/           # Scheduled jobs (deposit confirmations)
├── listeners/       # WebSocket listeners (USDT transfers)
├── middlewares/     # Auth, RBAC, errors, notFound
├── models/          # Mongoose schemas
├── repos/           # Database repositories
├── routes/          # Express routing modules
├── services/        # Business and external integrations
├── utils/           # Response helpers, validation, crypto, test helpers
├── validators/      # Joi request validation schemas
└── server.js        # App bootstrap and runtime setup
```

### Configuration & Environment Strategy

- **dotenv** loads `.env` at startup in `src/config/env.js`.
- `validateEnv()` enforces required env vars (currently `MONGODB_URI`).
- **Firebase** supports:
  - `FIREBASE_SERVICE_ACCOUNT_BASE64` (base64 JSON)
  - `GOOGLE_APPLICATION_CREDENTIALS` (file path)
  - `FIREBASE_SERVICE_ACCOUNT_JSON` (project-relative JSON path)
- **Test Mode**:
  - `TEST_MODE=true` bypasses Firebase verification and enables `/test` routes.
- **DigiLocker** requires `DIGILOCKER_CLIENT_ID`, `DIGILOCKER_CLIENT_SECRET`, `DIGILOCKER_REDIRECT_URI`.
- **Blockchain** listeners/crons require:
  - `RPC_WS_URL` (WebSocket for live USDT events)
  - `RPC_HTTP_URL` (HTTP RPC for confirmations cron)
  - `USDT_ADDRESS` (ERC20 contract)
  - `CONFIRMATION_TARGET` (default 6)

### Database Connections & Services

- MongoDB Atlas connection is established in `src/config/database.js` via Mongoose.
- Repositories (in `src/repos/`) expose data access methods.
- Business services (in `src/services/business/`) orchestrate multiple repos.
- External services (in `src/services/external/`) integrate third-party APIs (DigiLocker).

### Middleware & Shared Modules

- **Auth**: `verifyFirebaseToken` (Firebase ID tokens; test mode bypass).
- **RBAC**: `requireRole` checks Firebase custom claims and DB roles.
- **Validation**: `validate` applies Joi schemas (body/query/params).
- **Error handling**: centralized in `errorHandler`.
- **Response**: `sendSuccess` and `sendError` enforce consistent response shape.
- **Crypto**: AES-256-CBC encryption for wallet private keys.

### Key Dependencies & Usage

- `express` — HTTP server & routing
- `mongoose` — MongoDB ORM
- `firebase-admin` — Firebase ID token verification & custom claims
- `joi` — Request validation
- `ethers` — Blockchain WebSocket/HTTP providers, wallet ops
- `bcrypt` — Password hashing (wallet unlock)
- `axios` — REST calls to Firebase test token exchange
- `node-cron` — Scheduled confirmation job
- `helmet`, `cors`, `morgan` — Security, CORS, logging

---

## 2. API Catalog (Complete List)

**Base URL**: `http://localhost:4000` (default)

Common response envelope:

```json
{
  "success": true,
  "data": { "..." : "..." }
}
```

Error envelope:

```json
{
  "success": false,
  "error": "Message",
  "details": [ { "field": "path", "message": "reason" } ]
}
```

### Health

**GET /health**  
**Location**: `src/server.js`  
**Purpose**: Health check  
**Auth**: None  
**Request**: none  
**Success (200)**:
```json
{ "status": "ok", "timestamp": "2025-01-01T00:00:00.000Z" }
```
**Errors**: none

---

### Users

**POST /users/bootstrap**  
**Location**: `src/routes/users.js`, `src/controllers/userController.js`  
**Purpose**: Create or update user and initialize profile/KYC status  
**Auth**: Firebase bearer token (or test mode)  
**Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`  
**Body**:
```json
{
  "referralCode": "TEST123",
  "deviceInfo": { "platform": "ios", "version": "1.0.0" }
}
```
**Validation**: `bootstrapSchema` (referralCode max 32, deviceInfo object)  
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "uid": "firebase-uid",
      "email": "user@kapitor.com",
      "phone": "+1234567890",
      "role": "user"
    }
  }
}
```
**Errors**:
- 401 missing/invalid token
- 500 for unexpected errors

**GET /users/me**  
**Location**: `src/routes/users.js`  
**Purpose**: Get user profile, profile info, and KYC status  
**Auth**: Firebase bearer token  
**Headers**: `Authorization: Bearer <token>`  
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "user": { "uid": "firebase-uid", "email": "user@kapitor.com" },
    "profile": { "fullName": "Jane Doe", "preferences": {} },
    "kycStatus": { "status": "not_started" }
  }
}
```
**Errors**:
- 401 missing/invalid token
- 500 if user not found or other error

**PATCH /users/me**  
**Location**: `src/routes/users.js`  
**Purpose**: Update profile fields and/or phone  
**Auth**: Firebase bearer token  
**Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`  
**Body**:
```json
{
  "fullName": "Jane Doe",
  "phone": "+19998887777",
  "preferences": { "theme": "light" }
}
```
**Validation**: `updateProfileSchema`  
**Success (200)**:
```json
{ "success": true, "data": { "status": "ok" } }
```
**Errors**:
- 400 validation error
- 401 missing/invalid token
- 500 unexpected error

**GET /users/roles**  
**Location**: `src/routes/users.js`  
**Purpose**: Get roles assigned to the user  
**Auth**: Firebase bearer token  
**Headers**: `Authorization: Bearer <token>`  
**Success (200)**:
```json
{ "success": true, "data": { "roles": ["user"] } }
```
**Errors**:
- 401 missing/invalid token
- 500 unexpected error

---

### KYC

**GET /kyc/status**  
**Location**: `src/routes/kyc.js`  
**Purpose**: Retrieve KYC status for user  
**Auth**: Firebase bearer token  
**Headers**: `Authorization: Bearer <token>`  
**Success (200)**:
```json
{ "success": true, "data": { "kyc": { "status": "not_started" } } }
```
**Errors**:
- 401 missing/invalid token
- 500 unexpected error

**POST /kyc**  
**Location**: `src/routes/kyc.js`  
**Purpose**: Update KYC status and/or documents  
**Auth**: Firebase bearer token  
**Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`  
**Body**:
```json
{
  "aadhaarFrontUrl": "https://files.example/aadhaar-front.jpg",
  "aadhaarBackUrl": "https://files.example/aadhaar-back.jpg",
  "panUrl": "https://files.example/pan.jpg",
  "selfieUrl": "https://files.example/selfie.jpg",
  "status": "submitted"
}
```
**Validation**: `kycUpdateSchema` (URLs must be valid URIs; status enum)  
**Success (200)**:
```json
{ "success": true, "data": { "status": "submitted" } }
```
**Errors**:
- 400 validation error
- 401 missing/invalid token
- 500 unexpected error

**GET /kyc/digilocker/authorize**  
**Location**: `src/routes/kyc.js`  
**Purpose**: Get DigiLocker OAuth URL  
**Auth**: Firebase bearer token  
**Headers**: `Authorization: Bearer <token>`  
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "url": "https://api.digitallocker.gov.in/public/oauth2/authorize?...",
    "state": "random-state"
  }
}
```
**Errors**:
- 401 missing/invalid token
- 500 DigiLocker not configured or other error

**POST /kyc/digilocker/callback**  
**Location**: `src/routes/kyc.js`  
**Purpose**: Exchange DigiLocker auth code and store tokens  
**Auth**: Firebase bearer token  
**Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`  
**Body**:
```json
{ "code": "auth-code", "state": "optional" }
```
**Validation**: `digilockerCallbackSchema` (code required)  
**Success (200)**:
```json
{ "success": true, "data": { "status": "linked", "expiresAt": "2025-01-01T00:00:00.000Z" } }
```
**Errors**:
- 400 validation error
- 401 missing/invalid token
- 500 token exchange failure or config error

**GET /kyc/digilocker/documents**  
**Location**: `src/routes/kyc.js`  
**Purpose**: Fetch DigiLocker-issued documents  
**Auth**: Firebase bearer token  
**Headers**: `Authorization: Bearer <token>`  
**Success (200)**:
```json
{ "success": true, "data": { "documents": [] } }
```
**Errors**:
- 401 missing/invalid token
- 500 DigiLocker not linked/expired or API failure

---

### Wallet

**POST /wallet/create**  
**Location**: `src/routes/wallet.js`  
**Purpose**: Create a custodial wallet and return mnemonic once  
**Auth**: Firebase bearer token  
**Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`  
**Body**:
```json
{ "password": "strongPassword123", "confirmPassword": "strongPassword123" }
```
**Validation**: `createWalletSchema` (min length 8)  
**Success (201)**:
```json
{
  "success": true,
  "data": {
    "message": "Wallet created (save mnemonic securely)",
    "uid": "firebase-uid",
    "mnemonic": "word1 word2 word3 ..."
  }
}
```
**Errors**:
- 400 validation error
- 401 missing/invalid token
- 500 wallet exists or other error

**POST /wallet/confirm-mnemonic**  
**Location**: `src/routes/wallet.js`  
**Purpose**: Verify mnemonic words for wallet activation  
**Auth**: Firebase bearer token  
**Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`  
**Body**:
```json
{ "answers": { "1": "apple", "5": "rocket", "12": "river" } }
```
**Validation**: `confirmMnemonicSchema` (numeric keys, string values)  
**Success (200)**:
```json
{ "success": true, "data": { "message": "Mnemonic verified successfully", "address": "0x..." } }
```
**Errors**:
- 400 validation error
- 401 missing/invalid token
- 500 mnemonic mismatch or other error

**POST /wallet/unlock**  
**Location**: `src/routes/wallet.js`  
**Purpose**: Unlock wallet using password (verifies mnemonic flag and password)  
**Auth**: Firebase bearer token  
**Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`  
**Body**:
```json
{ "password": "strongPassword123" }
```
**Validation**: `unlockSchema`  
**Success (200)**:
```json
{ "success": true, "data": { "message": "Wallet unlocked", "address": "0x..." } }
```
**Errors**:
- 400 validation error
- 401 missing/invalid token
- 500 invalid password or mnemonic not verified

---

### Admin (Admin Role Required)

**POST /admin/users/:uid/roles**  
**Location**: `src/routes/admin.js`  
**Purpose**: Assign a role to a user and set Firebase custom claim  
**Auth**: Firebase bearer token + admin role  
**Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`  
**URL Params**: `uid` (string)  
**Body**:
```json
{ "role": "admin" }
```
**Validation**: `assignRoleSchema`  
**Success (200)**:
```json
{ "success": true, "data": { "status": "ok", "role": "admin" } }
```
**Errors**:
- 400 validation error
- 401 missing/invalid token
- 403 insufficient role
- 500 unexpected error

**GET /admin/users**  
**Location**: `src/routes/admin.js`  
**Purpose**: List users with pagination  
**Auth**: Firebase bearer token + admin role  
**Headers**: `Authorization: Bearer <token>`  
**Query Params**:
- `limit` (1–200, default 50)
- `offset` (0+, default 0)
**Validation**: `listUsersQuerySchema`  
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "data": [{ "uid": "uid", "email": "user@kapitor.com", "kyc_status": "not_started" }],
    "limit": 50,
    "offset": 0,
    "total": 123
  }
}
```
**Errors**:
- 400 validation error
- 401 missing/invalid token
- 403 insufficient role
- 500 unexpected error

---

### Test Mode (Only when `TEST_MODE=true`)

**GET /test/info**  
**Location**: `src/routes/test.js`  
**Purpose**: Show test mode info and example requests  
**Auth**: None  
**Success (200)**: Test mode info, example tokens, curl commands  
**Errors**: 403 if not in test mode

**GET /test/user**  
**Location**: `src/routes/test.js`  
**Purpose**: Return a test user object  
**Auth**: None  
**Success (200)**: Test user object and role  
**Errors**: 403 if not in test mode

**GET /test/token**  
**Location**: `src/routes/test.js`  
**Purpose**: Generate Firebase token (custom token or ID token if `FIREBASE_API_KEY`)  
**Auth**: None  
**Query Params**:
- `uid` (string)
- `role` (string)
- `email` (string)
**Success (200)**: token + user metadata  
**Errors**: 500 token generation errors

**POST /test/token**  
**Location**: `src/routes/test.js`  
**Purpose**: Generate Firebase token with custom claims  
**Auth**: None  
**Body**:
```json
{
  "uid": "test-user-123",
  "role": "admin",
  "email": "admin@kapitor.com",
  "claims": { "tier": "gold" }
}
```
**Success (200)**: token + user metadata  
**Errors**: 500 token generation errors

---

## 3. API Behaviour & Logic (High-Level)

### Users

- **POST /users/bootstrap**
  - Upserts user record (`users` collection).
  - Upserts profile (`user_profiles`).
  - Upserts KYC status (`kyc_status`).
  - Optionally saves a bootstrap event (`user_bootstrap_events`).
  - Ensures Firebase custom claim `role` exists (default `user`).

- **GET /users/me**
  - Fetches user, profile, and KYC status in parallel.
  - Returns combined object.

- **PATCH /users/me**
  - Updates `users.phone` if provided.
  - Updates `user_profiles.fullName` or `preferences` if provided.

- **GET /users/roles**
  - Reads roles from `user_roles` + `roles`.

### KYC

- **GET /kyc/status**
  - Reads KYC status from `kyc_status`.

- **POST /kyc**
  - Filters document URLs (ignores empty).
  - Upserts KYC status and/or KYC documents.
  - Auto-sets `submittedAt` or `verifiedAt` timestamps when status changes.

- **GET /kyc/digilocker/authorize**
  - Builds OAuth authorize URL based on DigiLocker config.

- **POST /kyc/digilocker/callback**
  - Exchanges code for token and persists tokens.

- **GET /kyc/digilocker/documents**
  - Fetches documents from DigiLocker API.
  - Stores a snapshot in `kyc_documents`.

### Wallet

- **POST /wallet/create**
  - Validates passwords and ensures no wallet exists.
  - Creates Ethereum wallet via `ethers`.
  - Encrypts private key with AES-256-CBC.
  - Hashes password via bcrypt.
  - Saves wallet data and returns mnemonic once.

- **POST /wallet/confirm-mnemonic**
  - Validates mnemonic answers vs stored words.
  - Sets `verified: true` on wallet.

- **POST /wallet/unlock**
  - Verifies wallet exists, mnemonic is verified, and password is correct.
  - Decrypts private key and returns address.

### Admin

- **POST /admin/users/:uid/roles**
  - Creates role if missing.
  - Assigns user-role mapping in DB.
  - Updates Firebase custom claims.

- **GET /admin/users**
  - Lists users with pagination.
  - Enriches each user with KYC status.

### Test Mode

- Provides helper endpoints for testing and token generation.
  - Uses `firebase-admin` to issue custom tokens.
  - Optionally exchanges for ID tokens if `FIREBASE_API_KEY` is set.

---

## 4. Integration Guide (Frontend Perspective)

### Auth (Firebase)

1. Authenticate user with Firebase on the frontend.
2. Get an ID token using Firebase client SDK.
3. Send requests with:
   - `Authorization: Bearer <idToken>`
   - `Content-Type: application/json`

Example (Axios):
```js
const token = await firebase.auth().currentUser.getIdToken();
const res = await axios.get("/users/me", {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Users

- **Bootstrap on first login**
  - `POST /users/bootstrap`
  - Send referral/device info.
  - Store returned user info.

Example (fetch):
```js
await fetch("/users/bootstrap", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({ referralCode: "ABC123" })
});
```

UI Flow:
- After login → call `/users/bootstrap` once → redirect to profile/KYC.

### KYC

- **Update documents or status**
  - `POST /kyc`
  - Upload files via your storage layer, then send URLs.

Example:
```js
await axios.post("/kyc", {
  status: "submitted",
  panUrl: "https://..."
}, { headers: { Authorization: `Bearer ${token}` }});
```

UI Flow:
- Upload docs → call `/kyc` → show “submitted” status → admin verification.

### Wallet

- **Create wallet**
  - `POST /wallet/create`
  - Show mnemonic to user and confirm.

- **Confirm mnemonic**
  - `POST /wallet/confirm-mnemonic`

Example:
```js
await axios.post("/wallet/confirm-mnemonic", {
  answers: { "1": "word1", "5": "word5", "12": "word12" }
}, { headers: { Authorization: `Bearer ${token}` }});
```

UI Flow:
- Create wallet → show mnemonic → user confirms → unlock on login.

### Admin

- **Assign roles**
  - `POST /admin/users/:uid/roles`
  - Only admin users can call this endpoint.

Example:
```js
await axios.post(`/admin/users/${uid}/roles`, {
  role: "admin"
}, { headers: { Authorization: `Bearer ${token}` }});
```

### Test Mode

- Use `/test/token` to generate tokens without Firebase client SDK.
- Use `/test/info` to get curl examples.

UI Flow:
- Set `TEST_MODE=true` → call `/test/token` → use returned token to call APIs.

---

## 5. High-Level Flow Diagrams

### Authentication Flow
```
Frontend → Firebase Login → Firebase ID Token
     ↓
Backend Auth Middleware → verifyFirebaseToken → attach req.user
```

### User Bootstrap Flow
```
Frontend → POST /users/bootstrap
  → UserService.bootstrap
     → UserRepo.upsert
     → UserProfileRepo.upsert
     → KycRepo.upsertStatus
     → UserBootstrapRepo.create (optional)
     → Firebase custom claims
```

### KYC Update Flow
```
Frontend → POST /kyc
  → KycService.update
     → KycRepo.upsertStatus
     → KycRepo.upsertDocuments
```

### Wallet Creation + Confirmation Flow
```
Frontend → POST /wallet/create
  → WalletService.create
     → ethers.Wallet.createRandom
     → encrypt private key
     → bcrypt.hash password
     → WalletDetailsRepo.create
     ↓
Frontend shows mnemonic
     ↓
Frontend → POST /wallet/confirm-mnemonic
  → WalletService.confirmMnemonic → set verified=true
```

### Deposit Confirmation Flow
```
USDT Listener (WebSocket) OR Cron (HTTP RPC)
  → DepositRequestService.recordBlockchainDeposit
  → updateConfirmations
  → confirmDeposit when confirmations >= target
```

---

## 6. Glossary

- **UID**: Firebase user ID.
- **Custom Claims**: Roles stored in Firebase tokens.
- **KYC**: Know Your Customer verification status/documents.
- **Bootstrap**: First-time user setup.
- **WalletDetails**: Encrypted custodial wallet data.
- **DepositRequest**: On-chain deposit tracking record.
- **Test Mode**: Bypass Firebase and use `/test` routes.

---

## 7. API Contract Summary Table

| Endpoint | Method | Purpose | Auth | Returns |
|----------|--------|---------|------|---------|
| /health | GET | Health check | No | status + timestamp |
| /users/bootstrap | POST | Bootstrap user | Yes | user info |
| /users/me | GET | Get profile | Yes | user + profile + KYC |
| /users/me | PATCH | Update profile | Yes | status ok |
| /users/roles | GET | List roles | Yes | roles array |
| /kyc/status | GET | Get KYC status | Yes | kyc object |
| /kyc | POST | Update KYC | Yes | status |
| /kyc/digilocker/authorize | GET | DigiLocker auth URL | Yes | url + state |
| /kyc/digilocker/callback | POST | Link DigiLocker | Yes | link status |
| /kyc/digilocker/documents | GET | Fetch DigiLocker docs | Yes | documents |
| /wallet/create | POST | Create wallet | Yes | mnemonic + uid |
| /wallet/confirm-mnemonic | POST | Confirm mnemonic | Yes | wallet address |
| /wallet/unlock | POST | Unlock wallet | Yes | wallet address |
| /admin/users/:uid/roles | POST | Assign role | Admin | status + role |
| /admin/users | GET | List users | Admin | user list |
| /test/info | GET | Test mode info | No | test examples |
| /test/user | GET | Test user | No | user object |
| /test/token | GET | Test token | No | token + metadata |
| /test/token | POST | Test token | No | token + metadata |

---

## Environment Setup Quick Start

1. `cp .env.example .env`
2. Set at minimum:
   - `MONGODB_URI`
   - Firebase service account (base64 or file path)
3. For blockchain features:
   - `RPC_WS_URL`, `RPC_HTTP_URL`, `USDT_ADDRESS`, `CONFIRMATION_TARGET`
4. Optional:
   - `TEST_MODE=true` to enable test routes

