package router

import (
	"encoding/json"
	"fmt"
	"khairul169/garage-webui/schema"
	"khairul169/garage-webui/utils"
	"net/http"

	"github.com/gorilla/mux"
)

type S3Permissions struct{}

// UpdateKeyPermissionsRequest represents request to update key permissions
type UpdateKeyPermissionsRequest struct {
	BucketID    string              `json:"bucket_id"`
	AccessKeyID string              `json:"access_key_id"`
	PolicyType  string              `json:"policy_type"` // "preset" or "custom"
	PolicyName  string              `json:"policy_name,omitempty"` // For preset policies
	Policy      *schema.S3Policy    `json:"policy,omitempty"` // For custom policies
	LegacyMode  bool                `json:"legacy_mode,omitempty"` // Whether to use legacy permissions
	Legacy      *schema.Permissions `json:"legacy,omitempty"` // Legacy permissions
}

// GetKeyPermissionsResponse represents response with key permissions
type GetKeyPermissionsResponse struct {
	AccessKeyID     string              `json:"access_key_id"`
	Name            string              `json:"name"`
	LegacyMode      bool                `json:"legacy_mode"`
	LegacyPermissions *schema.Permissions `json:"legacy_permissions,omitempty"`
	S3Policy        *schema.S3Policy    `json:"s3_policy,omitempty"`
	PolicyJSON      string              `json:"policy_json,omitempty"`
}

// GetKeyPermissions returns current permissions for a key
func (sp *S3Permissions) GetKeyPermissions(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !sp.checkPermission(r, schema.PermissionReadKeys) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	bucketID := vars["bucketId"]
	accessKeyID := vars["accessKeyId"]

	// Get bucket info from Garage
	body, err := utils.Garage.Fetch(fmt.Sprintf("/v2/GetBucketInfo?id=%s", bucketID), &utils.FetchOptions{})
	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	var bucket schema.Bucket
	if err := json.Unmarshal(body, &bucket); err != nil {
		utils.ResponseError(w, err)
		return
	}

	// Find the key
	var keyElement *schema.KeyElement
	for i := range bucket.Keys {
		if bucket.Keys[i].AccessKeyID == accessKeyID {
			keyElement = &bucket.Keys[i]
			break
		}
	}

	if keyElement == nil {
		utils.ResponseErrorStatus(w, fmt.Errorf("key not found"), http.StatusNotFound)
		return
	}

	response := GetKeyPermissionsResponse{
		AccessKeyID:     keyElement.AccessKeyID,
		Name:            keyElement.Name,
		LegacyMode:      keyElement.S3Policy == nil,
		LegacyPermissions: &keyElement.Permissions,
		S3Policy:        keyElement.S3Policy,
	}

	// Generate JSON representation of the policy
	if keyElement.S3Policy != nil {
		if policyJSON, err := keyElement.S3Policy.ToJSON(); err == nil {
			response.PolicyJSON = policyJSON
		}
	}

	utils.ResponseSuccess(w, response)
}

// UpdateKeyPermissions updates permissions for a key
func (sp *S3Permissions) UpdateKeyPermissions(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !sp.checkPermission(r, schema.PermissionWriteKeys) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	bucketID := vars["bucketId"]
	accessKeyID := vars["accessKeyId"]

	var req UpdateKeyPermissionsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ResponseError(w, err)
		return
	}

	// Validate request
	if req.LegacyMode && req.Legacy == nil {
		utils.ResponseErrorStatus(w, fmt.Errorf("legacy permissions required when legacy_mode is true"), http.StatusBadRequest)
		return
	}

	if !req.LegacyMode {
		if req.PolicyType == "preset" && req.PolicyName == "" {
			utils.ResponseErrorStatus(w, fmt.Errorf("policy_name required for preset policies"), http.StatusBadRequest)
			return
		}
		if req.PolicyType == "custom" && req.Policy == nil {
			utils.ResponseErrorStatus(w, fmt.Errorf("policy required for custom policies"), http.StatusBadRequest)
			return
		}
	}

	// Build the policy based on request type
	var policy *schema.S3Policy
	if !req.LegacyMode {
		if req.PolicyType == "preset" {
			presets := schema.GetPresetPolicies()
			if presetPolicy, exists := presets[req.PolicyName]; exists {
				policy = &presetPolicy
			} else {
				utils.ResponseErrorStatus(w, fmt.Errorf("unknown preset policy: %s", req.PolicyName), http.StatusBadRequest)
				return
			}
		} else if req.PolicyType == "custom" {
			policy = req.Policy
		}
	}

	// Build the Garage API request for updating key permissions
	var garageReq map[string]interface{}

	if req.LegacyMode {
		// Use legacy permission format for Garage API
		garageReq = map[string]interface{}{
			"permissions": map[string]interface{}{
				"read":  req.Legacy.Read,
				"write": req.Legacy.Write,
				"owner": req.Legacy.Owner,
			},
		}
	} else {
		// Convert S3 policy to Garage's expected format
		// For now, we'll convert back to legacy format since Garage doesn't support full S3 policies yet
		legacyPerms := sp.convertS3PolicyToLegacy(policy)
		garageReq = map[string]interface{}{
			"permissions": map[string]interface{}{
				"read":  legacyPerms.Read,
				"write": legacyPerms.Write,
				"owner": legacyPerms.Owner,
			},
		}
	}

	// Update permissions in Garage using AllowBucketKey endpoint
	_, err := utils.Garage.Fetch(fmt.Sprintf("/v2/AllowBucketKey?id=%s&accessKeyId=%s", bucketID, accessKeyID), &utils.FetchOptions{
		Method: "POST",
		Body:   garageReq,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	})

	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	// Return success response
	utils.ResponseSuccess(w, map[string]interface{}{
		"message":        "Key permissions updated successfully",
		"access_key_id":  accessKeyID,
		"legacy_mode":    req.LegacyMode,
		"policy_applied": policy != nil,
	})
}

// GetPresetPolicies returns available preset policies
func (sp *S3Permissions) GetPresetPolicies(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !sp.checkPermission(r, schema.PermissionReadKeys) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	presets := schema.GetPresetPolicies()

	// Convert to response format with descriptions
	response := make(map[string]interface{})
	for name, policy := range presets {
		policyJSON, _ := policy.ToJSON()
		response[name] = map[string]interface{}{
			"name":        name,
			"description": sp.getPolicyDescription(name),
			"policy":      policy,
			"policy_json": policyJSON,
		}
	}

	utils.ResponseSuccess(w, response)
}

// ValidateS3Policy validates a custom S3 policy
func (sp *S3Permissions) ValidateS3Policy(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !sp.checkPermission(r, schema.PermissionReadKeys) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	var policy schema.S3Policy
	if err := json.NewDecoder(r.Body).Decode(&policy); err != nil {
		utils.ResponseErrorStatus(w, fmt.Errorf("invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	// Basic validation
	errors := sp.validatePolicy(&policy)

	response := map[string]interface{}{
		"valid":  len(errors) == 0,
		"errors": errors,
	}

	if len(errors) == 0 {
		response["message"] = "Policy is valid"
		// Convert to legacy permissions for preview
		legacy := sp.convertS3PolicyToLegacy(&policy)
		response["legacy_equivalent"] = legacy
	}

	utils.ResponseSuccess(w, response)
}

// convertS3PolicyToLegacy converts S3 policy to legacy permissions
func (sp *S3Permissions) convertS3PolicyToLegacy(policy *schema.S3Policy) schema.Permissions {
	permissions := schema.Permissions{}

	for _, statement := range policy.Statements {
		if statement.Effect != schema.S3EffectAllow {
			continue
		}

		for _, action := range statement.Actions {
			switch action {
			case schema.S3ActionGetObject, schema.S3ActionListBucket, schema.S3ActionGetBucketLocation:
				permissions.Read = true
			case schema.S3ActionPutObject, schema.S3ActionDeleteObject:
				permissions.Write = true
			case schema.S3ActionGetBucketAcl, schema.S3ActionPutBucketAcl, "s3:*":
				permissions.Owner = true
			}
		}
	}

	return permissions
}

// validatePolicy performs basic validation on S3 policy
func (sp *S3Permissions) validatePolicy(policy *schema.S3Policy) []string {
	var errors []string

	if policy.Version == "" {
		errors = append(errors, "Policy version is required")
	}

	if len(policy.Statements) == 0 {
		errors = append(errors, "Policy must contain at least one statement")
	}

	for i, statement := range policy.Statements {
		if statement.Effect != schema.S3EffectAllow && statement.Effect != schema.S3EffectDeny {
			errors = append(errors, fmt.Sprintf("Statement %d: Effect must be 'Allow' or 'Deny'", i))
		}

		if len(statement.Actions) == 0 {
			errors = append(errors, fmt.Sprintf("Statement %d: Must contain at least one action", i))
		}

		if len(statement.Resources) == 0 {
			errors = append(errors, fmt.Sprintf("Statement %d: Must contain at least one resource", i))
		}
	}

	return errors
}

// getPolicyDescription returns description for preset policies
func (sp *S3Permissions) getPolicyDescription(name string) string {
	descriptions := map[string]string{
		"ReadOnly":          "Allows read-only access to objects and bucket listing",
		"ReadWrite":         "Allows read and write access to objects, including uploads and deletions",
		"FullAccess":        "Grants full administrative access to all S3 operations",
		"ObjectLockManager": "Allows managing object retention and legal holds for compliance",
	}

	if desc, exists := descriptions[name]; exists {
		return desc
	}
	return "Custom policy"
}

// checkPermission checks if user has required permission
func (sp *S3Permissions) checkPermission(r *http.Request, permission schema.Permission) bool {
	userID := utils.Session.Get(r, "user_id")
	if userID == nil {
		return false
	}

	user, err := utils.DB.GetUser(userID.(string))
	if err != nil {
		return false
	}

	return user.HasPermission(permission)
}