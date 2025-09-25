import { useState } from "react";
import { useTenants, useDeleteTenant } from "@/hooks/useAdmin";
import { usePermissions } from "@/hooks/useAuth";
import { Card, Table, Button, Badge, Modal } from "react-daisyui";
import { Plus, Edit, Trash2, Eye, Building, Building2 } from "lucide-react";
import CreateTenantDialog from "../components/create-tenant-dialog";
import EditTenantDialog from "../components/edit-tenant-dialog";
import { Tenant } from "@/types/admin";
import dayjs from "dayjs";

export default function TenantsTab() {
  const { hasPermission } = usePermissions();
  const { data: tenants, isLoading } = useTenants();
  const deleteTenant = useDeleteTenant();

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!selectedTenant) return;

    try {
      await deleteTenant.mutateAsync(selectedTenant.id);
      setShowDeleteConfirm(false);
      setSelectedTenant(null);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const formatBytes = (bytes: number | null | undefined) => {
    if (!bytes) return "Sin límite";

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
          <h2 className="text-xl font-semibold">Gestión de Tenants</h2>
          <p className="text-sm text-base-content/60">
            Administra tenants y sus configuraciones
          </p>
        </div>

        {hasPermission("write_tenants") && (
          <Button
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={() => setShowCreateDialog(true)}
          >
            Nuevo Tenant
          </Button>
        )}
      </div>

      {/* Tenants Table */}
      <Card className="bg-base-100">
        <Card.Body className="p-0">
          <Table className="table-zebra">
            <Table.Head>
              <span>Tenant</span>
              <span>Descripción</span>
              <span>Estado</span>
              <span>Límites</span>
              <span>Cuota</span>
              <span>Creado</span>
              <span>Acciones</span>
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
                      {tenant.description || "Sin descripción"}
                    </div>
                  </td>

                  <td>
                    <Badge className={tenant.enabled ? "badge-success" : "badge-error"}>
                      {tenant.enabled ? "Activo" : "Inactivo"}
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
                        onClick={() => setSelectedTenant(tenant)}
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
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setShowDeleteConfirm(true);
                          }}
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
              No hay tenants registrados
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

      {/* Delete Confirmation */}
      <Modal open={showDeleteConfirm} onClickBackdrop={() => setShowDeleteConfirm(false)}>
        <Modal.Header className="font-bold">
          Confirmar Eliminación
        </Modal.Header>

        <Modal.Body>
          <p>
            ¿Estás seguro de que deseas eliminar el tenant{" "}
            <strong>{selectedTenant?.name}</strong>?
          </p>
          <p className="text-sm text-base-content/60 mt-2">
            Esta acción no se puede deshacer y todos los usuarios asociados
            perderán el acceso al tenant.
          </p>
        </Modal.Body>

        <Modal.Actions>
          <Button onClick={() => setShowDeleteConfirm(false)}>
            Cancelar
          </Button>
          <Button
            color="error"
            loading={deleteTenant.isPending}
            onClick={handleDelete}
          >
            Eliminar
          </Button>
        </Modal.Actions>
      </Modal>
    </div>
  );
}