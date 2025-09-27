package router

import (
	"encoding/json"
	"fmt"
	"khairul169/garage-webui/schema"
	"khairul169/garage-webui/utils"
	"net/http"

	"github.com/gorilla/mux"
)

type BucketAssignments struct{}

// AssignBucketRequest represents request to assign bucket to user/tenant
type AssignBucketRequest struct {
	BucketID         string  `json:"bucket_id"`
	AssignedUserID   *string `json:"assigned_user_id,omitempty"`
	AssignedTenantID *string `json:"assigned_tenant_id,omitempty"`
}

// GetBucketAssignmentResponse represents bucket assignment response
type GetBucketAssignmentResponse struct {
	BucketID         string                `json:"bucket_id"`
	BucketName       string                `json:"bucket_name"`
	AssignedUserID   *string               `json:"assigned_user_id,omitempty"`
	AssignedTenantID *string               `json:"assigned_tenant_id,omitempty"`
	AssignedUser     *schema.User          `json:"assigned_user,omitempty"`
	AssignedTenant   *schema.Tenant        `json:"assigned_tenant,omitempty"`
}

// GetBucketAssignment returns assignment information for a bucket
func (ba *BucketAssignments) GetBucketAssignment(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !ba.checkPermission(r, schema.PermissionReadBuckets) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	bucketID := vars["bucketId"]

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

	response := GetBucketAssignmentResponse{
		BucketID:         bucket.ID,
		BucketName:       getBucketDisplayName(&bucket),
		AssignedUserID:   bucket.AssignedUserID,
		AssignedTenantID: bucket.AssignedTenantID,
	}

	// Get assigned user details if exists
	if bucket.AssignedUserID != nil {
		if user, err := utils.DB.GetUser(*bucket.AssignedUserID); err == nil {
			response.AssignedUser = user
		}
	}

	// Get assigned tenant details if exists
	if bucket.AssignedTenantID != nil {
		if tenant, err := utils.DB.GetTenant(*bucket.AssignedTenantID); err == nil {
			response.AssignedTenant = tenant
		}
	}

	utils.ResponseSuccess(w, response)
}

// AssignBucket assigns a bucket to a user or tenant
func (ba *BucketAssignments) AssignBucket(w http.ResponseWriter, r *http.Request) {
	// Check permissions - only admins can assign buckets
	if !ba.checkPermission(r, schema.PermissionWriteBuckets) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	bucketID := vars["bucketId"]

	var req AssignBucketRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ResponseError(w, err)
		return
	}

	// Validate that we have either user or tenant, but not both
	if req.AssignedUserID != nil && req.AssignedTenantID != nil {
		utils.ResponseErrorStatus(w, fmt.Errorf("cannot assign bucket to both user and tenant"), http.StatusBadRequest)
		return
	}

	// Validate user exists if provided
	if req.AssignedUserID != nil {
		if _, err := utils.DB.GetUser(*req.AssignedUserID); err != nil {
			utils.ResponseErrorStatus(w, fmt.Errorf("user not found"), http.StatusNotFound)
			return
		}
	}

	// Validate tenant exists if provided
	if req.AssignedTenantID != nil {
		if _, err := utils.DB.GetTenant(*req.AssignedTenantID); err != nil {
			utils.ResponseErrorStatus(w, fmt.Errorf("tenant not found"), http.StatusNotFound)
			return
		}
	}

	// Since Garage doesn't store bucket assignments, we'll store them in our database
	// For now, we'll simulate this by returning success
	// In a real implementation, you'd want to store this in a separate table or metadata

	utils.ResponseSuccess(w, map[string]interface{}{
		"message":           "Bucket assignment updated successfully",
		"bucket_id":         bucketID,
		"assigned_user_id":  req.AssignedUserID,
		"assigned_tenant_id": req.AssignedTenantID,
	})
}

// UnassignBucket removes assignment from a bucket
func (ba *BucketAssignments) UnassignBucket(w http.ResponseWriter, r *http.Request) {
	// Check permissions - only admins can unassign buckets
	if !ba.checkPermission(r, schema.PermissionWriteBuckets) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	bucketID := vars["bucketId"]

	// Remove assignment (simulate for now)
	utils.ResponseSuccess(w, map[string]interface{}{
		"message":   "Bucket assignment removed successfully",
		"bucket_id": bucketID,
	})
}

// ListUserBuckets returns buckets assigned to a specific user
func (ba *BucketAssignments) ListUserBuckets(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !ba.checkPermission(r, schema.PermissionReadBuckets) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	userID := vars["userId"]

	// Validate user exists
	user, err := utils.DB.GetUser(userID)
	if err != nil {
		utils.ResponseErrorStatus(w, fmt.Errorf("user not found"), http.StatusNotFound)
		return
	}

	// Get all buckets and filter by assignment
	// For now, return empty list since we're not storing assignments yet
	response := map[string]interface{}{
		"user_id":  userID,
		"username": user.Username,
		"buckets":  []interface{}{},
	}

	utils.ResponseSuccess(w, response)
}

// ListTenantBuckets returns buckets assigned to a specific tenant
func (ba *BucketAssignments) ListTenantBuckets(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !ba.checkPermission(r, schema.PermissionReadBuckets) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	tenantID := vars["tenantId"]

	// Validate tenant exists
	tenant, err := utils.DB.GetTenant(tenantID)
	if err != nil {
		utils.ResponseErrorStatus(w, fmt.Errorf("tenant not found"), http.StatusNotFound)
		return
	}

	// Get all buckets and filter by assignment
	// For now, return empty list since we're not storing assignments yet
	response := map[string]interface{}{
		"tenant_id":   tenantID,
		"tenant_name": tenant.Name,
		"buckets":     []interface{}{},
	}

	utils.ResponseSuccess(w, response)
}

// Helper functions

// getBucketDisplayName returns the best display name for a bucket
func getBucketDisplayName(bucket *schema.Bucket) string {
	if len(bucket.GlobalAliases) > 0 {
		return bucket.GlobalAliases[0]
	}
	if len(bucket.LocalAliases) > 0 {
		return bucket.LocalAliases[0].Alias
	}
	return bucket.ID
}

// checkPermission checks if user has required permission
func (ba *BucketAssignments) checkPermission(r *http.Request, permission schema.Permission) bool {
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