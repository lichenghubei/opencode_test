## ADDED Requirements

### Requirement: User can register with email and password
The system SHALL allow new users to register by providing a unique email address and password.

#### Scenario: Successful registration
- **WHEN** user submits valid email and password via POST /api/auth/register
- **THEN** system creates a new user record with hashed password and returns a 201 status with user object (excluding password)

#### Scenario: Registration with duplicate email
- **WHEN** user attempts to register with an email that already exists
- **THEN** system returns 409 Conflict with error message "Email already registered"

#### Scenario: Registration with invalid email format
- **WHEN** user submits an invalid email format
- **THEN** system returns 400 Bad Request with validation error

#### Scenario: Registration with weak password
- **WHEN** user submits a password less than 8 characters
- **THEN** system returns 400 Bad Request with error "Password must be at least 8 characters"

### Requirement: User can login with credentials
The system SHALL authenticate users using email and password, returning JWT tokens upon successful login.

#### Scenario: Successful login
- **WHEN** user provides valid credentials via POST /api/auth/login
- **THEN** system returns 200 OK with access token and refresh token

#### Scenario: Login with incorrect password
- **WHEN** user provides correct email but incorrect password
- **THEN** system returns 401 Unauthorized with error "Invalid credentials"

#### Scenario: Login with non-existent email
- **WHEN** user provides an email that does not exist in the system
- **THEN** system returns 401 Unauthorized with error "Invalid credentials"

### Requirement: User can logout
The system SHALL allow authenticated users to invalidate their session tokens.

#### Scenario: Successful logout
- **WHEN** authenticated user calls POST /api/auth/logout with valid access token
- **THEN** system invalidates the refresh token and returns 200 OK

#### Scenario: Logout with invalid token
- **WHEN** user calls POST /api/auth/logout with an already invalidated or missing token
- **THEN** system returns 401 Unauthorized

### Requirement: User can refresh access token
The system SHALL allow users to obtain a new access token using a valid refresh token.

#### Scenario: Successful token refresh
- **WHEN** user submits a valid refresh token via POST /api/auth/refresh
- **THEN** system returns 200 OK with new access token and refresh token

#### Scenario: Refresh with expired refresh token
- **WHEN** user submits an expired refresh token
- **THEN** system returns 401 Unauthorized with error "Refresh token expired"

#### Scenario: Refresh with revoked refresh token
- **WHEN** user submits a refresh token that has been revoked
- **THEN** system returns 401 Unauthorized with error "Token has been revoked"

### Requirement: Authenticated requests are validated
The system SHALL validate JWT tokens on protected routes and reject requests with invalid or missing tokens.

#### Scenario: Request with valid access token
- **WHEN** authenticated user makes a request to a protected endpoint with valid Authorization header
- **THEN** system processes the request successfully

#### Scenario: Request with expired access token
- **WHEN** user makes a request with an expired access token
- **THEN** system returns 401 Unauthorized with error "Token expired"

#### Scenario: Request with missing access token
- **WHEN** user makes a request to a protected endpoint without Authorization header
- **THEN** system returns 401 Unauthorized with error "Authorization required"

#### Scenario: Request with malformed token
- **WHEN** user makes a request with an invalid JWT format
- **THEN** system returns 401 Unauthorized with error "Invalid token"