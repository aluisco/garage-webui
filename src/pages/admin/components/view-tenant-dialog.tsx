import { Modal, Button, Badge } from "react-daisyui";
import { Tenant } from "@/types/admin";
import { useTenantStats } from "@/hooks/useAdmin";
import dayjs from "dayjs";
import { Building2, Users, Database, HardDrive, Calendar, Settings } from "lucide-react";

interface ViewTenantDialogProps {
  open: boolean;
  tenant: Tenant | null;
  onClose: () => void;
}

export default function ViewTenantDialog({ open, tenant, onClose }: ViewTenantDialogProps) {
  const { data: stats, isLoading: statsLoading } = useTenantStats(tenant?.id || "");

  if (!tenant) return null;

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

  return (
    <Modal open={open} onClickBackdrop={onClose}>
      <Modal.Header className="font-bold">
        <div className="flex items-center space-x-3">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-lg w-12 h-12">
              <Building2 size={24} />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold">{tenant.name}</h3>
            <p className="text-sm opacity-60">Tenant Details</p>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="flex items-center space-x-2 font-semibold text-base mb-3">
                <Settings size={18} />
                <span>Basic Information</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text font-medium">Tenant ID</span>
                  </label>
                  <div className="text-sm font-mono bg-base-300 p-2 rounded">
                    {tenant.id}
                  </div>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-medium">Status</span>
                  </label>
                  <div>
                    <Badge className={tenant.enabled ? "badge-success" : "badge-error"}>
                      {tenant.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="label">
                    <span className="label-text font-medium">Description</span>
                  </label>
                  <div className="text-sm bg-base-300 p-2 rounded min-h-[2.5rem]">
                    {tenant.description || "No description provided"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Limits & Quotas */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="flex items-center space-x-2 font-semibold text-base mb-3">
                <HardDrive size={18} />
                <span>Limits & Quotas</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat bg-base-300 rounded-lg">
                  <div className="stat-figure text-primary">
                    <Database size={24} />
                  </div>
                  <div className="stat-title text-xs">Max Buckets</div>
                  <div className="stat-value text-lg">{tenant.max_buckets}</div>
                </div>

                <div className="stat bg-base-300 rounded-lg">
                  <div className="stat-figure text-secondary">
                    <Settings size={24} />
                  </div>
                  <div className="stat-title text-xs">Max Keys</div>
                  <div className="stat-value text-lg">{tenant.max_keys}</div>
                </div>

                <div className="stat bg-base-300 rounded-lg">
                  <div className="stat-figure text-accent">
                    <HardDrive size={24} />
                  </div>
                  <div className="stat-title text-xs">Storage Quota</div>
                  <div className="stat-value text-lg">{formatBytes(tenant.quota_bytes)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="flex items-center space-x-2 font-semibold text-base mb-3">
                <Users size={18} />
                <span>Usage Statistics</span>
              </h4>
              
              {statsLoading ? (
                <div className="flex justify-center p-4">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="stat bg-base-300 rounded-lg">
                    <div className="stat-title text-xs">Users</div>
                    <div className="stat-value text-lg">{stats?.user_count || 0}</div>
                  </div>

                  <div className="stat bg-base-300 rounded-lg">
                    <div className="stat-title text-xs">Buckets</div>
                    <div className="stat-value text-lg">{stats?.bucket_count || 0}</div>
                  </div>

                  <div className="stat bg-base-300 rounded-lg">
                    <div className="stat-title text-xs">Keys</div>
                    <div className="stat-value text-lg">{stats?.key_count || 0}</div>
                  </div>

                  <div className="stat bg-base-300 rounded-lg">
                    <div className="stat-title text-xs">Storage Used</div>
                    <div className="stat-value text-lg">{formatBytes(stats?.total_size)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="flex items-center space-x-2 font-semibold text-base mb-3">
                <Calendar size={18} />
                <span>Timestamps</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text font-medium">Created</span>
                  </label>
                  <div className="text-sm">
                    {dayjs(tenant.created_at).format("DD/MM/YYYY HH:mm:ss")}
                  </div>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-medium">Last Updated</span>
                  </label>
                  <div className="text-sm">
                    {dayjs(tenant.updated_at).format("DD/MM/YYYY HH:mm:ss")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Actions>
        <Button onClick={onClose}>
          Close
        </Button>
      </Modal.Actions>
    </Modal>
  );
}