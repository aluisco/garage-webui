package schema

import (
	"encoding/json"
	"time"
)

// S3Action represents AWS S3 API actions
type S3Action string

const (
	// Object-level permissions
	S3ActionGetObject         S3Action = "s3:GetObject"
	S3ActionPutObject         S3Action = "s3:PutObject"
	S3ActionDeleteObject      S3Action = "s3:DeleteObject"
	S3ActionGetObjectAcl      S3Action = "s3:GetObjectAcl"
	S3ActionPutObjectAcl      S3Action = "s3:PutObjectAcl"
	S3ActionGetObjectVersion  S3Action = "s3:GetObjectVersion"
	S3ActionDeleteObjectVersion S3Action = "s3:DeleteObjectVersion"

	// Object locking permissions
	S3ActionPutObjectLegalHold   S3Action = "s3:PutObjectLegalHold"
	S3ActionGetObjectLegalHold   S3Action = "s3:GetObjectLegalHold"
	S3ActionPutObjectRetention   S3Action = "s3:PutObjectRetention"
	S3ActionGetObjectRetention   S3Action = "s3:GetObjectRetention"
	S3ActionBypassGovernanceRetention S3Action = "s3:BypassGovernanceRetention"

	// Multipart upload permissions
	S3ActionAbortMultipartUpload     S3Action = "s3:AbortMultipartUpload"
	S3ActionListMultipartUploadParts S3Action = "s3:ListMultipartUploadParts"

	// Bucket-level permissions
	S3ActionListBucket              S3Action = "s3:ListBucket"
	S3ActionListBucketVersions      S3Action = "s3:ListBucketVersions"
	S3ActionGetBucketLocation       S3Action = "s3:GetBucketLocation"
	S3ActionGetBucketAcl            S3Action = "s3:GetBucketAcl"
	S3ActionPutBucketAcl            S3Action = "s3:PutBucketAcl"
	S3ActionGetBucketPolicy         S3Action = "s3:GetBucketPolicy"
	S3ActionPutBucketPolicy         S3Action = "s3:PutBucketPolicy"
	S3ActionDeleteBucketPolicy      S3Action = "s3:DeleteBucketPolicy"
	S3ActionGetBucketVersioning     S3Action = "s3:GetBucketVersioning"
	S3ActionPutBucketVersioning     S3Action = "s3:PutBucketVersioning"
	S3ActionGetBucketObjectLockConfiguration S3Action = "s3:GetBucketObjectLockConfiguration"
	S3ActionPutBucketObjectLockConfiguration S3Action = "s3:PutBucketObjectLockConfiguration"

	// Bucket management permissions
	S3ActionCreateBucket S3Action = "s3:CreateBucket"
	S3ActionDeleteBucket S3Action = "s3:DeleteBucket"

	// List permissions
	S3ActionListAllMyBuckets        S3Action = "s3:ListAllMyBuckets"
	S3ActionListBucketMultipartUploads S3Action = "s3:ListBucketMultipartUploads"
)

// S3Effect represents permission effect (Allow/Deny)
type S3Effect string

const (
	S3EffectAllow S3Effect = "Allow"
	S3EffectDeny  S3Effect = "Deny"
)

// S3Statement represents a policy statement
type S3Statement struct {
	ID        string     `json:"id,omitempty"`
	Effect    S3Effect   `json:"effect"`
	Actions   []S3Action `json:"actions"`
	Resources []string   `json:"resources"`
	Condition *S3Condition `json:"condition,omitempty"`
}

// S3Condition represents policy conditions
type S3Condition struct {
	StringEquals    map[string]interface{} `json:"StringEquals,omitempty"`
	StringNotEquals map[string]interface{} `json:"StringNotEquals,omitempty"`
	StringLike      map[string]interface{} `json:"StringLike,omitempty"`
	StringNotLike   map[string]interface{} `json:"StringNotLike,omitempty"`
	IpAddress       map[string]interface{} `json:"IpAddress,omitempty"`
	NotIpAddress    map[string]interface{} `json:"NotIpAddress,omitempty"`
	DateGreaterThan map[string]interface{} `json:"DateGreaterThan,omitempty"`
	DateLessThan    map[string]interface{} `json:"DateLessThan,omitempty"`
}

// S3Policy represents a complete S3 IAM policy
type S3Policy struct {
	Version   string        `json:"version"`
	ID        string        `json:"id,omitempty"`
	Statements []S3Statement `json:"statements"`
}

// S3KeyPermissions represents enhanced key permissions with S3 actions
type S3KeyPermissions struct {
	AccessKeyID   string    `json:"access_key_id"`
	Name          string    `json:"name"`
	Policy        S3Policy  `json:"policy"`
	LegacyPermissions *Permissions `json:"legacy_permissions,omitempty"` // For backward compatibility
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// ObjectLockConfiguration represents bucket object lock settings
type ObjectLockConfiguration struct {
	ObjectLockEnabled bool `json:"object_lock_enabled"`
	Rule             *ObjectLockRule `json:"rule,omitempty"`
}

// ObjectLockRule represents object lock rule
type ObjectLockRule struct {
	DefaultRetention *DefaultRetention `json:"default_retention,omitempty"`
}

// DefaultRetention represents default retention settings
type DefaultRetention struct {
	Mode  ObjectLockRetentionMode `json:"mode"`
	Days  *int                   `json:"days,omitempty"`
	Years *int                   `json:"years,omitempty"`
}

// ObjectLockRetentionMode represents retention mode
type ObjectLockRetentionMode string

const (
	ObjectLockRetentionCompliance ObjectLockRetentionMode = "COMPLIANCE"
	ObjectLockRetentionGovernance ObjectLockRetentionMode = "GOVERNANCE"
)

// ObjectRetention represents object-level retention
type ObjectRetention struct {
	Mode            ObjectLockRetentionMode `json:"mode"`
	RetainUntilDate time.Time              `json:"retain_until_date"`
}

// ObjectLegalHold represents object legal hold
type ObjectLegalHold struct {
	Status ObjectLegalHoldStatus `json:"status"`
}

// ObjectLegalHoldStatus represents legal hold status
type ObjectLegalHoldStatus string

const (
	ObjectLegalHoldOn  ObjectLegalHoldStatus = "ON"
	ObjectLegalHoldOff ObjectLegalHoldStatus = "OFF"
)

// HasAction checks if the policy allows a specific action on a resource
func (p *S3Policy) HasAction(action S3Action, resource string) bool {
	for _, statement := range p.Statements {
		// Check if action matches
		actionMatches := false
		for _, stmtAction := range statement.Actions {
			if stmtAction == action || stmtAction == "s3:*" {
				actionMatches = true
				break
			}
		}
		if !actionMatches {
			continue
		}

		// Check if resource matches
		resourceMatches := false
		for _, stmtResource := range statement.Resources {
			if matchResource(stmtResource, resource) {
				resourceMatches = true
				break
			}
		}
		if !resourceMatches {
			continue
		}

		// If we have a match, check effect
		if statement.Effect == S3EffectAllow {
			return true
		}
	}
	return false
}

// matchResource checks if a resource pattern matches a specific resource
func matchResource(pattern, resource string) bool {
	if pattern == "*" {
		return true
	}
	if pattern == resource {
		return true
	}
	// Simple wildcard matching for now
	// In a full implementation, you'd want proper ARN matching
	return false
}

// GetPresetPolicies returns common preset policies
func GetPresetPolicies() map[string]S3Policy {
	return map[string]S3Policy{
		"ReadOnly": {
			Version: "2012-10-17",
			ID:      "ReadOnlyPolicy",
			Statements: []S3Statement{
				{
					Effect: S3EffectAllow,
					Actions: []S3Action{
						S3ActionGetObject,
						S3ActionListBucket,
						S3ActionGetBucketLocation,
					},
					Resources: []string{"*"},
				},
			},
		},
		"ReadWrite": {
			Version: "2012-10-17",
			ID:      "ReadWritePolicy",
			Statements: []S3Statement{
				{
					Effect: S3EffectAllow,
					Actions: []S3Action{
						S3ActionGetObject,
						S3ActionPutObject,
						S3ActionDeleteObject,
						S3ActionListBucket,
						S3ActionGetBucketLocation,
						S3ActionAbortMultipartUpload,
						S3ActionListMultipartUploadParts,
					},
					Resources: []string{"*"},
				},
			},
		},
		"FullAccess": {
			Version: "2012-10-17",
			ID:      "FullAccessPolicy",
			Statements: []S3Statement{
				{
					Effect: S3EffectAllow,
					Actions: []S3Action{"s3:*"},
					Resources: []string{"*"},
				},
			},
		},
		"ObjectLockManager": {
			Version: "2012-10-17",
			ID:      "ObjectLockManagerPolicy",
			Statements: []S3Statement{
				{
					Effect: S3EffectAllow,
					Actions: []S3Action{
						S3ActionGetObject,
						S3ActionPutObject,
						S3ActionGetObjectRetention,
						S3ActionPutObjectRetention,
						S3ActionGetObjectLegalHold,
						S3ActionPutObjectLegalHold,
						S3ActionListBucket,
						S3ActionGetBucketObjectLockConfiguration,
						S3ActionPutBucketObjectLockConfiguration,
					},
					Resources: []string{"*"},
				},
			},
		},
	}
}

// ConvertLegacyPermissions converts old permission format to new S3 policy format
func ConvertLegacyPermissions(legacy Permissions) S3Policy {
	var actions []S3Action

	if legacy.Read {
		actions = append(actions,
			S3ActionGetObject,
			S3ActionListBucket,
			S3ActionGetBucketLocation,
		)
	}

	if legacy.Write {
		actions = append(actions,
			S3ActionPutObject,
			S3ActionDeleteObject,
			S3ActionAbortMultipartUpload,
			S3ActionListMultipartUploadParts,
		)
	}

	if legacy.Owner {
		actions = append(actions,
			S3ActionGetBucketAcl,
			S3ActionPutBucketAcl,
			S3ActionGetBucketPolicy,
			S3ActionPutBucketPolicy,
			S3ActionDeleteBucketPolicy,
		)
	}

	return S3Policy{
		Version: "2012-10-17",
		ID:      "ConvertedLegacyPolicy",
		Statements: []S3Statement{
			{
				Effect:    S3EffectAllow,
				Actions:   actions,
				Resources: []string{"*"},
			},
		},
	}
}

// ToJSON converts policy to JSON string
func (p *S3Policy) ToJSON() (string, error) {
	data, err := json.MarshalIndent(p, "", "  ")
	return string(data), err
}

// FromJSON creates policy from JSON string
func (p *S3Policy) FromJSON(data string) error {
	return json.Unmarshal([]byte(data), p)
}