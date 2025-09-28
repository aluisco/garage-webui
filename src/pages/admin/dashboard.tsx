import { usePermissions } from "@/hooks/useAuth";
import { useUsers, useTenants } from "@/hooks/useAdmin";
import { Card, Stats } from "react-daisyui";
import { Users, Building2, ShieldCheck, Database } from "lucide-react";
import TabView from "@/components/containers/tab-view";
import UsersTab from "./tabs/users-tab";
import TenantsTab from "./tabs/tenants-tab";

export default function AdminDashboard() {
  const { hasPermission, isAdmin } = usePermissions();
  const { data: users } = useUsers();
  const { data: tenants } = useTenants();

  const tabs = [
    ...(hasPermission("read_users") ? [{
      name: "users",
      title: "Users",
      icon: Users,
      Component: UsersTab
    }] : []),
    ...(hasPermission("read_tenants") ? [{
      name: "tenants",
      title: "Tenants",
      icon: Building2,
      Component: TenantsTab
    }] : []),
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Administration Panel</h1>
          <p className="text-base-content/60 mt-2">
            Manage users, tenants and system configurations
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {hasPermission("read_users") && (
          <Card className="bg-base-100 shadow-sm">
            <Card.Body className="flex flex-row items-center justify-between p-4">
              <div>
                <div className="text-2xl font-bold">
                  {users?.length || 0}
                </div>
                <div className="text-sm text-base-content/60">Total Users</div>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </Card.Body>
          </Card>
        )}

        {hasPermission("read_users") && (
          <Card className="bg-base-100 shadow-sm">
            <Card.Body className="flex flex-row items-center justify-between p-4">
              <div>
                <div className="text-2xl font-bold">
                  {users?.filter(u => u.enabled).length || 0}
                </div>
                <div className="text-sm text-base-content/60">Active Users</div>
              </div>
              <ShieldCheck className="h-8 w-8 text-success" />
            </Card.Body>
          </Card>
        )}

        {hasPermission("read_tenants") && (
          <Card className="bg-base-100 shadow-sm">
            <Card.Body className="flex flex-row items-center justify-between p-4">
              <div>
                <div className="text-2xl font-bold">
                  {tenants?.length || 0}
                </div>
                <div className="text-sm text-base-content/60">Total Tenants</div>
              </div>
              <Building2 className="h-8 w-8 text-info" />
            </Card.Body>
          </Card>
        )}

        {hasPermission("read_tenants") && (
          <Card className="bg-base-100 shadow-sm">
            <Card.Body className="flex flex-row items-center justify-between p-4">
              <div>
                <div className="text-2xl font-bold">
                  {tenants?.filter(t => t.enabled).length || 0}
                </div>
                <div className="text-sm text-base-content/60">Active Tenants</div>
              </div>
              <Database className="h-8 w-8 text-warning" />
            </Card.Body>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <TabView tabs={tabs} />
    </div>
  );
}