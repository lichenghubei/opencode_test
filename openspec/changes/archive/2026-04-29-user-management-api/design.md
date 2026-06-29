## Context

This design addresses the implementation of a user authentication and role-based access control (RBAC) system for the application. The current system lacks any authentication mechanism, requiring all API endpoints to be secured. This change will introduce JWT-based authentication with a complete RBAC system including users, roles, and permissions.

## Goals / Non-Goals

**Goals:**
- Implement secure user authentication with bcrypt password hashing
- Create JWT-based session management with access and refresh tokens
- Build a complete RBAC system with roles and permissions
- Provide middleware for route protection based on roles/permissions
- Enable user self-service (registration, login, password reset)

**Non-Goals:**
- Social login integration (Google, GitHub, etc.)
- Email verification flow
- Multi-factor authentication (MFA)
- Integration with external identity providers (OAuth2/OIDC)
- Rate limiting on auth endpoints (handled separately)

## Decisions

### 1. JWT Token Strategy
**Decision:** Use short-lived access tokens (15 min) with long-lived refresh tokens (7 days)

**Rationale:** Balances security with usability. Short access tokens limit damage from token theft while refresh tokens allow persistent sessions without re-authentication.

**Alternative Considered:** Single long-lived token (1 day) - rejected due to higher risk if compromised

### 2. Password Hashing
**Decision:** Use bcrypt with cost factor 12

**Rationale:** Industry-standard, well-audited, and configurable work factor. Cost factor 12 provides good security without excessive computational overhead.

**Alternative Considered:** Argon2 - considered but bcrypt has wider library support and simpler deployment

### 3. Database Schema Design
**Decision:** Separate tables for users, roles, permissions with many-to-many relationships via junction tables

**Rationale:** Normalized schema allows flexible role-permission assignments and future scalability. Supports users having multiple roles.

**Alternative Considered:** Role-based column in users table - rejected for limited flexibility

### 4. Permission System Architecture
**Decision:** Hierarchical permission system with granular permissions grouped by resource

**Rationale:** Enables fine-grained access control while maintaining manageability. Permissions like `users.read`, `users.write`, `users.delete` allow flexible role assignment.

**Alternative Considered:** Role-only system without granular permissions - rejected for insufficient flexibility

### 5. Middleware Pattern
**Decision:** Two middleware layers - authentication middleware and authorization middleware

**Rationale:** Separates concerns: auth middleware verifies JWT, authorization middleware checks permissions. Allows routes to require auth only, or auth + specific permissions.

**Alternative Considered:** Single combined middleware - rejected for reduced flexibility

### 6. Token Storage
**Decision:** Tokens stored in HTTP-only cookies for web clients, returned as JSON for API clients

**Rationale:** HTTP-only cookies protect against XSS attacks for browser clients while maintaining API compatibility.

**Alternative Considered:** LocalStorage only - rejected due to XSS vulnerability

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| JWT token leakage | High | Short access token expiry, token rotation on refresh |
| Password database breach | High | bcrypt with high cost factor, never store plain passwords |
| Permission escalation | High | Strict role-permission validation, audit logging |
| Refresh token theft | Medium | Store refresh token hash, implement token revocation |
| Scalability with RBAC | Low | Index permission checks, cache role-permission mappings |
| Session management complexity | Medium | Centralized token service, clear token lifecycle |

**Trade-offs:**
- Increased API latency due to permission checks on every request → mitigated with middleware caching
- Additional database storage for roles/permissions tables → acceptable for feature requirements
- Complexity in permission assignment UI → focused on API-first, UI can be added later