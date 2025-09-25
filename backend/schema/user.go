package schema

import (
	"time"
)

type Role string

const (
	RoleAdmin     Role = "admin"
	RoleUser      Role = "user"
	RoleReadOnly  Role = "readonly"
	RoleTenantAdmin Role = "tenant_admin"
)

type Permission string

const (
	PermissionReadBuckets      Permission = "read_buckets"
	PermissionWriteBuckets     Permission = "write_buckets"
	PermissionDeleteBuckets    Permission = "delete_buckets"
	PermissionReadKeys         Permission = "read_keys"
	PermissionWriteKeys        Permission = "write_keys"
	PermissionDeleteKeys       Permission = "delete_keys"
	PermissionReadCluster      Permission = "read_cluster"
	PermissionWriteCluster     Permission = "write_cluster"
	PermissionReadUsers        Permission = "read_users"
	PermissionWriteUsers       Permission = "write_users"
	PermissionDeleteUsers      Permission = "delete_users"
	PermissionReadTenants      Permission = "read_tenants"
	PermissionWriteTenants     Permission = "write_tenants"
	PermissionDeleteTenants    Permission = "delete_tenants"
	PermissionSystemAdmin      Permission = "system_admin"
)

type User struct {
	ID          string    `json:"id"`
	Username    string    `json:"username"`
	Email       string    `json:"email"`
	PasswordHash string   `json:"password_hash"`
	Role        Role      `json:"role"`
	TenantID    *string   `json:"tenant_id"`
	Enabled     bool      `json:"enabled"`
	LastLogin   *time.Time `json:"last_login"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Tenant struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Enabled     bool      `json:"enabled"`
	MaxBuckets  int       `json:"max_buckets"`
	MaxKeys     int       `json:"max_keys"`
	QuotaBytes  *int64    `json:"quota_bytes"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Session struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Token     string    `json:"-"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateUserRequest represents the request to create a new user
type CreateUserRequest struct {
	Username string  `json:"username"`
	Email    string  `json:"email"`
	Password string  `json:"password"`
	Role     Role    `json:"role"`
	TenantID *string `json:"tenant_id"`
	Enabled  bool    `json:"enabled"`
}

// UpdateUserRequest represents the request to update a user
type UpdateUserRequest struct {
	Username *string `json:"username,omitempty"`
	Email    *string `json:"email,omitempty"`
	Password *string `json:"password,omitempty"`
	Role     *Role   `json:"role,omitempty"`
	TenantID *string `json:"tenant_id,omitempty"`
	Enabled  *bool   `json:"enabled,omitempty"`
}

// CreateTenantRequest represents the request to create a new tenant
type CreateTenantRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Enabled     bool   `json:"enabled"`
	MaxBuckets  int    `json:"max_buckets"`
	MaxKeys     int    `json:"max_keys"`
	QuotaBytes  *int64 `json:"quota_bytes"`
}

// UpdateTenantRequest represents the request to update a tenant
type UpdateTenantRequest struct {
	Name        *string `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
	Enabled     *bool   `json:"enabled,omitempty"`
	MaxBuckets  *int    `json:"max_buckets,omitempty"`
	MaxKeys     *int    `json:"max_keys,omitempty"`
	QuotaBytes  *int64  `json:"quota_bytes,omitempty"`
}

// LoginRequest represents the login request
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse represents the login response
type LoginResponse struct {
	User         User   `json:"user"`
	Token        string `json:"token"`
	ExpiresAt    time.Time `json:"expires_at"`
}

// AuthStatusResponse represents the auth status response
type AuthStatusResponse struct {
	Enabled       bool  `json:"enabled"`
	Authenticated bool  `json:"authenticated"`
	User          *User `json:"user,omitempty"`
}

// GetRolePermissions returns the permissions for a given role
func GetRolePermissions(role Role) []Permission {
	switch role {
	case RoleAdmin:
		return []Permission{
			PermissionSystemAdmin,
			PermissionReadBuckets, PermissionWriteBuckets, PermissionDeleteBuckets,
			PermissionReadKeys, PermissionWriteKeys, PermissionDeleteKeys,
			PermissionReadCluster, PermissionWriteCluster,
			PermissionReadUsers, PermissionWriteUsers, PermissionDeleteUsers,
			PermissionReadTenants, PermissionWriteTenants, PermissionDeleteTenants,
		}
	case RoleTenantAdmin:
		return []Permission{
			PermissionReadBuckets, PermissionWriteBuckets, PermissionDeleteBuckets,
			PermissionReadKeys, PermissionWriteKeys, PermissionDeleteKeys,
			PermissionReadUsers, PermissionWriteUsers, PermissionDeleteUsers,
		}
	case RoleUser:
		return []Permission{
			PermissionReadBuckets, PermissionWriteBuckets,
			PermissionReadKeys, PermissionWriteKeys,
		}
	case RoleReadOnly:
		return []Permission{
			PermissionReadBuckets,
			PermissionReadKeys,
			PermissionReadCluster,
		}
	default:
		return []Permission{}
	}
}

// HasPermission checks if a user has a specific permission
func (u *User) HasPermission(permission Permission) bool {
	permissions := GetRolePermissions(u.Role)
	for _, p := range permissions {
		if p == permission {
			return true
		}
	}
	return false
}