# Kapitor Backend API

A modern Node.js backend API built with Express, MongoDB Atlas, and Firebase Authentication.

## Architecture

This project follows a clean MVC architecture with service-repository pattern:

```
src/
├── config/          # Configuration (database, Firebase, DigiLocker, env)
├── models/          # Mongoose schemas
├── repos/           # Database operations (repository pattern)
├── services/        # Business logic
│   ├── business/    # Internal business services
│   └── external/    # Third-party API integrations
├── controllers/     # Request handlers
├── routes/          # Express routes
├── middlewares/     # Auth, RBAC, error handling
├── validators/      # Joi validation schemas
├── utils/           # Utility functions
└── server.js        # Application entry point
```

## Features

- ✅ **MongoDB Atlas** integration with Mongoose
- ✅ **Firebase Authentication** as Identity Provider
- ✅ **Role-Based Access Control (RBAC)**
- ✅ **DigiLocker** KYC integration
- ✅ **Joi** request validation
- ✅ **Standardized API responses**
- ✅ **Global error handling**
- ✅ **ESLint** code quality
- ✅ **Yarn** package management

## Prerequisites

- Node.js >= 18.0.0
- Yarn >= 1.22.0
- MongoDB Atlas cluster
- Firebase project with service account

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables (see Configuration section)

## Configuration

### Required Environment Variables

- `MONGODB_URI` - MongoDB Atlas connection string
- `FIREBASE_SERVICE_ACCOUNT_BASE64` - Base64 encoded Firebase service account JSON
  - OR `GOOGLE_APPLICATION_CREDENTIALS` - Path to Firebase service account file

### Optional Environment Variables

- `NODE_ENV` - Environment (default: `development`)
- `PORT` - Server port (default: `4000`)
- `CORS_ALLOWED_ORIGINS` - Comma-separated list of allowed origins
- `DIGILOCKER_*` - DigiLocker API configuration
- `RATE_LIMIT_*` - Rate limiting configuration

## Running the Application

### Development

```bash
yarn dev
```

### Production

```bash
yarn start
```

## Scripts

- `yarn start` - Start production server
- `yarn dev` - Start development server with nodemon
- `yarn lint` - Run ESLint
- `yarn lint:fix` - Fix ESLint errors automatically
- `yarn format` - Format code with Prettier
- `yarn format:check` - Check code formatting

## API Endpoints

### Health Check
- `GET /health` - Health check endpoint

### Users
- `POST /users/bootstrap` - Bootstrap user (first-time setup)
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update user profile
- `GET /users/roles` - Get user roles

### KYC
- `GET /kyc/status` - Get KYC status
- `POST /kyc` - Update KYC documents and status
- `GET /kyc/digilocker/authorize` - Get DigiLocker authorization URL
- `POST /kyc/digilocker/callback` - Handle DigiLocker OAuth callback
- `GET /kyc/digilocker/documents` - Fetch DigiLocker documents

### Admin (requires admin role)
- `POST /admin/users/:uid/roles` - Assign role to user
- `GET /admin/users` - List users with pagination

## Authentication

All endpoints except `/health` require Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## Database Migration

This project has been migrated from MySQL to MongoDB Atlas. The Mongoose models are located in `src/models/`:

- `User` - User accounts
- `UserProfile` - User profile information
- `Role` - System roles
- `UserRole` - User-role assignments
- `KycStatus` - KYC verification status
- `KycDocument` - KYC documents
- `DigilockerToken` - DigiLocker OAuth tokens
- `UserBootstrapEvent` - User bootstrap events

## Code Structure

### Repository Pattern
Repositories (`src/repos/`) handle all database operations. They provide a clean interface for data access.

### Service Layer
- **Business Services** (`src/services/business/`) - Business logic and orchestration
- **External Services** (`src/services/external/`) - Third-party API integrations

### Controllers
Controllers (`src/controllers/`) handle HTTP requests and responses. They call services and use utilities for standardized responses.

### Validation
All request validation is done using Joi schemas in `src/validators/`. Validation middleware is applied at the route level.

## Security

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation
- RBAC for authorization
- Firebase token verification

## Development

### Adding a New Feature

1. Create/update Mongoose model in `src/models/`
2. Create repository in `src/repos/`
3. Create business service in `src/services/business/`
4. Create controller in `src/controllers/`
5. Create validators in `src/validators/`
6. Create routes in `src/routes/`
7. Update barrel exports

### Code Style

- Use ESLint for linting
- Use Prettier for formatting
- Follow existing patterns
- Write clear, descriptive function names
- Add JSDoc comments for complex functions

## License

[Your License Here]

