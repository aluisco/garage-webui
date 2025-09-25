import { usePermissions } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import AdminDashboard from "./dashboard";

export default function AdminPage() {
  const { hasPermission } = usePermissions();

  // Check if user has admin permissions
  if (!hasPermission("system_admin") && !hasPermission("read_users") && !hasPermission("read_tenants")) {
    return <Navigate to="/" replace />;
  }

  return <AdminDashboard />;
}