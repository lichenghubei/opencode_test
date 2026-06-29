## ADDED Requirements

### Requirement: User can change their password
The system SHALL allow authenticated users to change their own password by verifying their current password.

#### Scenario: User changes password successfully
- **WHEN** authenticated user sends POST /api/auth/change-password with current password and new password
- **THEN** system updates the password and returns 200 OK

#### Scenario: User provides incorrect current password
- **WHEN** user provides wrong current password when changing password
- **THEN** system returns 401 Unauthorized with error "Current password is incorrect"

#### Scenario: User sets same as current password
- **WHEN** user attempts to set new password identical to current password
- **THEN** system returns 400 Bad Request with error "New password must be different"

#### Scenario: New password does not meet requirements
- **WHEN** user provides new password that does not meet complexity requirements
- **THEN** system returns 400 Bad Request with validation error

### Requirement: User can request password reset
The system SHALL allow users to request a password reset via email.

#### Scenario: User requests password reset
- **WHEN** user submits POST /api/auth/forgot-password with valid email
- **THEN** system sends password reset email and returns 200 OK

#### Scenario: Request reset for non-existent email
- **WHEN** user requests password reset for email that does not exist
- **THEN** system still returns 200 OK to prevent email enumeration (no error shown)

#### Scenario: Request reset rate limited
- **WHEN** user makes multiple password reset requests in short period
- **THEN** system rate limits and returns 429 Too Many Requests

### Requirement: User can reset password with token
The system SHALL allow users to reset their password using a time-limited reset token.

#### Scenario: User resets password with valid token
- **WHEN** user submits POST /api/auth/reset-password with valid reset token and new password
- **THEN** system updates password and returns 200 OK

#### Scenario: User resets password with expired token
- **WHEN** user submits POST /api/auth/reset-password with expired reset token
- **THEN** system returns 400 Bad Request with error "Reset token has expired"

#### Scenario: User resets password with invalid token
- **WHEN** user submits POST /api/auth/reset-password with invalid reset token
- **THEN** system returns 400 Bad Request with error "Invalid reset token"

### Requirement: Password reset token is single-use
The system SHALL ensure each reset token can only be used once.

#### Scenario: Reset token used twice
- **WHEN** user attempts to use the same reset token for a second password reset
- **THEN** system returns 400 Bad Request with error "Reset token has already been used"

### Requirement: Password reset token expires
The system SHALL invalidate password reset tokens after a configured time period.

#### Scenario: Token valid for limited time
- **WHEN** reset token is older than configured expiry period (1 hour)
- **THEN** system rejects the token as expired

### Requirement: Password history prevents reuse
The system SHALL prevent users from reusing recent passwords to enhance security.

#### Scenario: User attempts to reuse recent password
- **WHEN** user sets a password that was used in the last 5 passwords
- **THEN** system returns 400 Bad Request with error "Cannot reuse recent password"

#### Scenario: Password change updates history
- **WHEN** user successfully changes their password
- **THEN** system records the password hash in password history