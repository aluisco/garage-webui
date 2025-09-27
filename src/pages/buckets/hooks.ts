import api from "@/lib/api";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
} from "@tanstack/react-query";
import { GetBucketRes } from "./types";
import { CreateBucketSchema } from "./schema";

export const useBuckets = () => {
  return useQuery({
    queryKey: ["buckets"],
    queryFn: async () => {
      try {
        const response = await api.get<GetBucketRes>("/buckets");
        // Handle the API response structure { data: [...], success: true }
        return response?.data || [];
      } catch (error) {
        console.error("Failed to fetch buckets:", error);
        // Return empty array on error to prevent UI crash
        return [];
      }
    },
    retry: 2,
  });
};

export const useCreateBucket = (
  options?: UseMutationOptions<any, Error, CreateBucketSchema>
) => {
  return useMutation({
    mutationFn: (body) => api.post("/v2/CreateBucket", body),
    ...options,
  });
};
