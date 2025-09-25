import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, Button, Select } from "react-daisyui";
import { InputField } from "@/components/ui/input";
import { useCreateUser, useTenants } from "@/hooks/useAdmin";
import { usePermissions } from "@/hooks/useAuth";
import { Role } from "@/types/admin";
import { Toggle } from "@/components/ui/toggle";

const createUserSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["admin", "tenant_admin", "user", "readonly"] as const),
  tenant_id: z.string().optional(),
  enabled: z.boolean(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateUserDialog({ open, onClose }: CreateUserDialogProps) {
  const createUser = useCreateUser();
  const { data: tenants } = useTenants();
  const { isAdmin } = usePermissions();

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: "user",
      tenant_id: "",
      enabled: true,
    },
  });

  const selectedRole = form.watch("role");

  const handleSubmit = async (data: CreateUserForm) => {
    try {
      await createUser.mutateAsync({
        ...data,
        tenant_id: data.tenant_id || undefined,
      });
      onClose();
      form.reset();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const roleOptions = [
    ...(isAdmin ? [{ value: "admin", label: "Administrador" }] : []),
    { value: "tenant_admin", label: "Administrador de Tenant" },
    { value: "user", label: "Usuario" },
    { value: "readonly", label: "Solo Lectura" },
  ];

  return (
    <Modal open={open} onClickBackdrop={onClose}>
      <Modal.Header className="font-bold">
        Crear Nuevo Usuario
      </Modal.Header>

      <Modal.Body>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <InputField
            form={form}
            name="username"
            title="Nombre de Usuario"
            placeholder="Ingresa el nombre de usuario"
            required
          />

          <InputField
            form={form}
            name="email"
            title="Email"
            type="email"
            placeholder="Ingresa el email"
            required
          />

          <InputField
            form={form}
            name="password"
            title="Contraseña"
            type="password"
            placeholder="Ingresa la contraseña"
            required
          />

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Rol</span>
            </label>
            <Select
              {...form.register("role")}
              className="select-bordered"
            >
              {roleOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
            {form.formState.errors.role && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {form.formState.errors.role.message}
                </span>
              </label>
            )}
          </div>

          {/* Show tenant selector for tenant_admin and user roles */}
          {(selectedRole === "tenant_admin" || selectedRole === "user") && (
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Tenant</span>
              </label>
              <Select
                {...form.register("tenant_id")}
                className="select-bordered"
              >
                <Select.Option value="">Seleccionar tenant (opcional)</Select.Option>
                {tenants?.map((tenant) => (
                  <Select.Option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
          )}

          <div className="form-control">
            <label className="label cursor-pointer justify-start space-x-3">
              <Toggle
                {...form.register("enabled")}
                color="success"
              />
              <span className="label-text">Usuario habilitado</span>
            </label>
          </div>
        </form>
      </Modal.Body>

      <Modal.Actions>
        <Button onClick={onClose} disabled={createUser.isPending}>
          Cancelar
        </Button>
        <Button
          color="primary"
          loading={createUser.isPending}
          onClick={form.handleSubmit(handleSubmit)}
        >
          Crear Usuario
        </Button>
      </Modal.Actions>
    </Modal>
  );
}