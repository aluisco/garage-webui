export type Role = "admin" | "user" | "readonly" | "tenant_admin";

export type Permission =
  | "read_buckets"
  | "write_buckets"
  | "delete_buckets"
  | "read_keys"
  | "write_keys"
  | "delete_keys"
  | "read_cluster"
  | "write_cluster"
  | "read_users"
  | "write_users"
  | "delete_users"
  | "read_tenants"
  | "write_tenants"
  | "delete_tenants"
  | "system_admin";

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  tenant_id?: string;
  enabled: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  max_buckets: number;
  max_keys: number;
  quota_bytes?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: Role;
  tenant_id?: string;
  enabled: boolean;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: Role;
  tenant_id?: string;
  enabled?: boolean;
}

export interface CreateTenantRequest {
  name: string;
  description: string;
  enabled: boolean;
  max_buckets: number;
  max_keys: number;
  quota_bytes?: number;
}

export interface UpdateTenantRequest {
  name?: string;
  description?: string;
  enabled?: boolean;
  max_buckets?: number;
  max_keys?: number;
  quota_bytes?: number;
}

export interface LoginResponse {
  user: User;
  token: string;
  expires_at: string;
}

export interface AuthStatusResponse {
  enabled: boolean;
  authenticated: boolean;
  user?: User;
}

export interface TenantStats {
  tenant: Tenant;
  bucket_count: number;
  key_count: number;
  total_size: number;
  user_count: number;
}