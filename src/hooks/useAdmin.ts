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
import { showSuccess, showError } from "@/lib/sweetalert";

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
      showSuccess("User created successfully");
    },
    onError: (error: any) => {
      showError(error.message || "Error creating user");
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
      showSuccess("User updated successfully");
    },
    onError: (error: any) => {
      showError(error.message || "Error updating user");
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess("User deleted successfully");
    },
    onError: (error: any) => {
      showError(error.message || "Error deleting user");
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
      showSuccess("Tenant created successfully");
    },
    onError: (error: any) => {
      showError(error.message || "Error creating tenant");
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
      showSuccess("Tenant updated successfully");
    },
    onError: (error: any) => {
      showError(error.message || "Error updating tenant");
    },
  });
};

export const useDeleteTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/tenants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      showSuccess("Tenant deleted successfully");
    },
    onError: (error: any) => {
      showError(error.message || "Error deleting tenant");
    },
  });
};