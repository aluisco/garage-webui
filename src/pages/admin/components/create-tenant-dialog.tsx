import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, Button } from "react-daisyui";
import { InputField } from "@/components/ui/input";
import { useCreateTenant } from "@/hooks/useAdmin";
import { Toggle } from "@/components/ui/toggle";

const createTenantSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string(),
  enabled: z.boolean(),
  max_buckets: z.number().min(0, "Debe ser un número positivo"),
  max_keys: z.number().min(0, "Debe ser un número positivo"),
  quota_bytes: z.number().min(0, "Debe ser un número positivo").optional(),
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
        Crear Nuevo Tenant
      </Modal.Header>

      <Modal.Body>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <InputField
            form={form}
            name="name"
            title="Nombre del Tenant"
            placeholder="Ej: Empresa ABC"
            required
          />

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Descripción</span>
            </label>
            <textarea
              {...form.register("description")}
              className="textarea textarea-bordered"
              placeholder="Descripción opcional del tenant"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              form={form}
              name="max_buckets"
              title="Máximo de Buckets"
              type="number"
              min={0}
              placeholder="10"
              required
            />

            <InputField
              form={form}
              name="max_keys"
              title="Máximo de Keys"
              type="number"
              min={0}
              placeholder="100"
              required
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Cuota de Almacenamiento (GB)</span>
              <span className="label-text-alt">Opcional</span>
            </label>
            <input
              type="number"
              step="0.1"
              min={0}
              className="input input-bordered"
              placeholder="Ej: 100 (para 100GB)"
              onChange={(e) => {
                const bytes = formatBytesInput(e.target.value);
                form.setValue("quota_bytes", bytes > 0 ? bytes : undefined);
              }}
            />
            <label className="label">
              <span className="label-text-alt">
                Dejar vacío para sin límite
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start space-x-3">
              <Toggle
                {...form.register("enabled")}
                color="success"
              />
              <span className="label-text">Tenant habilitado</span>
            </label>
          </div>
        </form>
      </Modal.Body>

      <Modal.Actions>
        <Button onClick={onClose} disabled={createTenant.isPending}>
          Cancelar
        </Button>
        <Button
          color="primary"
          loading={createTenant.isPending}
          onClick={form.handleSubmit(handleSubmit)}
        >
          Crear Tenant
        </Button>
      </Modal.Actions>
    </Modal>
  );
}