# Kapitor Backend API - Project Overview

## 📌 1. Architecture Summary

### Architecture Pattern
This project follows a **Layered Architecture** with **Service-Repository Pattern** and **MVC (Model-View-Controller)** structure:

- **Routes Layer**: Express route definitions (`src/routes/`)
- **Controllers Layer**: Request handlers that orchestrate business logic (`src/controllers/`)
- **Services Layer**: Business logic and orchestration (`src/services/business/`)
- **Repository Layer**: Data access abstraction (`src/repos/`)
- **Models Layer**: Mongoose schemas and data models (`src/models/`)
- **Middleware Layer**: Authentication, authorization, validation, error handling (`src/middlewares/`)
- **Configuration Layer**: Environment, database, Firebase, external services (`src/config/`)

### Folder Organization

```
src/
├── config/          # Configuration management
│   ├── database.js  # MongoDB connection
│   ├── firebase.js  # Firebase Admin SDK initialization
│   ├── digilocker.js # DigiLocker API configuration
│   ├── env.js       # Environment variables
│   └── index.js     # Barrel export
│
├── models/          # Mongoose schemas (data models)
│   ├── User.js
│   ├── UserProfile.js
│   ├── UserRole.js
│   ├── Role.js
│   ├── KycStatus.js
│   ├── KycDocument.js
│   ├── DigilockerToken.js
│   ├── WalletDetails.js
│   ├── DepositRequest.js
│   └── UserBootstrapEvent.js
│
├── repos/           # Repository pattern (data access layer)
│   ├── userRepo.js
│   ├── userProfileRepo.js
│   ├── roleRepo.js
│   ├── kycRepo.js
│   ├── digilockerRepo.js
│   ├── walletDetails.js
│   └── depositRequest.js
│
├── services/        # Business logic layer
│   ├── business/    # Internal business services
│   │   ├── userService.js
│   │   ├── kycService.js
│   │   ├── walletService.js
│   │   ├── adminService.js
│   │   └── depositRequestService.js
│   └── external/    # Third-party integrations
│       └── digilockerService.js
│
├── controllers/     # Request handlers (MVC controllers)
│   ├── userController.js
│   ├── kycController.js
│   ├── walletController.js
│   └── adminController.js
│
├── routes/          # Express route definitions
│   ├── users.js
│   ├── kyc.js
│   ├── wallet.js
│   ├── admin.js
│   └── test.js (test mode only)
│
├── middlewares/     # Express middleware
│   ├── auth.js          # Firebase token verification
│   ├── rbac.js          # Role-based access control
│   ├── errorHandler.js  # Global error handler
│   └── notFound.js      # 404 handler
│
├── validators/      # Joi validation schemas
│   ├── userValidators.js
│   ├── kycValidators.js
│   ├── walletValidators.js
│   └── adminValidators.js
│
├── utils/           # Utility functions
│   ├── response.js      # Standardized API responses
│   ├── validation.js    # Joi validation middleware
│   ├── crypto.js        # Encryption/decryption
│   └── erc20.abi.js     # ERC20 ABI for blockchain
│
├── listeners/       # Real-time event listeners
│   └── usdt.listener.js # USDT transfer listener
│
├── crons/           # Scheduled jobs
│   ├── depositConfirm.cron.js
│   └── index.js
│
└── server.js        # Application entry point
```

### Configuration & Environment Strategy

**Environment Variables** (managed via `dotenv`):
- **Required**: `MONGODB_URI`
- **Firebase**: `FIREBASE_SERVICE_ACCOUNT_BASE64` OR `GOOGLE_APPLICATION_CREDENTIALS` OR `FIREBASE_SERVICE_ACCOUNT_JSON`
- **Optional**: `NODE_ENV`, `PORT`, `CORS_ALLOWED_ORIGINS`, `JWT_SECRET`, `RATE_LIMIT_*`, `TEST_MODE`, `RPC_WS_URL`, `RPC_HTTP_URL`, `USDT_ADDRESS`, `DIGILOCKER_*`

**Configuration Files**:
- `src/config/env.js`: Centralized environment variable access
- `src/config/database.js`: MongoDB connection management
- `src/config/firebase.js`: Firebase Admin SDK initialization
- `src/config/digilocker.js`: DigiLocker API configuration

### Database Organization

**MongoDB Atlas** with Mongoose ODM:
- Connection pooling with max 10 connections
- Automatic reconnection handling
- Graceful shutdown support

### Third-Party Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `mongoose` | MongoDB ODM |
| `firebase-admin` | Firebase Authentication & Admin SDK |
| `joi` | Request validation |
| `bcrypt` | Password hashing |
| `ethers` | Ethereum blockchain interaction |
| `node-cron` | Scheduled tasks |
| `axios` | HTTP client for external APIs |
| `helmet` | Security headers |
| `cors` | Cross-origin resource sharing |
| `morgan` | HTTP request logging |
| `dotenv` | Environment variable management |

---

## 📌 2. API Catalog (Complete List)

### Health Check

#### `GET /health`
- **Purpose**: Health check endpoint (no authentication required)
- **Module**: `src/server.js`
- **Request**: None
- **Response**:
  ```json
  {
    "status": "ok",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
  ```

---

### User Management APIs

#### `POST /users/bootstrap`
- **Purpose**: First-time user setup - creates user profile, KYC status, and sets default role
- **Module**: `src/routes/users.js` → `src/controllers/userController.js`
- **Authentication**: Required (Firebase ID token)
- **Request Body**:
  ```json
  {
    "referralCode": "string (max 32 chars, optional)",
    "deviceInfo": "object (optional)"
  }
  ```
- **Validation**: `bootstrapSchema` (Joi)
- **Response Success** (200):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "uid": "firebase-uid",
        "email": "user@example.com",
        "phone": "+1234567890",
        "role": "user"
      }
    }
  }
  ```
- **Response Errors**:
  - `400`: Validation error
  - `401`: Missing/invalid token
  - `500`: Server error

#### `GET /users/me`
- **Purpose**: Get current user's complete profile (user data, profile, KYC status)
- **Module**: `src/routes/users.js` → `src/controllers/userController.js`
- **Authentication**: Required
- **Request**: None
- **Response Success** (200):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "uid": "firebase-uid",
        "email": "user@example.com",
        "phone": "+1234567890",
        "displayName": "John Doe",
        "photoUrl": "https://...",
        "isKapitorWallet": false,
        "createdAt": "2024-01-15T10:30:00.000Z"
      },
      "profile": {
        "uid": "firebase-uid",
        "fullName": "John Doe",
        "dob": "1990-01-01",
        "preferences": {}
      },
      "kycStatus": {
        "uid": "firebase-uid",
        "status": "not_started",
        "submittedAt": null,
        "verifiedAt": null
      }
    }
  }
  ```
- **Response Errors**:
  - `401`: Missing/invalid token
  - `404`: User not found
  - `500`: Server error

#### `PATCH /users/me`
- **Purpose**: Update user profile (fullName, phone, preferences)
- **Module**: `src/routes/users.js` → `src/controllers/userController.js`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "fullName": "string (optional)",
    "phone": "string (max 32 chars, optional)",
    "preferences": "object (optional)"
  }
  ```
- **Validation**: `updateProfileSchema` (Joi)
- **Response Success** (200):
  ```json
  {
    "success": true,
    "data": {
      "status": "ok"
    }
  }
  ```
- **Response Errors**:
  - `400`: Validation error
  - `401`: Missing/invalid token
  - `500`: Server error

#### `GET /users/roles`
- **Purpose**: Get all roles assigned to current user
- **Module**: `src/routes/users.js` → `src/controllers/userController.js`
- **Authentication**: Required
- **Request**: None
- **Response Success** (200):
  ```json
  {
    "success": true,
    "data": {
      "roles": ["user", "admin"]
    }
  }
  ```
- **Response Errors**:
  - `401`: Missing/invalid token
  - `500`: Server error

---

### KYC (Know Your Customer) APIs

#### `GET /kyc/status`
- **Purpose**: Get current KYC verification status
- **Module**: `src/routes/kyc.js` → `src/controllers/kycController.js`
- **Authentication**: Required
- **Request**: None
- **Response Success** (200):
  ```json
  {
    "success": true,
    "data": {
      "kyc": {
        "uid": "firebase-uid",
        "status": "not_started | in_progress | submitted | verified | rejected",
        "rejectionReason": null,
        "submittedAt": null,
        "verifiedAt": null
      }
    }
  }
  ```
- **Response Errors**:
  - `401`: Missing/invalid token
  - `500`: Server error

#### `POST /kyc`
- **Purpose**: Update KYC documents and status
- **Module**: `src/routes/kyc.js` → `src/controllers/kycController.js`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "aadhaarFrontUrl": "https://... (optional, must be valid URI)",
    "aadhaarBackUrl": "https://... (optional, must be valid URI)",
    "panUrl": "https://... (optional, must be valid URI)",
    "selfieUrl": "https://... (optional, must be valid URI)",
    "status": "in_progress | submitted | verified | rejected (optional)"
  }
  ```
- **Validation**: `kycUpdateSchema` (Joi)
- **Response Success** (200):
  ```json
  {
    "success": true,
    "data": {
      "status": "submitted"
    }
  }
  ```
- **Response Errors**:
  - `400`: Validation error (invalid URLs, invalid status)
  - `401`: Missing/invalid token
  - `500`: Server error

#### `GET /kyc/digilocker/authorize`
- **Purpose**: Get DigiLocker OAuth authorization URL
- **Module**: `src/routes/kyc.js` → `src/controllers/kycController.js`
- **Authentication**: Required
- **Request**: None
- **Response Success** (200):
  ```json
  {
    "success": true,
    "data": {
      "url": "https://api.digitallocker.gov.in/public/oauth2/authorize?...",
      "state": "random-state-string"
    }
  }
  ```
- **Response Errors**:
  - `401`: Missing/invalid token
  - `500`: DigiLocker not configured or service error

#### `POST /kyc/digilocker/callback`
- **Purpose**: Handle DigiLocker OAuth callback - exchange code for tokens
- **Module**: `src/routes/kyc.js` → `src/controllers/kycController.js`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "code": "string (required)",
    "state": "string (optional)"
  }
  ```
- **Validation**: `digilockerCallbackSchema` (Joi)
- **Response Success** (200):
  ```json
  {
    "success": true,
    "data": {
      "status": "linked",
      "expiresAt": "2024-01-16T10:30:00.000Z",
      "scope": "profile issuer"
    }
  }
  ```
- **Response Errors**:
  - `400`: Validation error (missing code)
  - `401`: Missing/invalid token
  - `500`: DigiLocker token exchange failed

#### `GET /kyc/digilocker/documents`
- **Purpose**: Fetch and persist DigiLocker documents
- **Module**: `src/routes/kyc.js` → `src/controllers/kycController.js`
- **Authentication**: Required
- **Request**: None
- **Response Success** (200):
  ```json
  {
    "success": true,
    "data": {
      "documents": [
        {
          "docType": "AADHAAR",
          "docName": "Aadhaar Card",
          "uri": "https://..."
        }
      ]
    }
  }
  ```
- **Response Errors**:
  - `401`: Missing/invalid token
  - `400`: DigiLocker not linked or token expired
  - `500`: Failed to fetch documents

---

### Wallet Management APIs

#### `POST /wallet/create`
- **Purpose**: Create a new Ethereum wallet for the user
- **Module**: `src/routes/wallet.js` → `src/controllers/walletController.js`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "password": "string (min 8 chars, required)",
    "confirmPassword": "string (min 8 chars, required)"
  }
  ```
- **Validation**: `createWalletSchema` (Joi) - passwords must match
- **Response Success** (201):
  ```json
  {
    "success": true,
    "data": {
      "message": "Wallet created (save mnemonic securely)",
      "uid": "firebase-uid",
      "mnemonic": "word1 word2 word3 ... word12"
    }
  }
  ```
- **Response Errors**:
  - `400`: Validation error (passwords don't match, too short)
  - `401`: Missing/invalid token
  - `409`: Wallet already exists for this user
  - `500`: Server error

#### `POST /wallet/confirm-mnemonic`
- **Purpose**: Verify user's mnemonic phrase (backup verification)
- **Module**: `src/routes/wallet.js` → `src/controllers/walletController.js`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "answers": {
      "1": "word1",
      "5": "word5",
      "12": "word12"
    }
  }
  ```
- **Validation**: `confirmMnemonicSchema` (Joi) - answers object with numeric keys
- **Response Success** (200):
  ```json
  {
    "success": true,
    "data": {
      "message": "Mnemonic verified successfully",
      "address": "0x..."
    }
  }
  ```
- **Response Errors**:
  - `400`: Validation error or mnemonic verification failed
  - `401`: Missing/invalid token
  - `404`: Wallet not found
  - `500`: Server error

#### `POST /wallet/unlock`
- **Purpose**: Unlock wallet with password (returns wallet address)
- **Module**: `src/routes/wallet.js` → `src/controllers/walletController.js`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "password": "string (required)"
  }
  ```
- **Validation**: `unlockSchema` (Joi)
- **Response Success** (200):
  ```json
  {
    "success": true,
    "data": {
      "message": "Wallet unlocked",
      "address": "0x..."
    }
  }
  ```
- **Response Errors**:
  - `400`: Validation error, invalid password, or mnemonic not verified
  - `401`: Missing/invalid token
  - `404`: Wallet not found
  - `500`: Server error

---

### Admin APIs (Requires Admin Role)

#### `POST /admin/users/:uid/roles`
- **Purpose**: Assign a role to a user (updates both database and Firebase custom claims)
- **Module**: `src/routes/admin.js` → `src/controllers/adminController.js`
- **Authentication**: Required + Admin role
- **URL Parameters**:
  - `uid`: Firebase user ID (string)
- **Request Body**:
  ```json
  {
    "role": "string (required)"
  }
  ```
- **Validation**: `assignRoleSchema` (Joi)
- **Response Success** (200):
  ```json
  {
    "success": true,
    "data": {
      "status": "ok",
      "role": "admin"
    }
  }
  ```
- **Response Errors**:
  - `400`: Validation error
  - `401`: Missing/invalid token
  - `403`: Insufficient permissions (not admin)
  - `500`: Server error

#### `GET /admin/users`
- **Purpose**: List all users with pagination and KYC status
- **Module**: `src/routes/admin.js` → `src/controllers/adminController.js`
- **Authentication**: Required + Admin role
- **Query Parameters**:
  - `limit`: Number (1-200, default: 50)
  - `offset`: Number (min: 0, default: 0)
- **Response Success** (200):
  ```json
  {
    "success": true,
    "data": {
      "data": [
        {
          "uid": "firebase-uid",
          "email": "user@example.com",
          "phone": "+1234567890",
          "kyc_status": "verified"
        }
      ],
      "limit": 50,
      "offset": 0,
      "total": 100
    }
  }
  ```
- **Response Errors**:
  - `400`: Validation error (invalid limit/offset)
  - `401`: Missing/invalid token
  - `403`: Insufficient permissions (not admin)
  - `500`: Server error

---

### Test Mode APIs (Only available when `TEST_MODE=true`)

#### `GET /test/info`
- **Purpose**: Get test mode information and example requests
- **Module**: `src/routes/test.js`
- **Authentication**: Not required (test mode only)
- **Response**: Test mode configuration and examples

#### `GET /test/user`
- **Purpose**: Get current test user info
- **Module**: `src/routes/test.js`
- **Authentication**: Not required (test mode only)

---

## 📌 3. API Behaviour & Logic

### User Bootstrap Flow (`POST /users/bootstrap`)
1. **Extract user data** from Firebase token (uid, email, phone, displayName, photoUrl)
2. **Upsert user** in MongoDB (create or update)
3. **Create user profile** if not exists (with empty preferences)
4. **Create KYC status** if not exists (status: 'not_started')
5. **Store bootstrap event** (referralCode, deviceInfo) if provided
6. **Set default Firebase custom claim** (role: 'user') if not exists
7. **Return** user data with role

**Database Queries**:
- `userRepo.upsert()` - Create/update user
- `userProfileRepo.upsert()` - Create/update profile
- `kycRepo.upsertStatus()` - Create/update KYC status
- `userBootstrapRepo.create()` - Store bootstrap event
- Firebase Admin: `getUser()`, `setCustomUserClaims()`

### Get User Profile Flow (`GET /users/me`)
1. **Extract uid** from authenticated request
2. **Fetch in parallel**: User, UserProfile, KycStatus
3. **Return** combined data

**Database Queries**:
- `userRepo.findByUid()` - Get user
- `userProfileRepo.findByUid()` - Get profile
- `kycRepo.findStatusByUid()` - Get KYC status

### Update Profile Flow (`PATCH /users/me`)
1. **Extract uid** and update data
2. **Update phone** in User model if provided
3. **Update fullName/preferences** in UserProfile if provided
4. **Return** success status

**Database Queries**:
- `userRepo.update()` - Update user phone
- `userProfileRepo.update()` - Update profile

### Wallet Creation Flow (`POST /wallet/create`)
1. **Validate** password and confirmPassword match
2. **Check** if wallet already exists for user
3. **Generate** random Ethereum wallet using ethers.js
4. **Encrypt** private key with user's password
5. **Hash** password with bcrypt
6. **Store** wallet details (address, encrypted private key, hashed password, mnemonic)
7. **Return** mnemonic phrase (shown only once)

**Database Queries**:
- `walletDetailsRepo.findByUid()` - Check existing wallet
- `walletDetailsRepo.create()` - Create wallet record

**Data Transformations**:
- Private key encrypted with AES-256 using user password
- Password hashed with bcrypt (10 rounds)
- Mnemonic stored as array of words

### Wallet Unlock Flow (`POST /wallet/unlock`)
1. **Find wallet** by uid
2. **Verify** mnemonic is confirmed
3. **Compare** password hash with bcrypt
4. **Decrypt** private key using password
5. **Return** wallet address

**Database Queries**:
- `walletDetailsRepo.findByUid()` - Get wallet

**Data Transformations**:
- Password verification with bcrypt.compare()
- Private key decryption with AES-256

### KYC Update Flow (`POST /kyc`)
1. **Extract** status and document URLs
2. **Filter** out empty URLs
3. **Update KYC status** if provided
4. **Update KYC documents** if provided
5. **Return** updated status

**Database Queries**:
- `kycRepo.upsertStatus()` - Update status
- `kycRepo.upsertDocuments()` - Update documents

### DigiLocker Authorization Flow (`GET /kyc/digilocker/authorize`)
1. **Validate** DigiLocker configuration
2. **Generate** random state token
3. **Build** OAuth authorization URL with parameters
4. **Return** URL and state

**External API**: None (URL generation only)

### DigiLocker Callback Flow (`POST /kyc/digilocker/callback`)
1. **Exchange** authorization code for access token (DigiLocker API)
2. **Store** tokens in database with expiration
3. **Return** link status

**Database Queries**:
- `digilockerRepo.upsert()` - Store tokens

**External API Calls**:
- `POST https://api.digitallocker.gov.in/public/oauth2/token` - Exchange code

### DigiLocker Documents Flow (`GET /kyc/digilocker/documents`)
1. **Get** stored access token for user
2. **Check** token expiration
3. **Fetch** documents from DigiLocker API
4. **Persist** snapshot in KYC documents
5. **Return** documents

**Database Queries**:
- `digilockerRepo.findByUid()` - Get token
- `kycRepo.upsertDocuments()` - Store snapshot

**External API Calls**:
- `GET https://api.digitallocker.gov.in/public/v1/files/issued` - Fetch documents

### Admin Assign Role Flow (`POST /admin/users/:uid/roles`)
1. **Create role** in database if not exists
2. **Assign role** to user in database
3. **Update Firebase custom claims** with new role
4. **Return** success

**Database Queries**:
- `roleRepo.createIfNotExists()` - Ensure role exists
- `roleRepo.assignRole()` - Assign role

**Firebase Operations**:
- `getUser()` - Get current claims
- `setCustomUserClaims()` - Update claims

### Admin List Users Flow (`GET /admin/users`)
1. **Fetch users** with pagination
2. **Enrich each user** with KYC status
3. **Return** paginated list

**Database Queries**:
- `userRepo.list()` - Get paginated users
- `kycRepo.findStatusByUid()` - Get KYC status (per user)

---

## 📌 4. Integration Guide (Frontend Perspective)

### Authentication Setup

**All APIs (except `/health` and test routes) require Firebase ID token in Authorization header:**

```javascript
// After Firebase authentication on frontend
const idToken = await firebase.auth().currentUser.getIdToken();

// Use in all API requests
headers: {
  'Authorization': `Bearer ${idToken}`,
  'Content-Type': 'application/json'
}
```

### Example: User Bootstrap

**Using Fetch:**
```javascript
async function bootstrapUser(referralCode, deviceInfo) {
  const idToken = await firebase.auth().currentUser.getIdToken();
  
  const response = await fetch('http://localhost:4000/users/bootstrap', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      referralCode: referralCode || null,
      deviceInfo: deviceInfo || {}
    })
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error);
  }
  
  return data.data;
}
```

**Using Axios:**
```javascript
import axios from 'axios';

async function bootstrapUser(referralCode, deviceInfo) {
  const idToken = await firebase.auth().currentUser.getIdToken();
  
  const response = await axios.post(
    'http://localhost:4000/users/bootstrap',
    {
      referralCode: referralCode || null,
      deviceInfo: deviceInfo || {}
    },
    {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    }
  );
  
  return response.data.data;
}
```

**Error Handling:**
```javascript
try {
  const result = await bootstrapUser('REF123', { device: 'mobile' });
  console.log('User bootstrapped:', result.user);
} catch (error) {
  if (error.response?.status === 401) {
    // Token expired - refresh and retry
    await refreshToken();
  } else if (error.response?.status === 400) {
    // Validation error
    console.error('Validation errors:', error.response.data.details);
  } else {
    // Other error
    console.error('Error:', error.message);
  }
}
```

### Example: Get User Profile

```javascript
async function getUserProfile() {
  const idToken = await firebase.auth().currentUser.getIdToken();
  
  const response = await fetch('http://localhost:4000/users/me', {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error);
  }
  
  return data.data; // { user, profile, kycStatus }
}
```

### Example: Update Profile

```javascript
async function updateProfile(fullName, phone, preferences) {
  const idToken = await firebase.auth().currentUser.getIdToken();
  
  const response = await fetch('http://localhost:4000/users/me', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fullName,
      phone,
      preferences
    })
  });
  
  const data = await response.json();
  return data.success;
}
```

### Example: Create Wallet

```javascript
async function createWallet(password, confirmPassword) {
  const idToken = await firebase.auth().currentUser.getIdToken();
  
  const response = await fetch('http://localhost:4000/wallet/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password, confirmPassword })
  });
  
  const data = await response.json();
  
  if (!data.success) {
    if (data.error.includes('already exists')) {
      throw new Error('Wallet already created');
    }
    throw new Error(data.error);
  }
  
  // IMPORTANT: Show mnemonic to user and ask them to save it
  // This is the only time mnemonic is returned
  const mnemonic = data.data.mnemonic;
  showMnemonicToUser(mnemonic);
  
  return data.data;
}
```

**UI Workflow:**
1. User enters password (min 8 chars)
2. User confirms password
3. Call API
4. If success, show mnemonic phrase in secure modal
5. Ask user to write it down
6. Proceed to mnemonic verification step

### Example: Confirm Mnemonic

```javascript
async function confirmMnemonic(answers) {
  // answers = { "1": "word1", "5": "word5", "12": "word12" }
  const idToken = await firebase.auth().currentUser.getIdToken();
  
  const response = await fetch('http://localhost:4000/wallet/confirm-mnemonic', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ answers })
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error('Mnemonic verification failed');
  }
  
  return data.data;
}
```

**UI Workflow:**
1. Show random positions (e.g., "Enter word at position 1, 5, 12")
2. User enters words
3. Call API with answers object
4. If success, mark wallet as verified
5. Enable wallet unlock functionality

### Example: KYC Status Check

```javascript
async function getKYCStatus() {
  const idToken = await firebase.auth().currentUser.getIdToken();
  
  const response = await fetch('http://localhost:4000/kyc/status', {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });
  
  const data = await response.json();
  return data.data.kyc; // { status, submittedAt, verifiedAt, ... }
}
```

### Example: Update KYC Documents

```javascript
async function updateKYC(aadhaarFrontUrl, aadhaarBackUrl, panUrl, selfieUrl) {
  const idToken = await firebase.auth().currentUser.getIdToken();
  
  const response = await fetch('http://localhost:4000/kyc', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      aadhaarFrontUrl,
      aadhaarBackUrl,
      panUrl,
      selfieUrl,
      status: 'submitted'
    })
  });
  
  const data = await response.json();
  return data.data.status;
}
```

### Example: DigiLocker Integration

```javascript
// Step 1: Get authorization URL
async function getDigilockerAuthUrl() {
  const idToken = await firebase.auth().currentUser.getIdToken();
  
  const response = await fetch('http://localhost:4000/kyc/digilocker/authorize', {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });
  
  const data = await response.json();
  return data.data; // { url, state }
}

// Step 2: Redirect user to DigiLocker
const { url, state } = await getDigilockerAuthUrl();
window.location.href = url; // User authenticates on DigiLocker

// Step 3: Handle callback (after DigiLocker redirects back)
async function handleDigilockerCallback(code, state) {
  const idToken = await firebase.auth().currentUser.getIdToken();
  
  const response = await fetch('http://localhost:4000/kyc/digilocker/callback', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code, state })
  });
  
  const data = await response.json();
  return data.data; // { status: 'linked', expiresAt, scope }
}

// Step 4: Fetch documents
async function getDigilockerDocuments() {
  const idToken = await firebase.auth().currentUser.getIdToken();
  
  const response = await fetch('http://localhost:4000/kyc/digilocker/documents', {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });
  
  const data = await response.json();
  return data.data.documents;
}
```

**UI Workflow:**
1. User clicks "Link DigiLocker"
2. Call `/kyc/digilocker/authorize`
3. Redirect user to returned URL
4. User authenticates on DigiLocker
5. DigiLocker redirects back with `code` and `state`
6. Call `/kyc/digilocker/callback` with code
7. Show success message
8. Optionally fetch documents with `/kyc/digilocker/documents`

### Example: Admin - List Users

```javascript
async function listUsers(limit = 50, offset = 0) {
  const idToken = await firebase.auth().currentUser.getIdToken();
  
  const response = await fetch(
    `http://localhost:4000/admin/users?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    }
  );
  
  const data = await response.json();
  
  if (!data.success) {
    if (data.error.includes('Forbidden')) {
      throw new Error('Admin access required');
    }
    throw new Error(data.error);
  }
  
  return data.data; // { data: [...], limit, offset, total }
}
```

### Error Handling Best Practices

```javascript
class APIError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function apiCall(url, options = {}) {
  const idToken = await firebase.auth().currentUser.getIdToken();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new APIError(data.error, response.status, data.details);
  }
  
  return data.data;
}

// Usage with error handling
try {
  const profile = await apiCall('http://localhost:4000/users/me');
} catch (error) {
  if (error instanceof APIError) {
    switch (error.status) {
      case 401:
        // Token expired - refresh
        await refreshToken();
        break;
      case 403:
        // Forbidden - show access denied
        showAccessDenied();
        break;
      case 400:
        // Validation error - show field errors
        showValidationErrors(error.details);
        break;
      default:
        showError(error.message);
    }
  }
}
```

---

## 📌 5. High-Level Flow Diagrams

### Authentication Flow

```
Frontend (Firebase SDK)
    ↓
User logs in with Firebase
    ↓
Firebase returns ID Token
    ↓
Frontend stores token
    ↓
Frontend makes API request with: Authorization: Bearer <token>
    ↓
Backend: verifyFirebaseToken middleware
    ↓
Firebase Admin SDK verifies token
    ↓
Token valid → Attach user info to req.user
    ↓
Continue to route handler
```

### User Bootstrap Flow

```
POST /users/bootstrap
    ↓
verifyFirebaseToken middleware
    ↓
validate(bootstrapSchema) middleware
    ↓
userController.bootstrap()
    ↓
userService.bootstrap()
    ↓
┌─────────────────────────────────┐
│ 1. userRepo.upsert()            │ → MongoDB: users collection
│ 2. userProfileRepo.upsert()     │ → MongoDB: user_profiles collection
│ 3. kycRepo.upsertStatus()       │ → MongoDB: kyc_status collection
│ 4. userBootstrapRepo.create()   │ → MongoDB: user_bootstrap_events collection
│ 5. Firebase setCustomUserClaims()│ → Firebase: Update custom claims
└─────────────────────────────────┘
    ↓
Return user data with role
    ↓
sendSuccess() → JSON response
```

### Wallet Creation Flow

```
POST /wallet/create
    ↓
verifyFirebaseToken middleware
    ↓
validate(createWalletSchema) middleware
    ↓
walletController.create()
    ↓
walletService.create()
    ↓
┌─────────────────────────────────┐
│ 1. Check if wallet exists       │
│ 2. Generate random wallet       │ → ethers.Wallet.createRandom()
│ 3. Encrypt private key          │ → AES-256 with password
│ 4. Hash password                │ → bcrypt (10 rounds)
│ 5. Store in database            │ → MongoDB: wallet_details collection
└─────────────────────────────────┘
    ↓
Return mnemonic phrase (shown once)
    ↓
sendSuccess() → JSON response
```

### KYC Update Flow

```
POST /kyc
    ↓
verifyFirebaseToken middleware
    ↓
validate(kycUpdateSchema) middleware
    ↓
kycController.update()
    ↓
kycService.update()
    ↓
┌─────────────────────────────────┐
│ 1. Filter empty URLs             │
│ 2. Update KYC status            │ → MongoDB: kyc_status collection
│ 3. Update KYC documents         │ → MongoDB: kyc_documents collection
└─────────────────────────────────┘
    ↓
Return updated status
    ↓
sendSuccess() → JSON response
```

### DigiLocker OAuth Flow

```
GET /kyc/digilocker/authorize
    ↓
kycController.getDigilockerAuthUrl()
    ↓
kycService.getDigilockerAuthUrl()
    ↓
digilockerService.getAuthorizationUrl()
    ↓
Generate state token + Build OAuth URL
    ↓
Return { url, state }
    ↓
Frontend redirects user to DigiLocker
    ↓
User authenticates on DigiLocker
    ↓
DigiLocker redirects back with code
    ↓
POST /kyc/digilocker/callback
    ↓
kycController.digilockerCallback()
    ↓
kycService.linkDigilocker()
    ↓
digilockerService.linkAccount()
    ↓
┌─────────────────────────────────┐
│ 1. Exchange code for token      │ → DigiLocker API
│ 2. Store tokens in database     │ → MongoDB: digilocker_tokens collection
└─────────────────────────────────┘
    ↓
Return link status
```

### Admin Role Assignment Flow

```
POST /admin/users/:uid/roles
    ↓
verifyFirebaseToken middleware
    ↓
requireRole(['admin']) middleware
    ↓
validate(assignRoleSchema) middleware
    ↓
adminController.assignRole()
    ↓
adminService.assignRole()
    ↓
┌─────────────────────────────────┐
│ 1. roleRepo.createIfNotExists() │ → MongoDB: roles collection
│ 2. roleRepo.assignRole()        │ → MongoDB: user_roles collection
│ 3. Firebase setCustomUserClaims()│ → Firebase: Update custom claims
└─────────────────────────────────┘
    ↓
Return success
```

### Error Handling Flow

```
Request
    ↓
Route handler throws error
    ↓
Error caught by try-catch in controller
    ↓
next(error) → Pass to error handler
    ↓
errorHandler middleware
    ↓
┌─────────────────────────────────┐
│ Check error type:               │
│ - Joi validation error          │ → 400 + validation details
│ - Mongoose validation error      │ → 400 + field errors
│ - Duplicate key error           │ → 409 + field name
│ - Custom error with status      │ → Use provided status
│ - Default                       │ → 500 + error message
└─────────────────────────────────┘
    ↓
sendError() → JSON error response
```

---

## 📌 6. Glossary

### Terms & Concepts

| Term | Definition |
|------|------------|
| **UID** | Firebase User ID - unique identifier for authenticated users |
| **Custom Claims** | Firebase custom user attributes (e.g., role) stored in ID token |
| **Repository Pattern** | Data access layer abstraction - separates database operations from business logic |
| **Service Layer** | Business logic layer - orchestrates data operations and business rules |
| **Mnemonic** | 12-word recovery phrase for Ethereum wallet (BIP39 standard) |
| **KYC** | Know Your Customer - identity verification process |
| **DigiLocker** | Indian government digital document storage service |
| **RBAC** | Role-Based Access Control - authorization based on user roles |
| **USDT** | Tether (USDT) - stablecoin on Ethereum blockchain |
| **ERC20** | Ethereum token standard for fungible tokens |
| **WebSocket Provider** | Real-time blockchain event listener using WebSocket connection |
| **Cron Job** | Scheduled task that runs periodically (e.g., every 30 seconds) |

### Request/Response Keys

| Key | Type | Description |
|-----|------|-------------|
| `uid` | string | Firebase user ID |
| `email` | string | User email address |
| `phone` | string | User phone number |
| `displayName` | string | User display name |
| `photoUrl` | string | User profile photo URL |
| `fullName` | string | User's full name (in profile) |
| `preferences` | object | User preferences (key-value pairs) |
| `status` | string | KYC status: `not_started`, `in_progress`, `submitted`, `verified`, `rejected` |
| `walletAddress` | string | Ethereum wallet address (0x...) |
| `mnemonic` | string | 12-word recovery phrase (space-separated) |
| `role` | string | User role: `user`, `admin`, etc. |
| `referralCode` | string | Referral code (max 32 chars) |
| `deviceInfo` | object | Device information object |
| `aadhaarFrontUrl` | string | Aadhaar card front image URL |
| `aadhaarBackUrl` | string | Aadhaar card back image URL |
| `panUrl` | string | PAN card image URL |
| `selfieUrl` | string | Selfie image URL |
| `code` | string | OAuth authorization code |
| `state` | string | OAuth state parameter (CSRF protection) |
| `limit` | number | Pagination limit (1-200) |
| `offset` | number | Pagination offset (min: 0) |

### Response Structure

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... } // Optional, for validation errors
}
```

### Custom Patterns

1. **Barrel Exports**: Each folder has an `index.js` that exports all modules (e.g., `src/controllers/index.js`)
2. **Service Singleton**: Services are exported as singleton instances (e.g., `module.exports = new UserService()`)
3. **Repository Pattern**: All database operations go through repository layer
4. **Middleware Chain**: Authentication → Validation → Controller → Service → Repository
5. **Error Propagation**: Errors bubble up: Repository → Service → Controller → Error Handler

---

## 📌 7. API Contract Summary Table

| Endpoint | Method | Purpose | Auth | Returns |
|----------|--------|---------|------|---------|
| `/health` | GET | Health check | No | Status + timestamp |
| `/users/bootstrap` | POST | First-time user setup | Yes | User data + role |
| `/users/me` | GET | Get user profile | Yes | User + profile + KYC status |
| `/users/me` | PATCH | Update user profile | Yes | Success status |
| `/users/roles` | GET | Get user roles | Yes | Array of roles |
| `/kyc/status` | GET | Get KYC status | Yes | KYC status object |
| `/kyc` | POST | Update KYC documents/status | Yes | Updated status |
| `/kyc/digilocker/authorize` | GET | Get DigiLocker OAuth URL | Yes | URL + state |
| `/kyc/digilocker/callback` | POST | Handle DigiLocker callback | Yes | Link status |
| `/kyc/digilocker/documents` | GET | Fetch DigiLocker documents | Yes | Documents array |
| `/wallet/create` | POST | Create Ethereum wallet | Yes | Mnemonic phrase |
| `/wallet/confirm-mnemonic` | POST | Verify mnemonic phrase | Yes | Verification status |
| `/wallet/unlock` | POST | Unlock wallet with password | Yes | Wallet address |
| `/admin/users/:uid/roles` | POST | Assign role to user | Yes (Admin) | Success + role |
| `/admin/users` | GET | List users with pagination | Yes (Admin) | User list + pagination |
| `/test/info` | GET | Test mode info | No (Test mode) | Test configuration |
| `/test/user` | GET | Get test user | No (Test mode) | Test user data |

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PATCH requests |
| 201 | Created | Successful POST requests (wallet creation) |
| 400 | Bad Request | Validation errors, invalid input |
| 401 | Unauthorized | Missing/invalid Firebase token |
| 403 | Forbidden | Insufficient permissions (not admin) |
| 404 | Not Found | Resource not found (user, wallet, etc.) |
| 409 | Conflict | Duplicate resource (wallet already exists) |
| 500 | Internal Server Error | Server errors, unhandled exceptions |

### Authentication Requirements

| Endpoint | Auth Required | Special Requirements |
|----------|---------------|---------------------|
| `/health` | No | None |
| `/users/*` | Yes | Firebase ID token |
| `/kyc/*` | Yes | Firebase ID token |
| `/wallet/*` | Yes | Firebase ID token |
| `/admin/*` | Yes | Firebase ID token + Admin role |
| `/test/*` | No | Only available when `TEST_MODE=true` |

---

## Additional Notes

### Rate Limiting
- Currently commented out in `server.js`
- Configuration available: `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`

### CORS Configuration
- Configurable via `CORS_ALLOWED_ORIGINS` environment variable
- Defaults to `*` (all origins) if not set
- Credentials enabled

### Test Mode
- Enabled when `TEST_MODE=true` or `NODE_ENV=test`
- Bypasses Firebase authentication
- Test routes available at `/test/*`
- **WARNING**: Never use in production!

### Blockchain Integration
- USDT listener: Real-time transfer monitoring (WebSocket)
- Deposit confirmation cron: Checks pending deposits every 30 seconds
- Requires: `RPC_WS_URL`, `RPC_HTTP_URL`, `USDT_ADDRESS`

### Security Features
- Helmet.js for security headers
- CORS configuration
- Input validation with Joi
- Password hashing with bcrypt
- Private key encryption with AES-256
- Firebase token verification
- RBAC for authorization

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Project**: Kapitor Backend API

