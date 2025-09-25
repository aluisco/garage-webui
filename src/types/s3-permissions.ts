// S3 Action types matching the backend
export type S3Action =
  // Object-level permissions
  | "s3:GetObject"
  | "s3:PutObject"
  | "s3:DeleteObject"
  | "s3:GetObjectAcl"
  | "s3:PutObjectAcl"
  | "s3:GetObjectVersion"
  | "s3:DeleteObjectVersion"

  // Object locking permissions
  | "s3:PutObjectLegalHold"
  | "s3:GetObjectLegalHold"
  | "s3:PutObjectRetention"
  | "s3:GetObjectRetention"
  | "s3:BypassGovernanceRetention"

  // Multipart upload permissions
  | "s3:AbortMultipartUpload"
  | "s3:ListMultipartUploadParts"

  // Bucket-level permissions
  | "s3:ListBucket"
  | "s3:ListBucketVersions"
  | "s3:GetBucketLocation"
  | "s3:GetBucketAcl"
  | "s3:PutBucketAcl"
  | "s3:GetBucketPolicy"
  | "s3:PutBucketPolicy"
  | "s3:DeleteBucketPolicy"
  | "s3:GetBucketVersioning"
  | "s3:PutBucketVersioning"
  | "s3:GetBucketObjectLockConfiguration"
  | "s3:PutBucketObjectLockConfiguration"

  // Bucket management permissions
  | "s3:CreateBucket"
  | "s3:DeleteBucket"

  // List permissions
  | "s3:ListAllMyBuckets"
  | "s3:ListBucketMultipartUploads"

  // Wildcard
  | "s3:*";

export type S3Effect = "Allow" | "Deny";

export interface S3Condition {
  StringEquals?: Record<string, any>;
  StringNotEquals?: Record<string, any>;
  StringLike?: Record<string, any>;
  StringNotLike?: Record<string, any>;
  IpAddress?: Record<string, any>;
  NotIpAddress?: Record<string, any>;
  DateGreaterThan?: Record<string, any>;
  DateLessThan?: Record<string, any>;
}

export interface S3Statement {
  id?: string;
  effect: S3Effect;
  actions: S3Action[];
  resources: string[];
  condition?: S3Condition;
}

export interface S3Policy {
  version: string;
  id?: string;
  statements: S3Statement[];
}

export interface LegacyPermissions {
  read: boolean;
  write: boolean;
  owner: boolean;
}

export interface KeyPermissions {
  access_key_id: string;
  name: string;
  legacy_mode: boolean;
  legacy_permissions?: LegacyPermissions;
  s3_policy?: S3Policy;
  policy_json?: string;
}

export interface UpdateKeyPermissionsRequest {
  bucket_id: string;
  access_key_id: string;
  policy_type: "preset" | "custom";
  policy_name?: string;
  policy?: S3Policy;
  legacy_mode?: boolean;
  legacy?: LegacyPermissions;
}

export interface PresetPolicy {
  name: string;
  description: string;
  policy: S3Policy;
  policy_json: string;
}

export interface ValidatePolicyResponse {
  valid: boolean;
  errors: string[];
  message?: string;
  legacy_equivalent?: LegacyPermissions;
}

// Object Locking types
export type ObjectLockRetentionMode = "COMPLIANCE" | "GOVERNANCE";
export type ObjectLegalHoldStatus = "ON" | "OFF";

export interface DefaultRetention {
  mode: ObjectLockRetentionMode;
  days?: number;
  years?: number;
}

export interface ObjectLockRule {
  default_retention?: DefaultRetention;
}

export interface ObjectLockConfiguration {
  object_lock_enabled: boolean;
  rule?: ObjectLockRule;
}

export interface ObjectRetention {
  mode: ObjectLockRetentionMode;
  retain_until_date: string;
}

export interface ObjectLegalHold {
  status: ObjectLegalHoldStatus;
}

export interface ObjectWithLocking {
  key: string;
  size: number;
  last_modified: string;
  etag: string;
  retention?: ObjectRetention;
  legal_hold?: ObjectLegalHold;
}

export interface ListObjectsWithLockingResponse {
  bucket_id: string;
  prefix?: string;
  delimiter?: string;
  objects: ObjectWithLocking[];
  common_prefixes: string[];
  is_truncated: boolean;
}

// Permission presets for easy UI selection
export const S3_ACTION_GROUPS = {
  "Object Read": [
    "s3:GetObject",
    "s3:GetObjectAcl",
    "s3:GetObjectVersion"
  ] as S3Action[],

  "Object Write": [
    "s3:PutObject",
    "s3:PutObjectAcl",
    "s3:DeleteObject",
    "s3:DeleteObjectVersion"
  ] as S3Action[],

  "Object Locking": [
    "s3:GetObjectRetention",
    "s3:PutObjectRetention",
    "s3:GetObjectLegalHold",
    "s3:PutObjectLegalHold",
    "s3:BypassGovernanceRetention"
  ] as S3Action[],

  "Bucket Read": [
    "s3:ListBucket",
    "s3:GetBucketLocation",
    "s3:GetBucketAcl",
    "s3:GetBucketPolicy",
    "s3:GetBucketVersioning",
    "s3:GetBucketObjectLockConfiguration"
  ] as S3Action[],

  "Bucket Write": [
    "s3:PutBucketAcl",
    "s3:PutBucketPolicy",
    "s3:DeleteBucketPolicy",
    "s3:PutBucketVersioning",
    "s3:PutBucketObjectLockConfiguration"
  ] as S3Action[],

  "Multipart Uploads": [
    "s3:AbortMultipartUpload",
    "s3:ListMultipartUploadParts",
    "s3:ListBucketMultipartUploads"
  ] as S3Action[]
} as const;

export const PRESET_POLICY_DESCRIPTIONS = {
  "ReadOnly": "Allows read-only access to objects and bucket listing",
  "ReadWrite": "Allows read and write access to objects, including uploads and deletions",
  "FullAccess": "Grants full administrative access to all S3 operations",
  "ObjectLockManager": "Allows managing object retention and legal holds for compliance"
} as const;