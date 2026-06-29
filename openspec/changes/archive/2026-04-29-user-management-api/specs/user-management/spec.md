## ADDED Requirements

### Requirement: Admin can create a user
The system SHALL allow administrators to create new user accounts with specified attributes.

#### Scenario: Admin creates user successfully
- **WHEN** admin sends POST /api/users with valid user data including email, name, and optional role
- **THEN** system creates the user and returns 201 Created with user object

#### Scenario: Admin creates user with duplicate email
- **WHEN** admin attempts to create a user with an email that already exists
- **THEN** system returns 409 Conflict with error "Email already in use"

### Requirement: Admin can list all users
The system SHALL allow administrators to retrieve a paginated list of all users.

#### Scenario: Admin lists users successfully
- **WHEN** admin calls GET /api/users with valid pagination parameters
- **THEN** system returns 200 OK with paginated user list (excluding passwords)

#### Scenario: Non-admin attempts to list users
- **WHEN** non-admin user calls GET /api/users
- **THEN** system returns 403 Forbidden with error "Insufficient permissions"

### Requirement: Admin can view a specific user
The system SHALL allow administrators to retrieve detailed information about a specific user.

#### Scenario: Admin views user successfully
- **WHEN** admin calls GET /api/users/:id
- **THEN** system returns 200 OK with complete user object (excluding password)

#### Scenario: Admin views non-existent user
- **WHEN** admin calls GET /api/users/:id with invalid ID
- **THEN** system returns 404 Not Found with error "User not found"

### Requirement: Admin can update a user
The system SHALL allow administrators to modify existing user attributes.

#### Scenario: Admin updates user successfully
- **WHEN** admin sends PUT /api/users/:id with valid update data
- **THEN** system updates the user and returns 200 OK with updated user object

#### Scenario: Admin updates user with duplicate email
- **WHEN** admin attempts to update user email to one that already exists
- **THEN** system returns 409 Conflict with error "Email already in use"

### Requirement: Admin can delete a user
The system SHALL allow administrators to remove user accounts from the system.

#### Scenario: Admin deletes user successfully
- **WHEN** admin calls DELETE /api/users/:id
- **THEN** system marks user as deleted and returns 204 No Content

#### Scenario: Admin attempts to delete themselves
- **WHEN** admin attempts to delete their own account
- **THEN** system returns 400 Bad Request with error "Cannot delete own account"

### Requirement: User can view their own profile
The system SHALL allow authenticated users to retrieve their own profile information.

#### Scenario: User views own profile
- **WHEN** authenticated user calls GET /api/users/me
- **THEN** system returns 200 OK with user's own profile object

### Requirement: User can update their own profile
The system SHALL allow authenticated users to modify their own profile (excluding email and roles).

#### Scenario: User updates own profile
- **WHEN** authenticated user sends PUT /api/users/me with valid data
- **THEN** system updates the profile and returns 200 OK with updated object

#### Scenario: User attempts to change email via profile update
- **WHEN** user attempts to change their email via PUT /api/users/me
- **THEN** system ignores the email change and returns success (email is immutable via this endpoint)