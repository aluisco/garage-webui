import { User, Tenant } from "@/types/admin";

export interface BucketAssignment {
  bucket_id: string;
  bucket_name: string;
  assigned_user_id?: string;
  assigned_tenant_id?: string;
  assigned_user?: User;
  assigned_tenant?: Tenant;
}

export interface AssignBucketRequest {
  bucket_id: string;
  assigned_user_id?: string;
  assigned_tenant_id?: string;
}

export interface UserBucketsResponse {
  user_id: string;
  username: string;
  buckets: BucketAssignment[];
}

export interface TenantBucketsResponse {
  tenant_id: string;
  tenant_name: string;
  buckets: BucketAssignment[];
}