import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, Button } from "react-daisyui";
import { InputField } from "@/components/ui/input";
import { useCreateTenant } from "@/hooks/useAdmin";
import { Toggle } from "@/components/ui/toggle";
import { confirmAction } from "@/lib/sweetalert";

const createTenantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string(),
  enabled: z.boolean(),
  max_buckets: z.number().min(0, "Must be a positive number"),
  max_keys: z.number().min(0, "Must be a positive number"),
  quota_bytes: z.number().min(0, "Must be a positive number").optional(),
});

type CreateTenantForm = z.infer<typeof createTenantSchema>;

interface CreateTenantDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateTenantDialog({ open, onClose }: CreateTenantDialogProps) {
  const createTenant = useCreateTenant();

  const form = useForm<CreateTenantForm>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: "",
      description: "",
      enabled: true,
      max_buckets: 10,
      max_keys: 100,
      quota_bytes: undefined,
    },
  });

  const handleSubmit = async (data: CreateTenantForm) => {
    // Mostrar confirmación antes de crear
    const result = await confirmAction(
      'Create Tenant',
      `Are you sure you want to create the tenant "${data.name}"?`,
      'Yes, create tenant',
      'Cancel',
      'question'
    );

    if (result.isConfirmed) {
      try {
        await createTenant.mutateAsync({
          ...data,
          quota_bytes: data.quota_bytes || undefined,
        });
        onClose();
        form.reset();
      } catch (error) {
        // Error is handled by the mutation
      }
    }
  };

  const formatBytesInput = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 0;

    // Assume input is in GB, convert to bytes
    return Math.floor(num * 1024 * 1024 * 1024);
  };

  return (
    <Modal open={open} onClickBackdrop={onClose}>
      <Modal.Header className="font-bold">
        Create New Tenant
      </Modal.Header>

      <Modal.Body>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <InputField
            form={form}
            name="name"
            title="Tenant Name"
            placeholder="e.g. Company ABC"
            required
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
              placeholder="10"
              required
            />

            <InputField
              form={form}
              name="max_keys"
              title="Maximum Keys"
              type="number"
              min={0}
              placeholder="100"
              required
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
              onChange={(e) => {
                const bytes = formatBytesInput(e.target.value);
                form.setValue("quota_bytes", bytes > 0 ? bytes : undefined);
              }}
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
        <Button onClick={onClose} disabled={createTenant.isPending}>
          Cancel
        </Button>
        <Button
          color="primary"
          loading={createTenant.isPending}
          onClick={form.handleSubmit(handleSubmit)}
        >
          Create Tenant
        </Button>
      </Modal.Actions>
    </Modal>
  );
}