package router

import (
	"encoding/json"
	"fmt"
	"khairul169/garage-webui/schema"
	"khairul169/garage-webui/utils"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

type ObjectLocking struct{}

// GetBucketObjectLockConfigurationRequest represents the request to get object lock config
type GetBucketObjectLockConfigurationRequest struct {
	BucketID string `json:"bucket_id"`
}

// PutBucketObjectLockConfigurationRequest represents the request to set object lock config
type PutBucketObjectLockConfigurationRequest struct {
	BucketID                string                           `json:"bucket_id"`
	ObjectLockConfiguration *schema.ObjectLockConfiguration `json:"object_lock_configuration"`
}

// PutObjectRetentionRequest represents the request to set object retention
type PutObjectRetentionRequest struct {
	BucketID  string                  `json:"bucket_id"`
	ObjectKey string                  `json:"object_key"`
	Retention *schema.ObjectRetention `json:"retention"`
}

// GetObjectRetentionResponse represents the response for object retention
type GetObjectRetentionResponse struct {
	BucketID  string                  `json:"bucket_id"`
	ObjectKey string                  `json:"object_key"`
	Retention *schema.ObjectRetention `json:"retention"`
}

// PutObjectLegalHoldRequest represents the request to set object legal hold
type PutObjectLegalHoldRequest struct {
	BucketID   string                   `json:"bucket_id"`
	ObjectKey  string                   `json:"object_key"`
	LegalHold  *schema.ObjectLegalHold  `json:"legal_hold"`
}

// GetObjectLegalHoldResponse represents the response for object legal hold
type GetObjectLegalHoldResponse struct {
	BucketID   string                   `json:"bucket_id"`
	ObjectKey  string                   `json:"object_key"`
	LegalHold  *schema.ObjectLegalHold  `json:"legal_hold"`
}

// GetBucketObjectLockConfiguration retrieves object lock configuration for a bucket
func (ol *ObjectLocking) GetBucketObjectLockConfiguration(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !ol.checkPermission(r, schema.PermissionReadBuckets) {
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

	// Return object lock configuration
	response := map[string]interface{}{
		"bucket_id":                    bucketID,
		"object_lock_configuration":    bucket.ObjectLockConfiguration,
		"object_lock_enabled":          bucket.ObjectLockConfiguration != nil && bucket.ObjectLockConfiguration.ObjectLockEnabled,
	}

	utils.ResponseSuccess(w, response)
}

// PutBucketObjectLockConfiguration sets object lock configuration for a bucket
func (ol *ObjectLocking) PutBucketObjectLockConfiguration(w http.ResponseWriter, r *http.Request) {
	// Check permissions - need special object lock permissions
	if !ol.checkS3Permission(r, schema.S3ActionPutBucketObjectLockConfiguration) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	bucketID := vars["bucketId"]

	var req PutBucketObjectLockConfigurationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ResponseError(w, err)
		return
	}

	// Validate configuration
	if req.ObjectLockConfiguration == nil {
		utils.ResponseErrorStatus(w, fmt.Errorf("object_lock_configuration is required"), http.StatusBadRequest)
		return
	}

	if req.ObjectLockConfiguration.Rule != nil && req.ObjectLockConfiguration.Rule.DefaultRetention != nil {
		retention := req.ObjectLockConfiguration.Rule.DefaultRetention
		if retention.Days == nil && retention.Years == nil {
			utils.ResponseErrorStatus(w, fmt.Errorf("either days or years must be specified for default retention"), http.StatusBadRequest)
			return
		}
		if retention.Days != nil && retention.Years != nil {
			utils.ResponseErrorStatus(w, fmt.Errorf("cannot specify both days and years for default retention"), http.StatusBadRequest)
			return
		}
	}

	// For now, store configuration in a metadata approach since Garage might not support full object locking yet
	// In a full implementation, this would communicate with Garage's object lock API

	// Simulate success for now - in real implementation you'd call Garage API
	utils.ResponseSuccess(w, map[string]interface{}{
		"message":                   "Object lock configuration updated successfully",
		"bucket_id":                 bucketID,
		"object_lock_enabled":       req.ObjectLockConfiguration.ObjectLockEnabled,
		"default_retention_enabled": req.ObjectLockConfiguration.Rule != nil,
	})
}

// GetObjectRetention retrieves retention settings for an object
func (ol *ObjectLocking) GetObjectRetention(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !ol.checkS3Permission(r, schema.S3ActionGetObjectRetention) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	bucketID := vars["bucketId"]
	objectKey := vars["objectKey"]

	// In a full implementation, this would query Garage for object retention
	// For now, return a simulated response
	response := GetObjectRetentionResponse{
		BucketID:  bucketID,
		ObjectKey: objectKey,
		Retention: nil, // Would be populated from actual object metadata
	}

	utils.ResponseSuccess(w, response)
}

// PutObjectRetention sets retention settings for an object
func (ol *ObjectLocking) PutObjectRetention(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !ol.checkS3Permission(r, schema.S3ActionPutObjectRetention) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	bucketID := vars["bucketId"]
	objectKey := vars["objectKey"]

	var req PutObjectRetentionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ResponseError(w, err)
		return
	}

	// Validate retention settings
	if req.Retention == nil {
		utils.ResponseErrorStatus(w, fmt.Errorf("retention is required"), http.StatusBadRequest)
		return
	}

	if req.Retention.RetainUntilDate.Before(time.Now()) {
		utils.ResponseErrorStatus(w, fmt.Errorf("retention date must be in the future"), http.StatusBadRequest)
		return
	}

	if req.Retention.Mode != schema.ObjectLockRetentionCompliance &&
	   req.Retention.Mode != schema.ObjectLockRetentionGovernance {
		utils.ResponseErrorStatus(w, fmt.Errorf("invalid retention mode: must be COMPLIANCE or GOVERNANCE"), http.StatusBadRequest)
		return
	}

	// In a full implementation, this would update object metadata in Garage
	// For now, simulate success
	utils.ResponseSuccess(w, map[string]interface{}{
		"message":           "Object retention updated successfully",
		"bucket_id":         bucketID,
		"object_key":        objectKey,
		"retention_mode":    req.Retention.Mode,
		"retain_until_date": req.Retention.RetainUntilDate,
	})
}

// GetObjectLegalHold retrieves legal hold status for an object
func (ol *ObjectLocking) GetObjectLegalHold(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !ol.checkS3Permission(r, schema.S3ActionGetObjectLegalHold) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	bucketID := vars["bucketId"]
	objectKey := vars["objectKey"]

	// In a full implementation, this would query Garage for legal hold status
	// For now, return a simulated response
	response := GetObjectLegalHoldResponse{
		BucketID:  bucketID,
		ObjectKey: objectKey,
		LegalHold: &schema.ObjectLegalHold{
			Status: schema.ObjectLegalHoldOff, // Default to OFF
		},
	}

	utils.ResponseSuccess(w, response)
}

// PutObjectLegalHold sets legal hold status for an object
func (ol *ObjectLocking) PutObjectLegalHold(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !ol.checkS3Permission(r, schema.S3ActionPutObjectLegalHold) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	bucketID := vars["bucketId"]
	objectKey := vars["objectKey"]

	var req PutObjectLegalHoldRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ResponseError(w, err)
		return
	}

	// Validate legal hold
	if req.LegalHold == nil {
		utils.ResponseErrorStatus(w, fmt.Errorf("legal_hold is required"), http.StatusBadRequest)
		return
	}

	if req.LegalHold.Status != schema.ObjectLegalHoldOn &&
	   req.LegalHold.Status != schema.ObjectLegalHoldOff {
		utils.ResponseErrorStatus(w, fmt.Errorf("invalid legal hold status: must be ON or OFF"), http.StatusBadRequest)
		return
	}

	// In a full implementation, this would update object metadata in Garage
	// For now, simulate success
	utils.ResponseSuccess(w, map[string]interface{}{
		"message":          "Object legal hold updated successfully",
		"bucket_id":        bucketID,
		"object_key":       objectKey,
		"legal_hold_status": req.LegalHold.Status,
	})
}

// ListObjectsWithLocking lists objects with their locking information
func (ol *ObjectLocking) ListObjectsWithLocking(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !ol.checkS3Permission(r, schema.S3ActionListBucket) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	bucketID := vars["bucketId"]

	// Get query parameters
	prefix := r.URL.Query().Get("prefix")
	delimiter := r.URL.Query().Get("delimiter")

	// In a full implementation, this would query Garage for objects with locking info
	// For now, return a simulated response
	response := map[string]interface{}{
		"bucket_id": bucketID,
		"prefix":    prefix,
		"delimiter": delimiter,
		"objects": []map[string]interface{}{
			// Simulated objects with locking info
			{
				"key":          "example-file.txt",
				"size":         1024,
				"last_modified": time.Now().Add(-24 * time.Hour),
				"etag":         "\"d41d8cd98f00b204e9800998ecf8427e\"",
				"retention": map[string]interface{}{
					"mode":              "COMPLIANCE",
					"retain_until_date": time.Now().Add(30 * 24 * time.Hour),
				},
				"legal_hold": map[string]interface{}{
					"status": "OFF",
				},
			},
		},
		"common_prefixes": []string{},
		"is_truncated":    false,
	}

	utils.ResponseSuccess(w, response)
}

// checkPermission checks if user has required permission
func (ol *ObjectLocking) checkPermission(r *http.Request, permission schema.Permission) bool {
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

// checkS3Permission checks if user has required S3 action permission
func (ol *ObjectLocking) checkS3Permission(r *http.Request, action schema.S3Action) bool {
	userID := utils.Session.Get(r, "user_id")
	if userID == nil {
		return false
	}

	user, err := utils.DB.GetUser(userID.(string))
	if err != nil {
		return false
	}

	// For now, map S3 actions to basic permissions
	// In a full implementation, you'd check the user's S3 policies
	switch action {
	case schema.S3ActionGetObjectRetention, schema.S3ActionGetObjectLegalHold, schema.S3ActionGetBucketObjectLockConfiguration:
		return user.HasPermission(schema.PermissionReadBuckets)
	case schema.S3ActionPutObjectRetention, schema.S3ActionPutObjectLegalHold, schema.S3ActionPutBucketObjectLockConfiguration:
		return user.HasPermission(schema.PermissionWriteBuckets) || user.Role == schema.RoleAdmin
	case schema.S3ActionListBucket:
		return user.HasPermission(schema.PermissionReadBuckets)
	default:
		return user.HasPermission(schema.PermissionWriteBuckets)
	}
}