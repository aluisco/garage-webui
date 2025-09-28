import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, Button, Select } from "react-daisyui";
import { InputField } from "@/components/ui/input";
import { useUpdateUser, useTenants } from "@/hooks/useAdmin";
import { usePermissions } from "@/hooks/useAuth";
import { User } from "@/types/admin";
import { Toggle } from "@/components/ui/toggle";

const updateUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  email: z.string().email("Invalid email").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["admin", "tenant_admin", "user", "readonly"] as const).optional(),
  tenant_id: z.string().optional(),
  enabled: z.boolean().optional(),
});

type UpdateUserForm = z.infer<typeof updateUserSchema>;

interface EditUserDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

export default function EditUserDialog({ open, user, onClose }: EditUserDialogProps) {
  const updateUser = useUpdateUser();
  const { data: tenants } = useTenants();
  const { isAdmin } = usePermissions();

  const form = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
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

  useEffect(() => {
    if (user && open) {
      form.reset({
        username: user.username,
        email: user.email,
        password: "",
        role: user.role,
        tenant_id: user.tenant_id || "",
        enabled: user.enabled,
      });
    }
  }, [user, open, form]);

  const handleSubmit = async (data: UpdateUserForm) => {
    if (!user) return;

    try {
      // Remove empty password field
      const updateData = { ...data };
      if (!updateData.password) {
        delete updateData.password;
      }

      // Convert empty tenant_id to undefined
      if (updateData.tenant_id === "") {
        updateData.tenant_id = undefined;
      }

      await updateUser.mutateAsync({
        id: user.id,
        data: updateData,
      });
      onClose();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const roleOptions = [
    ...(isAdmin ? [{ value: "admin", label: "Administrator" }] : []),
    { value: "tenant_admin", label: "Tenant Administrator" },
    { value: "user", label: "User" },
    { value: "readonly", label: "Read Only" },
  ];

  if (!user) return null;

  return (
    <Modal open={open} onClickBackdrop={onClose}>
      <Modal.Header className="font-bold">
        Edit User: {user.username}
      </Modal.Header>

      <Modal.Body>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <InputField
            form={form}
            name="username"
            title="Username"
            placeholder="Enter username"
          />

          <InputField
            form={form}
            name="email"
            title="Email"
            type="email"
            placeholder="Enter email"
          />

          <InputField
            form={form}
            name="password"
            title="New Password"
            type="password"
            placeholder="Leave blank to keep current"
          />

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Role</span>
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
                <Select.Option value="">No tenant</Select.Option>
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
              <span className="label-text">User enabled</span>
            </label>
          </div>
        </form>
      </Modal.Body>

      <Modal.Actions>
        <Button onClick={onClose} disabled={updateUser.isPending}>
          Cancel
        </Button>
        <Button
          color="primary"
          loading={updateUser.isPending}
          onClick={form.handleSubmit(handleSubmit)}
        >
          Update User
        </Button>
      </Modal.Actions>
    </Modal>
  );
}