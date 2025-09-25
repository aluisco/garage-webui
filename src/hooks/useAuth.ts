import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { AuthStatusResponse, Permission, User } from "@/types/admin";

export const useAuth = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["auth"],
    queryFn: () => api.get<AuthStatusResponse>("/auth/status"),
    retry: false,
  });

  console.log("useAuth data:", data);

  return {
    isLoading,
    isEnabled: data?.data?.enabled,
    isAuthenticated: data?.data?.authenticated,
    user: data?.data?.user,
  };
};

// Role permissions mapping
const rolePermissions: Record<string, Permission[]> = {
  admin: [
    "system_admin",
    "read_buckets", "write_buckets", "delete_buckets",
    "read_keys", "write_keys", "delete_keys",
    "read_cluster", "write_cluster",
    "read_users", "write_users", "delete_users",
    "read_tenants", "write_tenants", "delete_tenants",
  ],
  tenant_admin: [
    "read_buckets", "write_buckets", "delete_buckets",
    "read_keys", "write_keys", "delete_keys",
    "read_users", "write_users", "delete_users",
  ],
  user: [
    "read_buckets", "write_buckets",
    "read_keys", "write_keys",
  ],
  readonly: [
    "read_buckets",
    "read_keys",
    "read_cluster",
  ],
};

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    const permissions = rolePermissions[user.role] || [];
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  return {
    hasPermission,
    hasAnyPermission,
    isAdmin: hasPermission("system_admin"),
    isTenantAdmin: user?.role === "tenant_admin",
    isUser: user?.role === "user",
    isReadOnly: user?.role === "readonly",
  };
};
