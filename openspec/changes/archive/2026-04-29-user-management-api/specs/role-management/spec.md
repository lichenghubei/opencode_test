## ADDED Requirements

### Requirement: Admin can create a role
The system SHALL allow administrators to create new roles with associated permissions.

#### Scenario: Admin creates role successfully
- **WHEN** admin sends POST /api/roles with valid role name and permission IDs
- **THEN** system creates the role and returns 201 Created with role object

#### Scenario: Admin creates role with duplicate name
- **WHEN** admin attempts to create a role with a name that already exists
- **THEN** system returns 409 Conflict with error "Role name already exists"

### Requirement: Admin can list all roles
The system SHALL allow administrators to retrieve a list of all roles.

#### Scenario: Admin lists roles successfully
- **WHEN** admin calls GET /api/roles
- **THEN** system returns 200 OK with array of role objects including permissions

#### Scenario: Non-admin attempts to list roles
- **WHEN** non-admin user calls GET /api/roles
- **THEN** system returns 403 Forbidden with error "Insufficient permissions"

### Requirement: Admin can view a specific role
The system SHALL allow administrators to retrieve detailed information about a specific role.

#### Scenario: Admin views role successfully
- **WHEN** admin calls GET /api/roles/:id
- **THEN** system returns 200 OK with role object including all permissions

#### Scenario: Admin views non-existent role
- **WHEN** admin calls GET /api/roles/:id with invalid ID
- **THEN** system returns 404 Not Found with error "Role not found"

### Requirement: Admin can update a role
The system SHALL allow administrators to modify role attributes and permissions.

#### Scenario: Admin updates role successfully
- **WHEN** admin sends PUT /api/roles/:id with valid update data
- **THEN** system updates the role and returns 200 OK with updated role object

#### Scenario: Admin attempts to update system role
- **WHEN** admin attempts to modify a system-reserved role (admin, user)
- **THEN** system returns 400 Bad Request with error "Cannot modify system role"

### Requirement: Admin can delete a role
The system SHALL allow administrators to remove roles from the system.

#### Scenario: Admin deletes role successfully
- **WHEN** admin calls DELETE /api/roles/:id
- **THEN** system deletes the role and returns 204 No Content

#### Scenario: Admin attempts to delete system role
- **WHEN** admin attempts to delete a system-reserved role
- **THEN** system returns 400 Bad Request with error "Cannot delete system role"

#### Scenario: Admin attempts to delete role assigned to users
- **WHEN** admin attempts to delete a role that is currently assigned to users
- **THEN** system returns 400 Bad Request with error "Cannot delete role with assigned users"

### Requirement: Admin can assign role to user
The system SHALL allow administrators to assign roles to users.

#### Scenario: Admin assigns role to user successfully
- **WHEN** admin sends POST /api/users/:userId/roles with valid role ID
- **THEN** system assigns the role to the user and returns 200 OK

#### Scenario: Admin assigns duplicate role to user
- **WHEN** admin attempts to assign a role that user already has
- **THEN** system returns 409 Conflict with error "User already has this role"

### Requirement: Admin can remove role from user
The system SHALL allow administrators to remove roles from users.

#### Scenario: Admin removes role from user successfully
- **WHEN** admin calls DELETE /api/users/:userId/roles/:roleId
- **THEN** system removes the role from the user and returns 204 No Content

#### Scenario: Admin removes role not assigned to user
- **WHEN** admin attempts to remove a role that user does not have
- **THEN** system returns 404 Not Found with error "User does not have this role"