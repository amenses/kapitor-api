# Frontend Authentication Flow Guide

This document describes the complete authentication flow for the Kapitor Backend API using Firebase Authentication.

## Overview

The API uses **Firebase Authentication** as the Identity Provider (IdP). All authenticated endpoints require a Firebase ID token in the Authorization header.

## Authentication Flow

### Step 1: User Signs In with Firebase

In your Flutter/React Native app, implement Firebase Authentication:

```dart
// Flutter Example
import 'package:firebase_auth/firebase_auth.dart';

// Sign in with email/password
final userCredential = await FirebaseAuth.instance.signInWithEmailAndPassword(
  email: email,
  password: password,
);

// Or sign in with other providers (Google, Phone, etc.)
```

### Step 2: Get Firebase ID Token

After successful sign-in, get the ID token:

```dart
// Flutter Example
final user = FirebaseAuth.instance.currentUser;
final idToken = await user?.getIdToken(true); // true = force refresh

if (idToken == null) {
  // Handle error - user not authenticated
  return;
}
```

**Important:** Always use `getIdToken(true)` to force refresh the token and ensure it's valid.

### Step 3: Bootstrap User (First Time Only)

After getting the ID token, call the bootstrap endpoint to create/update the user in the backend database:

```dart
// Flutter Example
final response = await http.post(
  Uri.parse('$baseUrl/users/bootstrap'),
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $idToken',
  },
  body: jsonEncode({
    'referralCode': referralCode, // Optional
    'deviceInfo': {              // Optional
      'platform': 'android',
      'appVersion': '1.0.0',
    },
  }),
);

if (response.statusCode == 200) {
  final data = jsonDecode(response.body);
  // data.data.user contains: uid, email, phone, role
  print('User bootstrapped: ${data.data.user}');
}
```

**When to call bootstrap:**
- ✅ After first-time sign-in
- ✅ After sign-up
- ✅ When app starts and user is authenticated (idempotent - safe to call multiple times)

**Response:**
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

### Step 4: Make Authenticated API Calls

For all subsequent API calls, include the Firebase ID token:

```dart
// Flutter Example
final idToken = await user?.getIdToken(true);

final response = await http.get(
  Uri.parse('$baseUrl/users/me'),
  headers: {
    'Authorization': 'Bearer $idToken',
  },
);
```

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND APPLICATION                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  1. User Signs In with Firebase   │
        │     (Email/Password, Google, etc.)│
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  2. Get Firebase ID Token         │
        │     await user.getIdToken(true)   │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  3. POST /users/bootstrap          │
        │     Authorization: Bearer <token>  │
        │     (First time only)             │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  4. Make API Calls                 │
        │     Authorization: Bearer <token>  │
        │     - GET /users/me               │
        │     - POST /kyc                   │
        │     - etc.                        │
        └───────────────────────────────────┘
```

## Error Handling

### 401 Unauthorized

If you receive a 401 error, the token is invalid or expired:

```dart
if (response.statusCode == 401) {
  // Token expired or invalid
  // 1. Try to refresh the token
  final newToken = await user?.getIdToken(true);
  
  // 2. Retry the request with new token
  if (newToken != null) {
    // Retry request
  } else {
    // Force user to sign in again
    await FirebaseAuth.instance.signOut();
    // Navigate to login screen
  }
}
```

**Response:**
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

### 403 Forbidden

User doesn't have required permissions (e.g., admin routes):

```json
{
  "success": false,
  "error": "Forbidden: Insufficient permissions"
}
```

## Token Refresh Strategy

### Recommended Approach

1. **Always refresh token before API calls:**
   ```dart
   final idToken = await user?.getIdToken(true);
   ```

2. **Handle token expiration:**
   - On 401, refresh token once
   - If still 401, force re-login

3. **Token lifecycle:**
   - Firebase tokens expire after 1 hour
   - Use `getIdToken(true)` to force refresh
   - Cache token but refresh before each request

## API Endpoints Reference

### Public Endpoints
- `GET /health` - No authentication required

### Authenticated Endpoints (Require Bearer Token)

#### Users
- `POST /users/bootstrap` - Bootstrap user (first-time setup)
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update user profile
- `GET /users/roles` - Get user roles

#### KYC
- `GET /kyc/status` - Get KYC status
- `POST /kyc` - Update KYC documents
- `GET /kyc/digilocker/authorize` - Get DigiLocker auth URL
- `POST /kyc/digilocker/callback` - Handle DigiLocker callback
- `GET /kyc/digilocker/documents` - Get DigiLocker documents

#### Admin (Requires admin role)
- `POST /admin/users/:uid/roles` - Assign role to user
- `GET /admin/users` - List users

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": {
    // Additional error details (optional)
  }
}
```

## Implementation Checklist

- [ ] Integrate Firebase Authentication SDK
- [ ] Implement sign-in/sign-up flows
- [ ] Get Firebase ID token after sign-in
- [ ] Call `/users/bootstrap` after first sign-in
- [ ] Store token securely (use secure storage)
- [ ] Implement token refresh logic
- [ ] Handle 401 errors (refresh token or re-login)
- [ ] Add Authorization header to all API calls
- [ ] Handle network errors gracefully
- [ ] Implement logout (sign out from Firebase)

## Example Implementation (Flutter)

```dart
class ApiService {
  static const String baseUrl = 'https://your-api.com';
  
  // Get current user's ID token
  Future<String?> getIdToken() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return null;
    return await user.getIdToken(true);
  }
  
  // Make authenticated API call
  Future<Map<String, dynamic>> apiCall(
    String endpoint,
    {
      String method = 'GET',
      Map<String, dynamic>? body,
    }
  ) async {
    final token = await getIdToken();
    if (token == null) {
      throw Exception('User not authenticated');
    }
    
    final response = await http.Request(
      method,
      Uri.parse('$baseUrl$endpoint'),
    )
      ..headers.addAll({
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      });
    
    if (body != null) {
      response.body = jsonEncode(body);
    }
    
    final streamedResponse = await response.send();
    final responseBody = await streamedResponse.stream.bytesToString();
    final statusCode = streamedResponse.statusCode;
    
    if (statusCode == 401) {
      // Token expired, try refresh
      final newToken = await getIdToken();
      if (newToken == null) {
        throw Exception('Authentication failed');
      }
      // Retry request with new token
      return apiCall(endpoint, method: method, body: body);
    }
    
    if (statusCode >= 200 && statusCode < 300) {
      return jsonDecode(responseBody);
    } else {
      final error = jsonDecode(responseBody);
      throw Exception(error['error'] ?? 'API Error');
    }
  }
  
  // Bootstrap user
  Future<void> bootstrapUser({
    String? referralCode,
    Map<String, dynamic>? deviceInfo,
  }) async {
    await apiCall(
      '/users/bootstrap',
      method: 'POST',
      body: {
        if (referralCode != null) 'referralCode': referralCode,
        if (deviceInfo != null) 'deviceInfo': deviceInfo,
      },
    );
  }
  
  // Get user profile
  Future<Map<String, dynamic>> getUserProfile() async {
    return await apiCall('/users/me');
  }
}
```

## Security Best Practices

1. **Never store tokens in plain text** - Use secure storage
2. **Always use HTTPS** - Never make API calls over HTTP
3. **Refresh tokens before expiration** - Use `getIdToken(true)`
4. **Handle token expiration gracefully** - Implement retry logic
5. **Validate token on app start** - Check if user is still authenticated
6. **Clear tokens on logout** - Sign out from Firebase

## Troubleshooting

### Token always expires
- Ensure you're using `getIdToken(true)` to force refresh
- Check Firebase project configuration
- Verify token expiration time in Firebase console

### 401 errors on valid tokens
- Check if token is being sent correctly: `Authorization: Bearer <token>`
- Verify Firebase project matches backend configuration
- Check if token is being truncated

### Bootstrap fails
- Ensure user is authenticated in Firebase
- Verify token is valid
- Check backend logs for detailed error messages

## Support

For issues or questions:
1. Check API response error messages
2. Review backend logs
3. Verify Firebase Authentication setup
4. Test with `/health` endpoint first

