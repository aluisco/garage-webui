import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  KeyPermissions,
  UpdateKeyPermissionsRequest,
  PresetPolicy,
  ValidatePolicyResponse,
  S3Policy,
  ObjectLockConfiguration,
  ObjectRetention,
  ObjectLegalHold,
  ListObjectsWithLockingResponse,
} from "@/types/s3-permissions";
import { toast } from "sonner";

// Key Permissions hooks
export const useKeyPermissions = (bucketId: string, accessKeyId: string) => {
  return useQuery({
    queryKey: ["key-permissions", bucketId, accessKeyId],
    queryFn: async () => {
      const response = await api.get<KeyPermissions>(
        `/buckets/${bucketId}/keys/${accessKeyId}/permissions`
      );
      return response?.data;
    },
    enabled: !!bucketId && !!accessKeyId,
  });
};

export const useUpdateKeyPermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateKeyPermissionsRequest) =>
      api.put(`/buckets/${data.bucket_id}/keys/${data.access_key_id}/permissions`, {
        body: data,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["key-permissions", variables.bucket_id, variables.access_key_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["buckets"],
      });
      toast.success("Permisos de llave actualizados exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar permisos de llave");
    },
  });
};

// Preset Policies hooks
export const usePresetPolicies = () => {
  return useQuery({
    queryKey: ["preset-policies"],
    queryFn: async () => {
      const response = await api.get<Record<string, PresetPolicy>>("/s3/policies/presets");
      return response?.data || {};
    },
  });
};

export const useValidateS3Policy = () => {
  return useMutation({
    mutationFn: (policy: S3Policy) =>
      api.post<ValidatePolicyResponse>("/s3/policies/validate", { body: policy }),
    onError: (error: any) => {
      toast.error(error.message || "Error al validar política");
    },
  });
};

// Object Locking hooks
export const useBucketObjectLockConfiguration = (bucketId: string) => {
  return useQuery({
    queryKey: ["bucket-object-lock", bucketId],
    queryFn: async () => {
      const response = await api.get<{
        bucket_id: string;
        object_lock_configuration: ObjectLockConfiguration;
        object_lock_enabled: boolean;
      }>(`/buckets/${bucketId}/object-lock`);
      return response?.data;
    },
    enabled: !!bucketId,
  });
};

export const useUpdateBucketObjectLockConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bucketId, config }: { bucketId: string; config: ObjectLockConfiguration }) =>
      api.put(`/buckets/${bucketId}/object-lock`, {
        body: {
          bucket_id: bucketId,
          object_lock_configuration: config,
        },
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bucket-object-lock", variables.bucketId],
      });
      queryClient.invalidateQueries({
        queryKey: ["buckets"],
      });
      toast.success("Configuración de Object Lock actualizada exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar configuración de Object Lock");
    },
  });
};

export const useObjectsWithLocking = (
  bucketId: string,
  options?: { prefix?: string; delimiter?: string }
) => {
  return useQuery({
    queryKey: ["objects-with-locking", bucketId, options],
    queryFn: async () => {
      const response = await api.get<ListObjectsWithLockingResponse>(`/buckets/${bucketId}/objects`, {
        params: options,
      });
      return response?.data;
    },
    enabled: !!bucketId,
  });
};

export const useObjectRetention = (bucketId: string, objectKey: string) => {
  return useQuery({
    queryKey: ["object-retention", bucketId, objectKey],
    queryFn: async () => {
      const response = await api.get<{
        bucket_id: string;
        object_key: string;
        retention: ObjectRetention;
      }>(`/buckets/${bucketId}/objects/${encodeURIComponent(objectKey)}/retention`);
      return response?.data;
    },
    enabled: !!bucketId && !!objectKey,
  });
};

export const useUpdateObjectRetention = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bucketId,
      objectKey,
      retention,
    }: {
      bucketId: string;
      objectKey: string;
      retention: ObjectRetention;
    }) =>
      api.put(`/buckets/${bucketId}/objects/${encodeURIComponent(objectKey)}/retention`, {
        body: {
          bucket_id: bucketId,
          object_key: objectKey,
          retention,
        },
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["object-retention", variables.bucketId, variables.objectKey],
      });
      queryClient.invalidateQueries({
        queryKey: ["objects-with-locking", variables.bucketId],
      });
      toast.success("Retención de objeto actualizada exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar retención de objeto");
    },
  });
};

export const useObjectLegalHold = (bucketId: string, objectKey: string) => {
  return useQuery({
    queryKey: ["object-legal-hold", bucketId, objectKey],
    queryFn: async () => {
      const response = await api.get<{
        bucket_id: string;
        object_key: string;
        legal_hold: ObjectLegalHold;
      }>(`/buckets/${bucketId}/objects/${encodeURIComponent(objectKey)}/legal-hold`);
      return response?.data;
    },
    enabled: !!bucketId && !!objectKey,
  });
};

export const useUpdateObjectLegalHold = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bucketId,
      objectKey,
      legalHold,
    }: {
      bucketId: string;
      objectKey: string;
      legalHold: ObjectLegalHold;
    }) =>
      api.put(`/buckets/${bucketId}/objects/${encodeURIComponent(objectKey)}/legal-hold`, {
        body: {
          bucket_id: bucketId,
          object_key: objectKey,
          legal_hold: legalHold,
        },
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["object-legal-hold", variables.bucketId, variables.objectKey],
      });
      queryClient.invalidateQueries({
        queryKey: ["objects-with-locking", variables.bucketId],
      });
      toast.success("Legal Hold actualizado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar Legal Hold");
    },
  });
};