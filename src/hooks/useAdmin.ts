import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Tenant,
  CreateUserRequest,
  UpdateUserRequest,
  CreateTenantRequest,
  UpdateTenantRequest,
  TenantStats
} from "@/types/admin";
import { toast } from "sonner";

// User hooks
export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const response = await api.get<User[]>("/users");
        return response?.data || [];
      } catch (error) {
        console.error("Failed to fetch users:", error);
        return [];
      }
    },
    retry: 2,
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ["users", id],
    queryFn: async () => {
      const response = await api.get<User>(`/users/${id}`);
      return response?.data;
    },
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => api.post<User>("/users", { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario creado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear usuario");
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      api.put<User>(`/users/${id}`, { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario actualizado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar usuario");
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar usuario");
    },
  });
};

// Tenant hooks
export const useTenants = () => {
  return useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      try {
        const response = await api.get<Tenant[]>("/tenants");
        return response?.data || [];
      } catch (error) {
        console.error("Failed to fetch tenants:", error);
        return [];
      }
    },
    retry: 2,
  });
};

export const useTenant = (id: string) => {
  return useQuery({
    queryKey: ["tenants", id],
    queryFn: async () => {
      const response = await api.get<Tenant>(`/tenants/${id}`);
      return response?.data;
    },
    enabled: !!id,
  });
};

export const useTenantStats = (id: string) => {
  return useQuery({
    queryKey: ["tenants", id, "stats"],
    queryFn: async () => {
      const response = await api.get<TenantStats>(`/tenants/${id}/stats`);
      return response?.data;
    },
    enabled: !!id,
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTenantRequest) => api.post<Tenant>("/tenants", { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant creado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear tenant");
    },
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantRequest }) =>
      api.put<Tenant>(`/tenants/${id}`, { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant actualizado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar tenant");
    },
  });
};

export const useDeleteTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/tenants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al eliminar tenant");
    },
  });
};