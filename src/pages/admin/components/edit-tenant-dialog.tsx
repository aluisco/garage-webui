import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, Button } from "react-daisyui";
import { InputField } from "@/components/ui/input";
import { useUpdateTenant } from "@/hooks/useAdmin";
import { Tenant } from "@/types/admin";
import { Toggle } from "@/components/ui/toggle";
import { confirmAction } from "@/lib/sweetalert";

const updateTenantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  max_buckets: z.number().min(0, "Must be a positive number").optional(),
  max_keys: z.number().min(0, "Must be a positive number").optional(),
  quota_bytes: z.number().min(0, "Must be a positive number").optional(),
});

type UpdateTenantForm = z.infer<typeof updateTenantSchema>;

interface EditTenantDialogProps {
  open: boolean;
  tenant: Tenant | null;
  onClose: () => void;
}

export default function EditTenantDialog({ open, tenant, onClose }: EditTenantDialogProps) {
  const updateTenant = useUpdateTenant();
  const [quotaGB, setQuotaGB] = useState<string>("");

  const form = useForm<UpdateTenantForm>({
    resolver: zodResolver(updateTenantSchema),
    defaultValues: {
      name: "",
      description: "",
      enabled: true,
      max_buckets: 10,
      max_keys: 100,
      quota_bytes: undefined,
    },
  });

  useEffect(() => {
    if (tenant && open) {
      form.reset({
        name: tenant.name,
        description: tenant.description,
        enabled: tenant.enabled,
        max_buckets: tenant.max_buckets,
        max_keys: tenant.max_keys,
        quota_bytes: tenant.quota_bytes,
      });

      // Convert bytes to GB for display
      if (tenant.quota_bytes) {
        const gb = tenant.quota_bytes / (1024 * 1024 * 1024);
        setQuotaGB(gb.toString());
      } else {
        setQuotaGB("");
      }
    }
  }, [tenant, open, form]);

  const handleSubmit = async (data: UpdateTenantForm) => {
    if (!tenant) return;

    // Mostrar confirmación antes de actualizar
    const result = await confirmAction(
      'Update Tenant',
      `Are you sure you want to update the tenant "${tenant.name}"?`,
      'Yes, update tenant',
      'Cancel',
      'question'
    );

    if (result.isConfirmed) {
      try {
        await updateTenant.mutateAsync({
          id: tenant.id,
          data,
        });
        onClose();
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  };

  const formatBytesInput = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return undefined;

    // Assume input is in GB, convert to bytes
    return Math.floor(num * 1024 * 1024 * 1024);
  };

  const handleQuotaChange = (value: string) => {
    setQuotaGB(value);
    const bytes = formatBytesInput(value);
    form.setValue("quota_bytes", bytes);
  };

  if (!tenant) return null;

  return (
    <Modal open={open} onClickBackdrop={onClose}>
      <Modal.Header className="font-bold">
        Edit Tenant: {tenant.name}
      </Modal.Header>

      <Modal.Body>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <InputField
            form={form}
            name="name"
            title="Tenant Name"
            placeholder="e.g. Company ABC"
          />

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              {...form.register("description")}
              className="textarea textarea-bordered"
              placeholder="Optional tenant description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              form={form}
              name="max_buckets"
              title="Maximum Buckets"
              type="number"
              min={0}
            />

            <InputField
              form={form}
              name="max_keys"
              title="Maximum Keys"
              type="number"
              min={0}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Storage Quota (GB)</span>
              <span className="label-text-alt">Optional</span>
            </label>
            <input
              type="number"
              step="0.1"
              min={0}
              className="input input-bordered"
              placeholder="e.g. 100 (for 100GB)"
              value={quotaGB}
              onChange={(e) => handleQuotaChange(e.target.value)}
            />
            <label className="label">
              <span className="label-text-alt">
                Leave empty for no limit
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start space-x-3">
              <Toggle
                {...form.register("enabled")}
                color="success"
              />
              <span className="label-text">Tenant enabled</span>
            </label>
          </div>
        </form>
      </Modal.Body>

      <Modal.Actions>
        <Button onClick={onClose} disabled={updateTenant.isPending}>
          Cancel
        </Button>
        <Button
          color="primary"
          loading={updateTenant.isPending}
          onClick={form.handleSubmit(handleSubmit)}
        >
          Update Tenant
        </Button>
      </Modal.Actions>
    </Modal>
  );
}