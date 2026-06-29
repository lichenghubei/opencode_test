## ADDED Requirements

### Requirement: System defines permission categories
The system SHALL organize permissions into resource-based categories for manageability.

#### Scenario: Permission categories exist
- **WHEN** system is initialized
- **THEN** permission categories include: users, roles, auth, and each contains granular permissions

### Requirement: Admin can create custom permissions
The system SHALL allow administrators to define new permissions beyond system defaults.

#### Scenario: Admin creates permission successfully
- **WHEN** admin sends POST /api/permissions with valid permission name, category, and description
- **THEN** system creates the permission and returns 201 Created

#### Scenario: Admin creates duplicate permission
- **WHEN** admin attempts to create a permission with a name that already exists
- **THEN** system returns 409 Conflict with error "Permission already exists"

### Requirement: Admin can list all permissions
The system SHALL allow administrators to retrieve all defined permissions.

#### Scenario: Admin lists permissions successfully
- **WHEN** admin calls GET /api/permissions
- **THEN** system returns 200 OK with array of permission objects grouped by category

### Requirement: Permission check validates user permissions
The system SHALL verify user has required permissions before allowing access to protected resources.

#### Scenario: User has required permission
- **WHEN** user with appropriate role calls endpoint requiring specific permission
- **THEN** system allows the request to proceed

#### Scenario: User lacks required permission
- **WHEN** user without required permission calls protected endpoint
- **THEN** system returns 403 Forbidden with error "Insufficient permissions"

### Requirement: Permission inheritance through roles
The system SHALL aggregate permissions from all roles assigned to a user.

#### Scenario: User has permissions from multiple roles
- **WHEN** user has Role A (permissions X, Y) and Role B (permissions Y, Z)
- **THEN** user has aggregate permissions X, Y, Z

#### Scenario: User with no roles has no permissions
- **WHEN** user has no roles assigned
- **THEN** user has no permissions beyond basic authentication

### Requirement: Permission can be denied at role level
The system SHALL allow explicit permission denials at role level that override grants.

#### Scenario: Role explicitly denies permission
- **WHEN** role has explicit deny for a permission
- **THEN** user with that role cannot perform the action even if other roles grant it

### Requirement: Permission cache improves performance
The system SHALL cache role-permission mappings to reduce database lookups.

#### Scenario: Cached permissions used for subsequent requests
- **WHEN** authenticated user makes multiple requests
- **THEN** subsequent requests use cached permissions from first validation

#### Scenario: Cache invalidated on role change
- **WHEN** admin modifies user's roles
- **THEN** permission cache is invalidated for that user