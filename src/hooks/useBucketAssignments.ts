import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BucketAssignment,
  AssignBucketRequest,
  UserBucketsResponse,
  TenantBucketsResponse,
} from "@/types/bucket-assignments";
import { toast } from "sonner";

// Get bucket assignment
export const useBucketAssignment = (bucketId: string) => {
  return useQuery({
    queryKey: ["bucket-assignment", bucketId],
    queryFn: async () => {
      const response = await api.get<BucketAssignment>(`/buckets/${bucketId}/assignment`);
      return response?.data;
    },
    enabled: !!bucketId,
  });
};

// Assign bucket to user/tenant
export const useAssignBucket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignBucketRequest) =>
      api.put(`/buckets/${data.bucket_id}/assignment`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bucket-assignment", variables.bucket_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["buckets"],
      });
      if (variables.assigned_user_id) {
        queryClient.invalidateQueries({
          queryKey: ["user-buckets", variables.assigned_user_id],
        });
      }
      if (variables.assigned_tenant_id) {
        queryClient.invalidateQueries({
          queryKey: ["tenant-buckets", variables.assigned_tenant_id],
        });
      }
      toast.success("Bucket assigned successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error assigning bucket");
    },
  });
};

// Unassign bucket
export const useUnassignBucket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bucketId: string) => api.delete(`/buckets/${bucketId}/assignment`),
    onSuccess: (_, bucketId) => {
      queryClient.invalidateQueries({
        queryKey: ["bucket-assignment", bucketId],
      });
      queryClient.invalidateQueries({
        queryKey: ["buckets"],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-buckets"],
      });
      queryClient.invalidateQueries({
        queryKey: ["tenant-buckets"],
      });
      toast.success("Bucket assignment removed successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error removing bucket assignment");
    },
  });
};

// Get buckets assigned to a user
export const useUserBuckets = (userId: string) => {
  return useQuery({
    queryKey: ["user-buckets", userId],
    queryFn: async () => {
      const response = await api.get<UserBucketsResponse>(`/users/${userId}/buckets`);
      return response?.data;
    },
    enabled: !!userId,
  });
};

// Get buckets assigned to a tenant
export const useTenantBuckets = (tenantId: string) => {
  return useQuery({
    queryKey: ["tenant-buckets", tenantId],
    queryFn: async () => {
      const response = await api.get<TenantBucketsResponse>(`/tenants/${tenantId}/buckets`);
      return response?.data;
    },
    enabled: !!tenantId,
  });
};