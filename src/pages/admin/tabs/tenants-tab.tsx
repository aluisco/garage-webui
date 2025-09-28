import { useState } from "react";
import { useTenants, useDeleteTenant } from "@/hooks/useAdmin";
import { usePermissions } from "@/hooks/useAuth";
import { Card, Table, Button, Badge } from "react-daisyui";
import { Plus, Edit, Trash2, Eye, Building2 } from "lucide-react";
import CreateTenantDialog from "../components/create-tenant-dialog";
import EditTenantDialog from "../components/edit-tenant-dialog";
import ViewTenantDialog from "../components/view-tenant-dialog";
import { Tenant } from "@/types/admin";
import dayjs from "dayjs";
import { confirmDelete } from "@/lib/sweetalert";

export default function TenantsTab() {
  const { hasPermission } = usePermissions();
  const { data: tenants, isLoading } = useTenants();
  const deleteTenant = useDeleteTenant();

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const handleDelete = async (tenant: Tenant) => {
    const result = await confirmDelete(
      tenant.name,
      'tenant',
      'This action cannot be undone and all associated users will lose access to the tenant.'
    );

    if (result.isConfirmed) {
      try {
        await deleteTenant.mutateAsync(tenant.id);
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  };

  const formatBytes = (bytes: number | null | undefined) => {
    if (!bytes) return "No limit";

    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">
      <span className="loading loading-spinner loading-lg"></span>
    </div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Tenant Management</h2>
          <p className="text-sm text-base-content/60">
            Manage tenants and their configurations
          </p>
        </div>

        {hasPermission("write_tenants") && (
          <Button
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={() => setShowCreateDialog(true)}
          >
            New Tenant
          </Button>
        )}
      </div>

      {/* Tenants Table */}
      <Card className="bg-base-100">
        <Card.Body className="p-0">
          <Table className="table-zebra">
            <Table.Head>
              <span>Tenant</span>
              <span>Description</span>
              <span>Status</span>
              <span>Limits</span>
              <span>Quota</span>
              <span>Created</span>
              <span>Actions</span>
            </Table.Head>

            <Table.Body>
              {tenants?.map((tenant) => (
                <Table.Row key={tenant.id}>
                  <td>
                    <div className="flex items-center space-x-3">
                      <div className="avatar placeholder">
                        <div className="bg-primary text-primary-content rounded-lg w-10 h-10">
                          <Building2 size={20} />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">{tenant.name}</div>
                        <div className="text-sm opacity-50">ID: {tenant.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="max-w-xs truncate">
                      {tenant.description || "No description"}
                    </div>
                  </td>

                  <td>
                    <Badge className={tenant.enabled ? "badge-success" : "badge-error"}>
                      {tenant.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </td>

                  <td>
                    <div className="text-sm">
                      <div>Buckets: {tenant.max_buckets}</div>
                      <div>Keys: {tenant.max_keys}</div>
                    </div>
                  </td>

                  <td>
                    <span className="text-sm">
                      {formatBytes(tenant.quota_bytes)}
                    </span>
                  </td>

                  <td>
                    <span className="text-sm">
                      {dayjs(tenant.created_at).format("DD/MM/YYYY")}
                    </span>
                  </td>

                  <td>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        color="ghost"
                        shape="square"
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setShowViewDialog(true);
                        }}
                      >
                        <Eye size={16} />
                      </Button>

                      {hasPermission("write_tenants") && (
                        <Button
                          size="sm"
                          color="ghost"
                          shape="square"
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit size={16} />
                        </Button>
                      )}

                      {hasPermission("delete_tenants") && (
                        <Button
                          size="sm"
                          color="ghost"
                          shape="square"
                          onClick={() => handleDelete(tenant)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </td>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {tenants?.length === 0 && (
            <div className="text-center py-8 text-base-content/60">
              No tenants registered
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Dialogs */}
      <CreateTenantDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      <EditTenantDialog
        open={showEditDialog}
        tenant={selectedTenant}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedTenant(null);
        }}
      />

      <ViewTenantDialog
        open={showViewDialog}
        tenant={selectedTenant}
        onClose={() => {
          setShowViewDialog(false);
          setSelectedTenant(null);
        }}
      />

    </div>
  );
}